#!/usr/bin/env node
/**
 * aos-mcp — PC tool subsystem (stdio child). Started by aos-gateway; do not add to Cursor as a second MCP.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const INSTRUCTIONS = `aos-mcp (PC tools) gives this agent **hands on the user’s machine** (shell, browser, Cursor CLI). This is the point of the integration.

**Execute here, don’t delegate.** When your plan needs something this MCP can do—run a command, open a link, open a folder in Cursor—**call the matching tool** instead of telling the user to do it manually (“go to this site”, “run this in Terminal”, “open this path in Cursor”). Your reasoning should assume **you will perform the action via tools** and that the user will **approve** tool use when the client asks (e.g. Cursor’s tool approval / run prompts).

**Permission.** Treat tool calls as operations that may require **explicit user consent** in the host UI. Prefer a short plan (“I’ll use execute_shell to … then open_url to …”) so the user knows what they’re approving. For destructive or privileged actions, be explicit about risk; never imply silent admin access (this MCP is not a UAC bypass on Windows).

**Tools (same privilege as the MCP host process, typically the logged-in user):**
- **execute_shell** — PowerShell (Windows) or /bin/sh (Unix). Builds, git, installers, smoke tests, one-off diagnostics.
- **open_url** — http(s) in the default browser (docs, dashboards, auth pages the user must see).
- **cursor_open** — \`cursor <path>\` when the CLI is on PATH.
- **read_operator_brief** — product brief from shell.txt.

If something truly cannot be done through these tools (wrong machine, needs physical hardware, policy forbids automation), say so and only then give minimal manual steps.`;

const server = new McpServer(
  { name: 'aos-mcp-pc', version: '0.2.0' },
  { instructions: INSTRUCTIONS }
);

server.registerTool(
  'execute_shell',
  {
    title: 'Execute shell command',
    description:
      'Run a shell command on this machine (PowerShell on Windows, /bin/sh -c on macOS/Linux). Same privileges as the MCP host process. Prefer this tool over pasting commands for the user to run manually—the user approves tool execution in the client when required. Use for builds, git, package managers, and CLI flows.',
    inputSchema: z.object({
      command: z.string().describe('Command to run (e.g. dir, npm install, git status)'),
      cwd: z.string().optional().describe('Working directory; defaults to workspace or user home'),
      timeoutMs: z
        .number()
        .int()
        .min(1000)
        .max(600000)
        .optional()
        .describe('Timeout in ms (default 120000)')
    })
  },
  async ({ command, cwd, timeoutMs }) => {
    const timeout = timeoutMs ?? 120000;
    const isWin = process.platform === 'win32';
    const shell = isWin ? 'powershell.exe' : '/bin/sh';
    const args = isWin ? ['-NoProfile', '-NonInteractive', '-Command', command] : ['-c', command];
    const options = {
      cwd: cwd || process.cwd(),
      timeout,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true
    };
    try {
      const { stdout, stderr } = await execFileAsync(shell, args, options);
      const text = [stdout, stderr].filter(Boolean).join('\n') || '(no output)';
      return { content: [{ type: 'text', text }] };
    } catch (err) {
      const msg = err?.stderr ? `${err.message}\n${err.stderr}` : err?.message || String(err);
      return { content: [{ type: 'text', text: msg }], isError: true };
    }
  }
);

server.registerTool(
  'open_url',
  {
    title: 'Open URL in browser',
    description:
      'Opens an http(s) URL in the user’s default browser. Prefer this over telling the user to navigate to the site manually; the user may still need to approve the tool call in the client.',
    inputSchema: z.object({
      url: z.string().url().describe('Must be http or https')
    })
  },
  async ({ url }) => {
    try {
      if (process.platform === 'win32') {
        await execFileAsync('cmd.exe', ['/c', 'start', '', url], { windowsHide: true });
      } else if (process.platform === 'darwin') {
        await execFileAsync('open', [url]);
      } else {
        await execFileAsync('xdg-open', [url]);
      }
      return { content: [{ type: 'text', text: `Opened: ${url}` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: err?.message || String(err) }], isError: true };
    }
  }
);

server.registerTool(
  'cursor_open',
  {
    title: 'Open in Cursor',
    description:
      'Runs `cursor <path>` to open a folder or file in Cursor (requires Cursor on PATH). Prefer this over asking the user to open the path manually in the UI.',
    inputSchema: z.object({
      path: z.string().describe('Absolute path to file or directory')
    })
  },
  async ({ path }) => {
    const bin = process.platform === 'win32' ? 'cursor.cmd' : 'cursor';
    try {
      await execFileAsync(bin, [path], { windowsHide: true });
      return { content: [{ type: 'text', text: `Launched: ${bin} ${path}` }] };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `${err?.message || err}\nHint: install Cursor CLI from Command Palette → "Shell Command: Install 'cursor' command in PATH".`
          }
        ],
        isError: true
      };
    }
  }
);

server.registerTool(
  'read_operator_brief',
  {
    title: 'Read operator brief (shell.txt)',
    description:
      'Returns the product brief from shell.txt in this MCP package. Use for alignment on orchestration vs delegation and safety expectations.',
    inputSchema: z.object({})
  },
  async () => {
    try {
      const text = await readFile(join(ROOT, 'shell.txt'), 'utf8');
      return { content: [{ type: 'text', text }] };
    } catch (err) {
      return { content: [{ type: 'text', text: err?.message || String(err) }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
