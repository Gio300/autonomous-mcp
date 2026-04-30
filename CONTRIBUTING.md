# Contributing

Thank you for helping improve Autonomous MCP. This project is intentionally small: a stdio MCP server for Cursor-first local execution.

## Before you open a PR

1. **Install:** `npm ci`
2. **Run the smoke test:** `npm test` — spawns the server over stdio and checks tools.
3. **Optional manual check:** `npm run inspect` and exercise tools in the MCP Inspector, or connect the server in Cursor and try a harmless `execute_shell` command.

## Code and style

- Match existing patterns in `src/pc-server.mjs` (ES modules, Zod `inputSchema`, concise tool descriptions). The default stdio entry is `src/aos-gateway.mjs` (merges PC + optional Comet); `src/server.mjs` re-exports the gateway.
- Avoid widening tool power (new capabilities or weaker safety) without README updates and clear rationale.

## Suggested first contributions

- Documentation: clearer Windows paths, Cursor MCP config screenshots or copy-paste blocks, troubleshooting.
- Tests: extend `scripts/smoke-mcp.mjs` with additional assertions (keep CI fast and side-effect free; avoid `open_url` / `cursor_open` in CI unless mocked).
- Tooling: npm publish ergonomics, error messages, timeouts.

## AutonomOS_mcp (AOS)

**AutonomOS_mcp** (**AOS**) is the umbrella project. **Playbooks, onboarding, and docs you update for AOS users** should live in the **[AutonomOS_mcp](https://github.com/Gio300/AutonomOS_mcp)** repo (for example under `playbook/`), not only in this MCP package—so ownership stays clear and users have one place to watch for updates.

This repo is for **MCP implementation** (tools, stdio server, CI, npm). Cross-cutting AOS narrative and operator guides belong in **AutonomOS_mcp**; link from here when helpful.

## Questions

Use [Issues](https://github.com/Gio300/autonomous-mcp/issues) for bugs and design questions before large refactors. If Discussions are enabled on the repo, you can use those for open-ended questions.
