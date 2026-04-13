# Autonomous MCP

**Model Context Protocol (MCP) server** that gives Cursor (and other MCP clients) **local shell and desktop helpers** from one tool surface—so the agent can run builds, git, installers, open onboarding URLs, and launch the Cursor CLI without you copy-pasting every step.

Read **`shell.txt`** for the product narrative (“MCO” / orchestration framing).

> **Security:** Tools run **as the same OS user as the Node process** that hosts the MCP (usually your login). This is **not** a Windows UAC bypass; elevation still requires your approval outside the agent.

## Tools

| Tool | Purpose |
|------|--------|
| `execute_shell` | Run a command (`powershell -NoProfile -Command` on Windows, `/bin/sh -c` elsewhere). |
| `open_url` | Open an `http(s)` URL in the default browser. |
| `cursor_open` | Run `cursor <path>` if the [Cursor CLI](https://cursor.com/docs) is on `PATH`. |
| `read_operator_brief` | Return the contents of `shell.txt`. |

## Requirements

- **Node.js 18+**
- Dependencies: `npm install`

## Run locally (stdio)

```bash
node src/server.mjs
```

Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) if you want to debug:

```bash
npx @modelcontextprotocol/inspector node src/server.mjs
```

## Cursor: connect this MCP

1. Open **Cursor Settings → MCP** (or edit your project/user MCP config JSON).
2. Add a server entry pointing at this repo’s `src/server.mjs` **with absolute paths**:

```json
{
  "mcpServers": {
    "autonomous-mcp": {
      "command": "node",
      "args": ["C:/absolute/path/to/Autonomous MCP/src/server.mjs"]
    }
  }
}
```

On Windows, escape spaces in paths or move the clone to a path **without spaces** if your client mis-parses arguments.

3. Restart Cursor or reload MCP. Enable the server and approve tool usage when prompted.

## GitHub

Public source: **`Gio300/autonomous-mcp`** (after you push from this folder). Clone and point `args` at your local `server.mjs`.

## Cursor Marketplace / directory

Cursor’s extension and MCP ecosystem evolves quickly. To make this discoverable:

1. **Publish** this public repo with a clear README and tags (`mcp`, `cursor`, `automation`).
2. Watch **Cursor’s official docs** for [MCP](https://docs.cursor.com/context/model-context-protocol) and any **community directory / marketplace** submission process they announce.
3. Optionally open a **discussion or request** in Cursor’s community channels pointing to this repo.

There is no separate “apply” step controlled from this repository; listing is governed by Cursor’s policies.

## License

MIT — see `LICENSE`.
