#!/usr/bin/env node
/**
 * Spawns the MCP server over stdio and verifies tools respond (CI / local).
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SERVER = join(ROOT, 'src', 'aos-gateway.mjs');

const EXPECTED_TOOLS = new Set([
  'execute_shell',
  'open_url',
  'cursor_open',
  'read_operator_brief'
]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function textFromToolResult(result) {
  const parts = result?.content;
  if (!Array.isArray(parts) || parts.length === 0) return '';
  return parts
    .filter((p) => p?.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('\n');
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [SERVER],
  cwd: ROOT
});

const client = new Client({ name: 'autonomous-mcp-smoke', version: '0.0.0' });

try {
  await client.connect(transport);

  const { tools } = await client.listTools();
  const names = new Set((tools ?? []).map((t) => t.name));
  for (const n of EXPECTED_TOOLS) {
    if (!names.has(n)) fail(`Missing tool: ${n}. Got: ${[...names].sort().join(', ')}`);
  }

  const brief = await client.callTool({ name: 'read_operator_brief', arguments: {} });
  const briefText = textFromToolResult(brief);
  if (!briefText.includes('aos-mcp')) {
    fail(`read_operator_brief: expected "aos-mcp" in output, got length ${briefText.length}`);
  }

  const marker = `autonomous-mcp-smoke-${Date.now()}`;
  const shellCmd =
    process.platform === 'win32'
      ? `Write-Output '${marker.replace(/'/g, "''")}'`
      : `printf '%s\\n' '${marker.replace(/'/g, "'\\''")}'`;

  const shell = await client.callTool({
    name: 'execute_shell',
    arguments: { command: shellCmd, cwd: ROOT, timeoutMs: 30000 }
  });
  if (shell.isError) fail(`execute_shell: isError set. Output:\n${textFromToolResult(shell)}`);
  const shellText = textFromToolResult(shell);
  if (!shellText.includes(marker)) {
    fail(`execute_shell: marker not in output.\nExpected fragment: ${marker}\nGot:\n${shellText}`);
  }

  console.log('smoke-mcp: ok');
} catch (err) {
  fail(err?.stack || err?.message || String(err));
} finally {
  try {
    await client.close();
  } catch {
    // ignore teardown errors
  }
}
