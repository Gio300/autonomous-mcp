# aos-mcp (AOS MCP)

**Model Context Protocol (MCP) server** that gives Cursor (and other MCP clients) **one stdio product**: **local shell and desktop helpers** plus **optional Perplexity Comet browser tools** when you add the Comet server build (see below). The agent can run builds, git, installers, open URLs, launch the Cursor CLI, and (when enabled) drive Comet’s in-app browser without wiring two separate MCP entries.

Read **`shell.txt`** for the product narrative (“MCO” / orchestration framing).

> **Security:** Tools run **as the same OS user as the Node process** that hosts the MCP (usually your login). This is **not** a Windows UAC bypass; elevation still requires your approval outside the agent.

**Agent behavior:** The MCP’s built-in **instructions** tell coding agents to **run work through these tools** (with client approval when Cursor prompts) instead of only telling the user to open sites or run commands manually. See **`shell.txt`** and `src/aos-gateway.mjs` (merged `instructions` for PC + optional Comet).

## AutonomOS_mcp (AOS)

This npm package is the **MCP server** piece of **AutonomOS_mcp** (**AOS**). **User-facing playbooks, onboarding, and AOS-wide docs** are maintained in the **AOS repo** so you can update them in one place for everyone using AOS—not duplicated here.

- **AOS hub (source of truth for those files):** [github.com/Gio300/AutonomOS_mcp](https://github.com/Gio300/AutonomOS_mcp)  
- **Example:** [playbook/admin-terminal-and-agent-access.md](https://github.com/Gio300/AutonomOS_mcp/blob/master/playbook/admin-terminal-and-agent-access.md) (admin terminal + agent access on Windows)  
- **Comet browser MCP (RapierCraft / Perplexity-Comet-MCP):** [playbook/aos-comet-integration.md](https://github.com/Gio300/AutonomOS_mcp/blob/master/playbook/aos-comet-integration.md) (AOS gateway + embedded browser subsystem plan)

This repo stays focused on **MCP behavior**, **Cursor wiring**, and **small technical docs** (install, security, smoke tests). Link out to AOS when users need the full story. **Dashboard / `chat_centric-ui` / Phase 3 scope (single-user PC):** see **[docs/aos-dashboard-scope.md](docs/aos-dashboard-scope.md)**.

## Tools

| Tool | Purpose |
|------|--------|
| `execute_shell` | Run a command (`powershell -NoProfile -Command` on Windows, `/bin/sh -c` elsewhere). |
| `open_url` | Open an `http(s)` URL in the default browser. |
| `cursor_open` | Run `cursor <path>` if the [Cursor CLI](https://cursor.com/docs) is on `PATH`. |
| `read_operator_brief` | Return the contents of `shell.txt`. |
| `comet_*` | **Optional.** Shipped by [Perplexity-Comet-MCP](https://github.com/RapierCraft/Perplexity-Comet-MCP) when present at `vendor/perplexity-comet-mcp/dist/index.js` or when **`AOS_COMET_SERVER`** is set to that server’s entry script (absolute path). Requires Perplexity Comet installed locally. |

**Merged `tools/list`:** the gateway returns all PC tools plus all Comet tools in one list. **`tools/list` cursors** from the host are not preserved across the two backends; clients that paginate aggressively may need a follow-up (open an issue with your client).

## Requirements

- **Node.js 18+**
- **Install (from a clone):** `npm ci` (CI) or `npm install` (local dev)

## Quick start

### A) Use from a clone (good for contributors)

1. Clone **[github.com/Gio300/autonomous-mcp](https://github.com/Gio300/autonomous-mcp)**.
2. `npm install` in the repo root.
3. In Cursor’s MCP settings, point `node` at **`src/aos-gateway.mjs` with an absolute path**. See **`cursor-mcp.local.example.json`** for the shape of the JSON.

On **Windows**, paths with spaces can confuse some clients—if MCP fails to start, clone to a path **without spaces** or double-check how Cursor splits `args`.

### B) Use from npm (after the package is published)

Once **`aos-mcp`** is published to the npm registry, you can avoid local paths entirely:

```json
{
  "mcpServers": {
    "aos-mcp": {
      "command": "npx",
      "args": ["-y", "aos-mcp"]
    }
  }
}
```

Copy **`cursor-mcp.example.json`** as a starting point. `npx` will download and run the package’s **`aos-mcp`** bin (same entry as the legacy **`autonomous-mcp`** bin name).

## Run locally (stdio)

```bash
node src/aos-gateway.mjs
```

`node src/server.mjs` still works; it loads the same gateway.

Global CLI (optional): `npm install -g .` from the clone, then run **`aos-mcp`** or **`autonomous-mcp`** (same stdio server).

Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) if you want to debug:

```bash
npx @modelcontextprotocol/inspector node src/aos-gateway.mjs
```

## Testing

| What | Command / action |
|------|------------------|
| **Automated smoke** | `npm test` — spawns the server, lists tools, checks `read_operator_brief` and `execute_shell`. |
| **Manual in Cursor** | Add the MCP server in settings, enable it, then ask the agent to run a harmless shell command in your workspace. |

## Cursor: connect this MCP

1. Open **Cursor Settings → MCP** (or edit your project/user MCP config JSON).
2. Add a server entry using either **npm / `npx`** (see [Quick start](#quick-start)) or **`node` + absolute path to `src/aos-gateway.mjs`** (or `src/server.mjs`, which re-exports the gateway).
3. Restart Cursor or reload MCP. Enable the server and approve tool usage when prompted.

## Contributing

We want this repo to be easy for **end users** and a natural first step for **contributors** working on **AOS** (MCP surface here; playbooks and product narrative in **[AutonomOS_mcp](https://github.com/Gio300/AutonomOS_mcp)**).

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for workflow, smoke tests, and ideas for first PRs.

## Cursor Marketplace / directory

Cursor’s extension and MCP ecosystem evolves quickly. To make this discoverable:

1. **Publish** this public repo with a clear README and tags (`mcp`, `cursor`, `automation`).
2. Watch **Cursor’s official docs** for [MCP](https://docs.cursor.com/context/model-context-protocol) and any **community directory / marketplace** submission process they announce.
3. Optionally open a **discussion or request** in Cursor’s community channels pointing to this repo.

There is no separate “apply” step controlled from this repository; listing is governed by Cursor’s policies.

## Changelog

See **[CHANGELOG.md](CHANGELOG.md)**.

## License

MIT — see `LICENSE`.
