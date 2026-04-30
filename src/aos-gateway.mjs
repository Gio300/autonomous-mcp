#!/usr/bin/env node
/**
 * aos-mcp — single stdio MCP: PC tools (child) + optional Perplexity Comet tools (child).
 * Configure Comet via vendor/perplexity-comet-mcp (built dist) or env AOS_COMET_SERVER (absolute path to Comet entry .js).
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.2.0';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PC_ENTRY = join(__dirname, 'pc-server.mjs');
const COMET_DEFAULT = join(ROOT, 'vendor', 'perplexity-comet-mcp', 'dist', 'index.js');
const COMET_ENTRY = process.env.AOS_COMET_SERVER || COMET_DEFAULT;

const PC_INSTRUCTIONS = `aos-mcp gives this agent **hands on the user’s machine** (shell, default browser, Cursor CLI). This is the point of the integration.

**Execute here, don’t delegate.** When your plan needs something this MCP can do—run a command, open a link, open a folder in Cursor—**call the matching tool** instead of telling the user to do it manually. Your reasoning should assume **you will perform the action via tools** and that the user will **approve** tool use when the client asks (e.g. Cursor’s tool approval / run prompts).

**Permission.** Treat tool calls as operations that may require **explicit user consent** in the host UI. Prefer a short plan so the user knows what they’re approving. For destructive or privileged actions, be explicit about risk; never imply silent admin access (this MCP is not a UAC bypass on Windows).

**PC tools (same privilege as the MCP host process, typically the logged-in user):**
- **execute_shell** — PowerShell (Windows) or /bin/sh (Unix). Builds, git, installers, smoke tests, one-off diagnostics.
- **open_url** — http(s) in the default browser.
- **cursor_open** — \`cursor <path>\` when the CLI is on PATH.
- **read_operator_brief** — product brief from shell.txt.`;

const COMET_INSTRUCTIONS_ON = `

**Comet (Perplexity Comet) tools** — Names start with **comet_**. Use them for **in-app browser automation** (connect, navigate, ask, extract) when the user has Comet installed and expects that workflow. Same approval and safety expectations as other tools.`;

const COMET_INSTRUCTIONS_OFF = `

**Comet browser tools** are not loaded on this machine. To enable them, build [Perplexity-Comet-MCP](https://github.com/RapierCraft/Perplexity-Comet-MCP) into \`vendor/perplexity-comet-mcp/dist/index.js\` or set **AOS_COMET_SERVER** to the absolute path of the Comet server entry script.`;

function buildInstructions(cometEnabled) {
  return PC_INSTRUCTIONS + (cometEnabled ? COMET_INSTRUCTIONS_ON : COMET_INSTRUCTIONS_OFF);
}

async function listAllTools(client) {
  const tools = [];
  let cursor;
  do {
    const page = await client.listTools(cursor ? { cursor } : {});
    tools.push(...(page.tools ?? []));
    cursor = page.nextCursor;
  } while (cursor);
  return tools;
}

function cometPathResolved() {
  const p = COMET_ENTRY.trim();
  if (!p) return null;
  return existsSync(p) ? p : null;
}

let cometClient;
const cometPath = cometPathResolved();

const pcTransport = new StdioClientTransport({
  command: process.execPath,
  args: [PC_ENTRY],
  cwd: ROOT
});
const pcClient = new Client({ name: 'aos-mcp-gateway-pc', version: VERSION }, { capabilities: {} });
await pcClient.connect(pcTransport);

if (cometPath) {
  try {
    const cometCwd = dirname(cometPath);
    const cometTransport = new StdioClientTransport({
      command: process.execPath,
      args: [cometPath],
      cwd: cometCwd
    });
    cometClient = new Client({ name: 'aos-mcp-gateway-comet', version: VERSION }, { capabilities: {} });
    await cometClient.connect(cometTransport);
  } catch (err) {
    cometClient = undefined;
    console.error(
      `[aos-mcp] Comet subsystem failed to start (${cometPath}): ${err?.message || err}\n[aos-mcp] Continuing with PC tools only.`
    );
  }
} else if (process.env.AOS_COMET_SERVER) {
  console.error(`[aos-mcp] AOS_COMET_SERVER is set but file not found: ${COMET_ENTRY}`);
}

const cometEnabled = Boolean(cometClient);
const gateway = new Server(
  { name: 'aos-mcp', version: VERSION },
  {
    capabilities: { tools: {} },
    instructions: buildInstructions(cometEnabled)
  }
);

gateway.setRequestHandler(ListToolsRequestSchema, async () => {
  const pcTools = await listAllTools(pcClient);
  const cometTools = cometClient ? await listAllTools(cometClient) : [];
  return { tools: [...pcTools, ...cometTools] };
});

gateway.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments ?? {};
  if (typeof name === 'string' && name.startsWith('comet_')) {
    if (!cometClient) {
      throw new McpError(ErrorCode.InvalidParams, `Tool ${name} requires the Comet subsystem (not loaded).`);
    }
    return cometClient.callTool({ name, arguments: args });
  }
  return pcClient.callTool({ name, arguments: args });
});

const transport = new StdioServerTransport();
await gateway.connect(transport);
