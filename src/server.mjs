#!/usr/bin/env node
/**
 * Autonomous MCP — stdio server for Cursor (and other MCP clients).
 * Tools: shell execution, open URL, open path in Cursor CLI.
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

const INSTRUCTIONS = `Autonomous MCP exposes local execution tools to your agent (Cursor-first).
- execute_shell: runs commands in the same privilege level as this Node process (typically your user). It is not a UAC bypass on Windows.
- open_url: opens a https URL in the default browser (onboarding, docs).
- cursor_open: runs the Cursor CLI (\`cursor\`) when installed on PATH.
Use for builds, git, installers, and repetitive CLI flows; approve risky commands consciously.`;

const server = new McpServer(
  { name: 'autonomous-mcp', version: '0.1.0' },
  { instructions: INSTRUCTIONS }
);

server.registerTool(
  'execute_shell',
  {
    title: 'Execute shell command',
    description:
      'Run a shell command on this machine (PowerShell on Windows, /bin/sh -c on macOS/Linux). Same privileges as the MCP host process.',
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
    description: 'Opens an http(s) URL using the OS default handler (e.g. onboarding page).',
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
    description: 'Runs `cursor <path>` to open a folder or file in Cursor (requires Cursor on PATH).',
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
    description: 'Returns the product brief from shell.txt in this MCP package.',
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
