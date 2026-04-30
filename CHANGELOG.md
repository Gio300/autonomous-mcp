# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0]

### Added

- **Unified aos-mcp stdio entry** (`src/aos-gateway.mjs`): one MCP product that merges **PC tools** (child `src/pc-server.mjs`) with **optional Perplexity Comet** tools when `vendor/perplexity-comet-mcp/dist/index.js` exists or **`AOS_COMET_SERVER`** points at a built Comet server script. Tools named `comet_*` route to the Comet child; all other tools route to the PC child.
- npm package rename to **`aos-mcp`** with primary bin **`aos-mcp`**; **`autonomous-mcp`** remains an alias to the same gateway for existing installs.

### Changed

- `src/server.mjs` is a thin re-export of the gateway (backward-compatible path for `node src/server.mjs`).
- Cursor examples (`cursor-mcp*.json`) use server id **`aos-mcp`** and `npx -y aos-mcp` after publish.
- Operator brief and branding in **`shell.txt`** now say **aos-mcp (AOS MCP)**.

## [0.1.1]

### Added

- `docs/aos-dashboard-scope.md` — AOS dashboard boundaries (`chat_centric-ui`, single-user PC, Phase 3 in/out).
- `scripts/smoke-mcp.mjs`: stdio MCP smoke test (lists tools, `read_operator_brief`, `execute_shell`); shipped in the npm package under `scripts/` so `npm test` works from an install too.
- `npm test` runs the smoke script.
- GitHub Actions CI on Ubuntu and Windows (Node 18 and 20).
- `CONTRIBUTING.md` and npm `files` / `repository` metadata for publishing.
- `cursor-mcp.local.example.json` for clone-based installs; `cursor-mcp.example.json` for `npx` after npm publish.

### Changed

- README: link to AOS **Comet / Perplexity-Comet-MCP** integration playbook (`aos-comet-integration.md` on AutonomOS_mcp).
- MCP **server instructions** and **tool descriptions**: agents should **execute via tools** (shell, browser, Cursor CLI) instead of delegating manual steps; user **approval** flows through the client.
- README and CONTRIBUTING: **AutonomOS_mcp (AOS)** is the hub for playbooks and user-facing AOS docs; this repo documents the MCP package and links to AOS.

## [0.1.0]

### Added

- Initial MCP server: `execute_shell`, `open_url`, `cursor_open`, `read_operator_brief`.
- Operator brief in `shell.txt` and Cursor-focused README.
