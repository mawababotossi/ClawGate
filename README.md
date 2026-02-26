# GeminiClaw

Self-hosted AI agent gateway powered by `gemini-cli` via **ACP** (Agent Communication Protocol).

> Inspired by OpenClaw — bring the reasoning power of Gemini 3 to Telegram, WhatsApp and the Web.

## Genesis & Motivation

GeminiClaw was born from a critical observation: many users of tools like OpenClaw have seen their Google accounts banned for violating Terms of Service (TOS).

### The Problem
Using Gemini tokens via unofficial OAuth flows (on personal "flat-rate" accounts) to power third-party agents is strictly monitored by Google. This has led to massive suspensions, depriving users of access not only to Gemini, but sometimes to their entire Google services (Gmail, Drive, etc.).

### The GeminiClaw Solution
Unlike "scraping" or unofficial OAuth approaches, GeminiClaw relies on the **official Google CLI** via the experimental **ACP (Agent Communication Protocol)**.
*   **Compliance**: Uses legitimate communication channels provided by Google.
*   **Security**: No need to share OAuth secrets or sensitive API keys with unverified third-party servers.
*   **Sustainability**: Designed to align with the evolution of Google DeepMind's "agentic" ecosystem.

## Why GeminiClaw?

GeminiClaw is not just another API wrapper. It is an **agent supervision platform** designed to harness the full potential of Google's new Gemini 3 models (Pro & Flash Preview).

*   **Visible Reasoning (Thoughts)**: Natively access the "Chain of Thought" of Gemini 3 models. The AI explains its reasoning before responding.
*   **Standard Protocols (ACP & MCP)**: Uses the Agent Communication Protocol to drive the Google engine and the **Model Context Protocol (MCP)** to connect your own tools.
*   **Autonomous ReAct Loops**: The agent intelligently manages tool usage (file reading, command execution, search) iteratively without server intervention.
*   **Privacy & Authentication**: Full support for GCA (Google Cloud Auth) with local session storage, ensuring a free and secure integration.

## Architecture

```
gemini-claw/
├── packages/
│   ├── core/           @geminiclaw/core       ← ACP Supervisor (Bridge to gemini-cli)
│   ├── gateway/        @geminiclaw/gateway    ← WebSocket Hub, Routing & Queuing
│   ├── memory/         @geminiclaw/memory     ← SQLite Persistence (Transcripts & Sessions)
│   ├── channels/       
│   │   ├── telegram/   @geminiclaw/channel-telegram
│   │   ├── whatsapp/   @geminiclaw/channel-whatsapp
│   │   └── webchat/    @geminiclaw/channel-webchat
│   ├── skills/         @geminiclaw/skills     ← MCP Server (Skill Registry)
│   └── dashboard/      @geminiclaw/dashboard  ← React Admin Interface (Agents & Logs)
├── config/
│   └── agents.json     ← Dynamic configuration of agents & channels
└── docker-compose.yml
```

## Quick Start

### 1. Prerequisites
You must have the official Gemini CLI installed globally:
```bash
npm install -g @google/gemini-cli
```

### 2. Quick Installation

To install GeminiClaw automatically:
```bash
curl -fsSL https://geminiclaw.ai/install.sh | bash
```

### 3. Using the CLI

The `geminiclaw` CLI allows you to configure and drive your agents:

```bash
# Interactive configuration (API Keys, Default Models)
geminiclaw configure

# Start services in the background (Gateway & Dashboard)
geminiclaw start

# Stop services
geminiclaw stop
```

### 4. Docker (Optional)

If you prefer using Docker:
```bash
docker-compose up -d
```

### 5. Dashboard
The administration interface is available at `http://localhost:5173/`.
It allows you to:
- Manage your agents in real-time.
- View the AI's "Thoughts" during chats.
- Monitor MCP tool consumption.

## Technical Operation

GeminiClaw acts as a **supervisor**. For each user session, it launches a `gemini --experimental-acp` process in the background.
1. The **Gateway** receives a message (e.g., from Telegram).
2. The **AgentRuntime** delegates the prompt to the **ACPBridge**.
3. The **SkillMcpServer** exposes our JavaScript functions (skills) in MCP format.
4. The Gemini 3 agent calls our MCP tools autonomously to enrich its response.

## License

Apache-2.0
