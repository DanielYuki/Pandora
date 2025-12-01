<img align="left" src="./.github/resources/rowlet.jpg" width="75">
<h1>Pandora - Messaging Gateway Template</h1>

<div align="left">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![gRPC](https://img.shields.io/badge/gRPC-4285F4?style=for-the-badge&logo=grpc&logoColor=white)

**A minimal, modular messaging gateway template for connecting any messaging platform to AI agents**

</div>

## 🎯 What Is This?

An **event-driven messaging gateway** built with clean architecture principles. Connects messaging platforms to AI agents through a flexible adapter system. Currently supports:
- **Messaging Platforms**: WhatsApp, Telegram, CLI
- **AI Agents**: OpenAI, gRPC, HTTP, GraphQL, Mock

## ✨ Features

- **Event-Driven Architecture**: Asynchronous message processing with domain events
- **Clean Architecture**: Clear separation between core domain, business logic, and infrastructure
- **Plug & Play Adapters**: Swap messaging platforms and AI agents by changing one line
- **Multiple AI Backends**: Support for OpenAI, gRPC, HTTP REST, and GraphQL agents
- **CLI Mode**: Interactive terminal interface for testing and development

## 🏗️ Architecture

### Event-Driven Flow

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Messaging   │─────▶│   Webhook    │─────▶│   Event Bus  │─────▶│   Handler    │
│  Platform    │      │  Controller  │      │              │      │              │
└──────────────┘      └──────────────┘      └──────┬───────┘      └──────┬───────┘
                                                   │                     │
                                                   │                     ▼
                                                   │            ┌──────────────┐
                                                   │            │  AI Agent    │
                                                   │            │  Adapter     │
                                                   │            └──────┬───────┘
                                                   │                   │
                                                   ▼                   ▼
                                           ┌──────────────┐      ┌──────────────┐
                                           │   Processed  │      │   Messaging  │
                                           │    Event     │      │   Adapter    │
                                           └──────────────┘      └──────────────┘
```

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (API)                               │
│  • WebhookController                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Domain Layer (Core)                                    │
│  • EventBus (IEventBus)                                 │
│  • Domain Events (MessageReceived, Processed, Failed)   │
│  • Interfaces (IMessagingService, IAIAgent)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Business Layer                                         │
│  • ProcessMessageHandler                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     │
                     ▼ 
┌─────────────────────────────────────────────────────────┐
│  Infrastructure Layer                                   │
│  • Messaging Adapters (WhatsApp, Telegram, CLI)         │
│  • AI Agent Adapters (OpenAI, gRPC, HTTP, GraphQL)      │
│  • Event Bus Implementation (InMemoryEventBus)          │
└─────────────────────────────────────────────────────────┘
```

### Clean Architecture Layers

```
src/
├── api/                    # Presentation Layer
│   └── controllers/        # HTTP webhook endpoints
│
├── business/               # Business Logic Layer
│   └── handlers/           # Event handlers (ProcessMessageHandler)
│
├── core/                   # Domain Layer
│   ├── entities/           # Domain models (Message entities)
│   ├── events/             # Domain events (MessageReceived, MessageProcessed, MessageFailed)
│   └── interfaces/         # Contracts (IMessagingService, IAIAgent, IEventBus)
│
├── infrastructure/         # Infrastructure Layer
│   ├── messaging/          # Messaging adapters (WhatsApp, Telegram, CLI)
│   ├── ai-agents/          # AI agent adapters (OpenAI, gRPC, HTTP, GraphQL, Mock)
│   └── events/             # Event bus implementation (InMemoryEventBus)
│
├── services/               # Low-level service implementations
│   └── whatsapp.service.ts # WhatsApp API client
│
├── types/                  # External DTOs
├── lib/                    # Protocol buffers and generated code
└── app.ts                  # Dependency wiring and application setup
```

## 🔌 Adding a New Messaging Platform

1. **Create an adapter** that implements `IMessagingService`:

```typescript
// src/infrastructure/messaging/telegram.adapter.ts
import { IMessagingService } from '@/core/interfaces';
import { MessageResult } from '@/core/entities';

export class TelegramAdapter implements IMessagingService {
  async sendTextMessage(to: string, text: string): Promise<MessageResult> {
    // Your Telegram implementation
    return { success: true, messageId: 'telegram_msg_123' };
  }
}
```

2. **Swap the adapter** in `app.ts`:

```typescript
// Line 35 in app.ts
this.messagingAdapter = new TelegramAdapter(); // Instead of WhatsAppAdapter or CliAdapter
```

That's it! Your business logic stays unchanged.

## 🤖 Adding a New AI Agent

1. **Create an adapter** that implements `IAIAgent`:

```typescript
// src/infrastructure/ai-agents/custom-agent.adapter.ts
import { IAIAgent, AgentRequest, AgentResponse } from '@/core/interfaces';

export class CustomAgentAdapter implements IAIAgent {
  async infer(request: AgentRequest): Promise<AgentResponse> {
    // Your AI agent implementation
    return { success: true, answer: 'Response from custom agent' };
  }
}
```

2. **Swap the adapter** in `app.ts`:

```typescript
// Line 39 in app.ts
this.agentAdapter = new CustomAgentAdapter(); // Instead of OpenAIAgentAdapter
```

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
git clone <repo>
cd pandora
pnpm install
```

### 2. Generate Protocol Buffers
```bash
pnpm run proto:generate
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Configure based on which adapters you're using:

```bash
# Server Configuration
PORT=8080
NODE_ENV=development
LOG_LEVEL=info

# WhatsApp (if using WhatsAppAdapter)
CLOUD_API_ACCESS_TOKEN=your_whatsapp_token
CLOUD_API_VERSION=v19.0
WA_PHONE_NUMBER_ID=your_phone_number_id
WA_WEBHOOK_TOKEN=your_webhook_secret

# OpenAI (if using OpenAIAgentAdapter)
OPENAI_API_KEY=your_openai_api_key

# gRPC Agent (if using GrpcAgentAdapter)
AGENT_SERVER_ADDRESS=localhost:50051
```

### 4. Run
```bash
# Development
pnpm run dev

# Production
pnpm run build && pnpm start
```

## 🤖 AI Agent Interface

Your AI agent adapter must implement the `IAIAgent` interface:

```typescript
export interface IAIAgent {
  infer(request: AgentRequest): Promise<AgentResponse>;
}

export interface AgentRequest {
  id: string;        // User identifier
  input: string;     // User's message/input
}

export interface AgentResponse {
  success: boolean;
  answer?: string;           // AI response (if successful)
  errorMessage?: string;     // Error message (if failed)
}
```

**Available AI Agent Adapters:**
- `OpenAIAgentAdapter` - Direct OpenAI API integration
- `GrpcAgentAdapter` - gRPC-based agent server
- `HttpAgentAdapter` - HTTP REST API agent
- `GraphqlAgentAdapter` - GraphQL-based agent
- `MockAgentAdapter` - Mock agent for testing

## 📊 Environment Variables

| Variable | Description | Required | Used By |
|----------|-------------|----------|---------|
| `CLOUD_API_ACCESS_TOKEN` | WhatsApp API token | ✅* | WhatsAppAdapter |
| `CLOUD_API_VERSION` | WhatsApp API version | ✅* | WhatsAppAdapter |
| `WA_PHONE_NUMBER_ID` | WhatsApp phone number ID | ✅* | WhatsAppAdapter |
| `WA_WEBHOOK_TOKEN` | Webhook verification token | ✅* | WebhookController |
| `OPENAI_API_KEY` | OpenAI API key | ✅* | OpenAIAgentAdapter |
| `AGENT_SERVER_ADDRESS` | gRPC agent server address | ✅* | GrpcAgentAdapter |
| `PORT` | Server port (default: 8080) | ❌ | Application |
| `LOG_LEVEL` | Logging level (default: info) | ❌ | Logger |
| `NODE_ENV` | Environment (development/production) | ❌ | Application |

\* Required only when using the corresponding adapter

## 🐛 Troubleshooting

### Webhook Not Receiving Messages
- Verify webhook URL is publicly accessible (use ngrok for development)
- Check `WA_WEBHOOK_TOKEN` matches your Facebook webhook configuration
- Ensure you're using `WhatsAppAdapter` in `app.ts`

### AI Agent Not Responding
- Verify your adapter is correctly configured in `app.ts`
- For OpenAI: Check `OPENAI_API_KEY` is set
- For gRPC: Verify agent server is running on `AGENT_SERVER_ADDRESS`
- Check logs for error messages

### CLI Mode Issues
- Use `pnpm run dev` (without `watch`) when testing CLI adapter
- The `tsx watch` command can interfere with readline interface

---

**A clean foundation for your messaging AI projects** 🚀
