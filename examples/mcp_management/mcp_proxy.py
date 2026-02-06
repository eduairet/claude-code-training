#!/usr/bin/env python3
"""Stdio MCP proxy that filters tools from an upstream Streamable-HTTP MCP server.

Reads proxy_config.json for the upstream URL and allowed tool names.
Auto-calls __unlock_blockchain_analysis__ so clients never need that tool.
Python stdlib only — no third-party dependencies.
"""

import http.client
import json
import ssl
import sys
from pathlib import Path
from urllib.parse import urlparse


def log(*args):
    print("[mcp-proxy]", *args, file=sys.stderr, flush=True)


def load_config():
    config_path = Path(__file__).parent / "proxy_config.json"
    with open(config_path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Upstream: Streamable HTTP transport (POST → SSE-wrapped JSON-RPC response)
# ---------------------------------------------------------------------------

class Upstream:
    def __init__(self, url):
        self._parsed = urlparse(url)
        self._ctx = ssl.create_default_context() if self._parsed.scheme == "https" else None
        self._host = self._parsed.hostname
        self._port = self._parsed.port or (443 if self._ctx else 80)
        self._path = self._parsed.path or "/"
        self._session_id = None

    # -- low-level ---------------------------------------------------------

    def _post(self, body):
        """POST JSON bytes, return (status, headers, response_body_file)."""
        if self._ctx:
            conn = http.client.HTTPSConnection(self._host, self._port,
                                               context=self._ctx, timeout=60)
        else:
            conn = http.client.HTTPConnection(self._host, self._port, timeout=60)

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        if self._session_id:
            headers["Mcp-Session-Id"] = self._session_id

        conn.request("POST", self._path, body=body, headers=headers)
        resp = conn.getresponse()

        sid = resp.headers.get("Mcp-Session-Id")
        if sid:
            self._session_id = sid

        return resp, conn

    def _read_response(self, resp, conn):
        """Parse the HTTP response — plain JSON or SSE-wrapped."""
        ct = resp.headers.get("Content-Type", "")

        if "text/event-stream" in ct:
            result = self._read_sse(resp)
        elif resp.status == 202:
            resp.read()
            result = None
        else:
            result = json.loads(resp.read().decode())

        conn.close()
        return result

    @staticmethod
    def _read_sse(resp):
        """Read SSE events, return the payload of the first 'message' event."""
        event_type = ""
        data_buf = []

        while True:
            raw = resp.readline()
            if not raw:
                break
            line = raw.decode().rstrip("\r\n")

            if line.startswith("event:"):
                event_type = line[6:].strip()
            elif line.startswith("data:"):
                data_buf.append(line[5:].strip())
            elif line == "":
                if data_buf and event_type == "message":
                    return json.loads("\n".join(data_buf))
                event_type = ""
                data_buf = []
        return None

    # -- public API --------------------------------------------------------

    def request(self, msg):
        """Send a JSON-RPC request and return the parsed response dict."""
        resp, conn = self._post(json.dumps(msg).encode())
        return self._read_response(resp, conn)

    def notify(self, msg):
        """Send a JSON-RPC notification (no meaningful response expected)."""
        resp, conn = self._post(json.dumps(msg).encode())
        resp.read()
        conn.close()


# ---------------------------------------------------------------------------
# Proxy: stdio ↔ upstream, with tool filtering
# ---------------------------------------------------------------------------

class MCPProxy:
    def __init__(self, upstream_url, allowed_tools):
        self.upstream = Upstream(upstream_url)
        self.allowed = set(allowed_tools)
        self._uid = 9000

    def _next_id(self):
        self._uid += 1
        return self._uid

    # -- bootstrap ---------------------------------------------------------

    def start(self):
        self._init_upstream()
        self._unlock_upstream()
        log("ready")
        self._serve_stdio()

    def _init_upstream(self):
        uid = self._next_id()
        self.upstream.request({
            "jsonrpc": "2.0", "id": uid,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "mcp-proxy", "version": "1.0.0"},
            },
        })
        self.upstream.notify({"jsonrpc": "2.0", "method": "notifications/initialized"})
        log("upstream initialized")

    def _unlock_upstream(self):
        uid = self._next_id()
        self.upstream.request({
            "jsonrpc": "2.0", "id": uid,
            "method": "tools/call",
            "params": {"name": "__unlock_blockchain_analysis__", "arguments": {}},
        })
        log("upstream unlocked")

    # -- stdio loop --------------------------------------------------------

    def _serve_stdio(self):
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                msg = json.loads(line)
            except json.JSONDecodeError:
                continue
            try:
                self._handle(msg)
            except Exception as exc:
                log(f"error handling {msg.get('method')}: {exc}")
                mid = msg.get("id")
                if mid is not None:
                    self._error(mid, -32603, str(exc))

    def _handle(self, msg):
        method = msg.get("method", "")
        mid = msg.get("id")

        if method == "initialize":
            self._reply(mid, {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "blockscout-proxy", "version": "1.0.0"},
            })
        elif method == "notifications/initialized":
            pass
        elif method == "tools/list":
            self._handle_list(mid, msg)
        elif method == "tools/call":
            self._handle_call(mid, msg)
        else:
            self._forward(mid, msg)

    def _handle_list(self, mid, msg):
        uid = self._next_id()
        resp = self.upstream.request({
            "jsonrpc": "2.0", "id": uid,
            "method": "tools/list",
            "params": msg.get("params", {}),
        })
        tools = resp.get("result", {}).get("tools", [])
        filtered = [t for t in tools if t["name"] in self.allowed]
        self._reply(mid, {"tools": filtered})

    def _handle_call(self, mid, msg):
        name = msg.get("params", {}).get("name", "")
        if name not in self.allowed:
            self._error(mid, -32601, f"Tool '{name}' is not allowed by proxy")
            return
        uid = self._next_id()
        resp = self.upstream.request({
            "jsonrpc": "2.0", "id": uid,
            "method": "tools/call",
            "params": msg["params"],
        })
        if "result" in resp:
            self._reply(mid, resp["result"])
        elif "error" in resp:
            self._error(mid, resp["error"].get("code", -1),
                        resp["error"].get("message", ""))

    def _forward(self, mid, msg):
        uid = self._next_id()
        resp = self.upstream.request({**msg, "id": uid})
        resp["id"] = mid
        self._write(resp)

    # -- helpers -----------------------------------------------------------

    def _reply(self, mid, result):
        self._write({"jsonrpc": "2.0", "id": mid, "result": result})

    def _error(self, mid, code, message):
        self._write({"jsonrpc": "2.0", "id": mid,
                      "error": {"code": code, "message": message}})

    def _write(self, msg):
        sys.stdout.write(json.dumps(msg) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    cfg = load_config()
    proxy = MCPProxy(cfg["upstream_url"], cfg.get("allowed_tools", []))
    proxy.start()
