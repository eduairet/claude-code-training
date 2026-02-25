# Mermaid Diagram Creator — Agent Memory

## Output & File Conventions
- Save diagrams as `.mmd` files in the user's working directory unless told otherwise
- Use Python `open(..., "w")` to write files — avoids heredoc quoting/escaping issues on Windows
- When producing multiple related diagrams, place them all in a single `.mmd` file with clear `%%` section headers

## Renderer Compatibility
- **Excalidraw Mermaid importer**: supports ONLY `flowchart` / `graph` notation
  - Do NOT use `stateDiagram-v2`, `sequenceDiagram`, or any other type when the target is Excalidraw
  - Ask the user which renderer they are targeting before choosing diagram types
- **General renderers** (mermaid.live, GitHub, VS Code): support all diagram types

## Multi-Diagram Strategy
- Default (non-Excalidraw): combine `stateDiagram-v2` (lifecycle) + `sequenceDiagram` (actor flow)
- Excalidraw target: use a single `flowchart TD` that encodes all state, actor, and decision information
  - Node shapes convey semantics: `((...))` actors, `([...])` states, `{...}` decisions, `[...]` actions, `[/.../]` terminals
  - `style` directives add colour-coding when shapes alone are not enough

## flowchart TD — Escrow Shape/Colour Conventions
- Actors `((...))` — dark blue fill `#1a3a5c`
- Contract states `([...])` — teal `#0d7377`; disputed = red `#c0392b`; expired/resolved states get unique colours
- Actions `[...]` — light grey `#eaecee`
- Decisions `{...}` — amber `#d4ac0d`
- Fund outcome terminals `[/.../]` — green `#27ae60` (seller) / blue `#2e86c1` (buyer) / grey `#95a5a6` (cancelled)

## stateDiagram-v2 Patterns
- Use `note right of <state>` blocks to annotate important states with on-chain/storage data
- Terminal states use `StateLabel --> [*]` syntax
- `
` inside transition labels creates line breaks in most renderers
- Guard conditions in square brackets on the same transition line: `State --> State2 : event()
[guard]`
- Use `direction TB` explicitly for top-to-bottom layout

## sequenceDiagram Patterns
- Use `actor` for human/external participants; `participant` for systems/contracts
- `autonumber` improves readability for step-heavy flows
- `rect rgb(r,g,b)` color blocks group logical phases (creation, funding, happy path, dispute, expiry)
- `alt / else / end` handles branching paths within a single diagram cleanly
- Smart contract event emissions modeled as `EC -->> Actor : Event: EventName(params)` (dashed = async)
- Internal contract state changes shown as self-messages: `EC -->> EC : state = X`

## Smart Contract / Blockchain Domain
- Standard escrow states: CREATED, FUNDED, DELIVERED, COMPLETED, DISPUTED, RESOLVED_FOR_SELLER, RESOLVED_FOR_BUYER, EXPIRED, CANCELLED
- Actors: Buyer, Seller, Escrow Contract (participant), Arbiter
- Key methods: deploy(), deposit(), markDelivered(), confirmReceipt(), openDispute(), resolve(winner), expire(), cancel()
- Always model the timeout/expiry path — it is a critical safety mechanism
- Dispute flow requires off-chain evidence exchange before on-chain arbiter.resolve() call

## Syntax Notes
- Special chars in labels (em-dash, parentheses, colons) are safe inside quoted strings or as plain text in sequence diagrams
- Avoid colons inside unquoted flowchart node labels — use quotes: `A["label: value"]`
- `note right of State` must be followed by `end note` (not `endnote`)
- Multi-line labels in flowchart nodes: use a real newline inside the quoted string (no `
` escape needed)
