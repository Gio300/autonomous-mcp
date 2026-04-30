# AOS dashboard scope (reference)

This file records **product boundaries** for **AutonomOS_mcp (AOS)** work that complements this MCP package. **Source-of-truth playbooks** stay in the [AutonomOS_mcp](https://github.com/Gio300/AutonomOS_mcp) repo; this doc is a **portable summary** for contributors who land in **aos-mcp** (this repo) first.

## UI shell

- **Dashboard UI** is built on **`chat_centric-ui`** — a **private Git repo** you own (same name: `chat_centric-ui`). Integrate it as a **git dependency** or **submodule** from your Git host; do not assume a public npm package.

## Deployment model

- **Single-user, single machine.** Each person runs AOS on **their own PC** (or their own stack). **No** multi-user accounts, **no** sharing workflows between unrelated users, **no** social/collaboration product requirements for v1.

## Phasing (agreed)

| Phase | Scope |
|--------|--------|
| **0–2** | AOS spine, Docker, **simple first** chat + settings using `chat_centric-ui`, incremental settings buckets. |
| **3 (later update)** | **Include:** web search, workflows, and other advanced capabilities aligned with Open WebUI–class depth **where they still fit a single-user PC**. |
| **3 (explicitly out for now)** | Multi-user auth, tenancy, “share with others” / multi-tenant product patterns. |

## MCP package (this repo)

- Stays **Cursor-first MCP** (stdio tools). Dashboard and `chat_centric-ui` live under **AOS**, not duplicated here.
