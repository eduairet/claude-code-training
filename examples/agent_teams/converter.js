// converter.js — Client-side OTF/TTF to WOFF2 converter
// Uses wawoff2 (WebAssembly port of Google's woff2 library)

(function () {
  "use strict";

  var WAWOFF2_CDN_URL =
    "https://unpkg.com/wawoff2@2.0.1/build/compress_binding.js";

  // Shared state: the loaded WASM module and its readiness promise.
  var _moduleReady = null; // Promise that resolves to the Module object

  /**
   * Dynamically load the wawoff2 compress WASM binding from CDN.
   * Returns a Promise that resolves once the WASM runtime is initialised.
   */
  function loadWawoff2() {
    if (_moduleReady) return _moduleReady;

    _moduleReady = new Promise(function (resolve, reject) {
      // The Emscripten-compiled script expects a global `Module` object.
      // We set up onRuntimeInitialized before the script loads so we
      // can detect when the WASM binary is ready.
      var previousModule = window.Module; // preserve any prior value

      window.Module = {
        onRuntimeInitialized: function () {
          var mod = window.Module;
          // Restore previous Module value if there was one, to be polite.
          if (previousModule !== undefined) {
            window.Module = previousModule;
          }
          resolve(mod);
        },
      };

      var script = document.createElement("script");
      script.src = WAWOFF2_CDN_URL;
      script.onerror = function () {
        _moduleReady = null; // allow retry
        reject(
          new Error(
            "Failed to load wawoff2 WASM module from CDN: " + WAWOFF2_CDN_URL
          )
        );
      };
      document.head.appendChild(script);
    });

    return _moduleReady;
  }

  // ---- Font validation helpers ----

  var TRUETYPE_SFNT = 0x00010000;
  var CFF_SFNT = 0x4f54544f; // 'OTTO'

  /**
   * Quick sanity-check: verify the buffer starts with a valid
   * TrueType (0x00010000) or CFF/OpenType ('OTTO') signature.
   */
  function validateFontInput(buffer) {
    if (!(buffer instanceof ArrayBuffer)) {
      throw new Error(
        "convertToWoff2: expected an ArrayBuffer, got " + typeof buffer
      );
    }
    if (buffer.byteLength < 12) {
      throw new Error(
        "convertToWoff2: input is too small to be a valid font file (" +
          buffer.byteLength +
          " bytes)"
      );
    }
    var view = new DataView(buffer);
    var sfVersion = view.getUint32(0);
    if (sfVersion !== TRUETYPE_SFNT && sfVersion !== CFF_SFNT) {
      throw new Error(
        "convertToWoff2: unrecognised font signature 0x" +
          sfVersion.toString(16).toUpperCase() +
          ". Expected a .ttf or .otf file."
      );
    }
  }

  // WOFF2 magic number: 'wOF2'
  var WOFF2_SIGNATURE = 0x774f4632;

  /**
   * Verify the output starts with the WOFF2 magic number.
   */
  function validateWoff2Output(uint8) {
    if (!uint8 || uint8.length < 4) {
      throw new Error(
        "convertToWoff2: compression produced empty or invalid output"
      );
    }
    var sig =
      (uint8[0] << 24) | (uint8[1] << 16) | (uint8[2] << 8) | uint8[3];
    if (sig !== WOFF2_SIGNATURE) {
      throw new Error(
        "convertToWoff2: output does not have a valid WOFF2 signature"
      );
    }
  }

  // ---- Main public API ----

  /**
   * Convert an OTF or TTF font (as an ArrayBuffer) to WOFF2.
   *
   * @param {ArrayBuffer} fontArrayBuffer  Raw bytes of a .otf or .ttf font.
   * @returns {Promise<Blob>}  A Blob of MIME type "font/woff2".
   */
  async function convertToWoff2(fontArrayBuffer) {
    // 1. Validate input
    validateFontInput(fontArrayBuffer);

    // 2. Ensure the WASM module is loaded
    var mod;
    try {
      mod = await loadWawoff2();
    } catch (err) {
      throw new Error("convertToWoff2: failed to load WASM library — " + err.message);
    }

    // 3. Compress
    var inputBytes = new Uint8Array(fontArrayBuffer);
    var result;
    try {
      result = mod.compress(inputBytes);
    } catch (err) {
      throw new Error("convertToWoff2: WASM compression threw — " + err.message);
    }

    if (!result || result === false) {
      throw new Error(
        "convertToWoff2: compression failed (the library returned false). " +
          "The font file may be corrupt or unsupported."
      );
    }

    // 4. Validate output
    var outputBytes = result instanceof Uint8Array ? result : new Uint8Array(result);
    validateWoff2Output(outputBytes);

    // 5. Return as Blob
    return new Blob([outputBytes], { type: "font/woff2" });
  }

  // Expose globally so a plain <script> tag can use it.
  window.convertToWoff2 = convertToWoff2;

  // ---- Variable-font axis parsing (synchronous, pure binary) ----

  /**
   * Look up a name by nameID in the OpenType `name` table.
   * Prefers platformID=3 (Windows, UTF-16BE), falls back to platformID=1 (Mac, ASCII).
   * Returns the resolved string, or null if not found.
   *
   * @param {DataView} view     DataView over the entire font buffer.
   * @param {number}   nameTableOffset  Absolute byte offset of the `name` table.
   * @param {number}   nameID  The nameID to resolve.
   * @returns {string|null}
   */
  function resolveNameID(view, nameTableOffset, nameID) {
    var format = view.getUint16(nameTableOffset);
    var count = view.getUint16(nameTableOffset + 2);
    var stringStorageOffset = nameTableOffset + view.getUint16(nameTableOffset + 4);

    var windowsMatch = null;
    var macMatch = null;

    for (var i = 0; i < count; i++) {
      var recordOffset = nameTableOffset + 6 + i * 12;
      var platformID = view.getUint16(recordOffset);
      var encodingID = view.getUint16(recordOffset + 2);
      var languageID = view.getUint16(recordOffset + 4);
      var recNameID = view.getUint16(recordOffset + 6);
      var length = view.getUint16(recordOffset + 8);
      var offset = view.getUint16(recordOffset + 10);

      if (recNameID !== nameID) continue;

      // Windows Unicode BMP, English US
      if (platformID === 3 && encodingID === 1 && languageID === 0x0409) {
        windowsMatch = { offset: offset, length: length };
        break; // preferred — stop immediately
      }

      // Mac Roman, English
      if (platformID === 1 && encodingID === 0 && macMatch === null) {
        macMatch = { offset: offset, length: length };
      }
    }

    if (windowsMatch) {
      // UTF-16BE decoding
      var strBytes = windowsMatch.length;
      var strStart = stringStorageOffset + windowsMatch.offset;
      var chars = [];
      for (var j = 0; j < strBytes; j += 2) {
        chars.push(view.getUint16(strStart + j));
      }
      return String.fromCharCode.apply(null, chars);
    }

    if (macMatch) {
      // ASCII (Mac Roman) decoding
      var strStart2 = stringStorageOffset + macMatch.offset;
      var chars2 = [];
      for (var k = 0; k < macMatch.length; k++) {
        chars2.push(view.getUint8(strStart2 + k));
      }
      return String.fromCharCode.apply(null, chars2);
    }

    return null;
  }

  /**
   * Parse the OpenType `fvar` table to extract variation axes.
   *
   * @param {ArrayBuffer} fontArrayBuffer  Raw bytes of a .ttf or .otf font.
   * @returns {Array<{tag: string, name: string, min: number, max: number, default: number}>}
   *   An array of axis descriptors. Empty if the font is not variable (no fvar table).
   */
  function parseFontAxes(fontArrayBuffer) {
    if (!(fontArrayBuffer instanceof ArrayBuffer) || fontArrayBuffer.byteLength < 12) {
      return [];
    }

    var view = new DataView(fontArrayBuffer);

    // --- Read the table directory ---
    var numTables = view.getUint16(4);
    var fvarOffset = -1;
    var nameTableOffset = -1;

    for (var i = 0; i < numTables; i++) {
      var recordOffset = 12 + i * 16;
      if (recordOffset + 16 > fontArrayBuffer.byteLength) break;

      var tagUint = view.getUint32(recordOffset);
      var tableOffset = view.getUint32(recordOffset + 8);

      // "fvar" = 0x66766172
      if (tagUint === 0x66766172) {
        fvarOffset = tableOffset;
      }
      // "name" = 0x6E616D65
      if (tagUint === 0x6E616D65) {
        nameTableOffset = tableOffset;
      }
    }

    if (fvarOffset < 0) {
      return []; // not a variable font
    }

    // --- Parse fvar header ---
    // majorVersion (2) + minorVersion (2) + axesArrayOffset (2) + reserved (2) + axisCount (2) + axisSize (2)
    if (fvarOffset + 12 > fontArrayBuffer.byteLength) return [];

    var axesArrayOffset = view.getUint16(fvarOffset + 4);
    var axisCount = view.getUint16(fvarOffset + 8);
    var axisSize = view.getUint16(fvarOffset + 10);

    var axesStart = fvarOffset + axesArrayOffset;
    var axes = [];

    for (var a = 0; a < axisCount; a++) {
      var axisOffset = axesStart + a * axisSize;
      if (axisOffset + 20 > fontArrayBuffer.byteLength) break;

      // 4-byte tag
      var tagBytes = [
        view.getUint8(axisOffset),
        view.getUint8(axisOffset + 1),
        view.getUint8(axisOffset + 2),
        view.getUint8(axisOffset + 3),
      ];
      var tag = String.fromCharCode(tagBytes[0], tagBytes[1], tagBytes[2], tagBytes[3]);

      // Fixed 16.16 values — read as signed int32, divide by 65536
      var minValue = view.getInt32(axisOffset + 4) / 65536;
      var defaultValue = view.getInt32(axisOffset + 8) / 65536;
      var maxValue = view.getInt32(axisOffset + 12) / 65536;

      // flags (uint16) at offset +16 — not needed for output
      var axisNameID = view.getUint16(axisOffset + 18);

      // Resolve name from the name table
      var name = null;
      if (nameTableOffset >= 0) {
        name = resolveNameID(view, nameTableOffset, axisNameID);
      }
      if (!name) {
        name = tag; // fallback to the 4-char tag
      }

      axes.push({
        tag: tag,
        name: name,
        min: minValue,
        max: maxValue,
        default: defaultValue,
      });
    }

    return axes;
  }

  // Expose globally so a plain <script> tag can use it.
  window.parseFontAxes = parseFontAxes;
})();
