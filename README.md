<img align="left" src="./.github/resources/rowlet.jpg" width="75">
<h1>Pandora - Messaging Gateway Template</h1>

<div align="left">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![gRPC](https://img.shields.io/badge/gRPC-4285F4?style=for-the-badge&logo=grpc&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**A minimal, modular messaging gateway template for connecting any messaging platform to AI agents**

</div>

## 🎯 What Is This?

A **clean architecture template** for building messaging gateways. Currently implements WhatsApp, but designed to be easily adapted for:
- Telegram
- Slack
- Discord
- SMS (Twilio)
- Any messaging platform

## ✨ Features

- **Pure Text Pipeline**: Focused, minimal text-only message handling
- **Modular Architecture**: Clean separation between business logic and infrastructure
- **Plug & Play**: Swap messaging platforms by implementing a simple interface
- **AI Agent Ready**: gRPC client for connecting to any AI backend
- **User Caching**: Redis-powered cache for user authentication

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Messaging     │────│  Gateway         │────│  AI Agent       │
│   Platform      │    │  (This Template) │    │  (gRPC Server)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              └─── Redis (User Cache)
```

### Clean Architecture Layers

```
src/
├── api/                    # Presentation Layer
│   └── controllers/        # HTTP endpoints
│
├── business/               # Business Logic Layer
│   └── process-message.service.ts
│
├── core/                   # Domain Layer
│   ├── entities/           # Domain models (User)
│   └── interfaces/         # Contracts (IMessagingService, IAIAgent, IUserService)
│
├── infrastructure/         # Infrastructure Layer
│   ├── messaging/          # WhatsApp adapter (swap for Telegram, Slack, etc.)
│   ├── ai-agents/          # gRPC adapter (swap for REST, WebSocket, etc.)
│   └── storage/            # User cache adapter
│
├── services/               # Low-level implementations
│   ├── whatsapp.service.ts # WhatsApp API client
│   ├── redis.service.ts    # Redis client
│   └── user-*.service.ts   # User data services
│
├── types/                  # External DTOs
└── app.ts                  # Dependency wiring
```

## 🔌 Adding a New Messaging Platform

1. **Create an adapter** that implements `IMessagingService`:

```typescript
// src/infrastructure/messaging/telegram.adapter.ts
import { IMessagingService } from '@/core/interfaces';

export class TelegramAdapter implements IMessagingService {
  async sendTextMessage(to: string, text: string): Promise<SendMessageResponse> {
    // Your Telegram implementation
  }
  
  async markAsRead(messageId: string): Promise<SendMessageResponse> {
    // Your implementation
  }
  
  // ... other methods
}
```

2. **Swap the adapter** in `app.ts`:

```typescript
// const messagingAdapter = new WhatsAppAdapter();
const messagingAdapter = new TelegramAdapter();
```

That's it! Your business logic stays unchanged.

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

```bash
# WhatsApp Business API
CLOUD_API_ACCESS_TOKEN=your_whatsapp_token
CLOUD_API_VERSION=v19.0
WA_PHONE_NUMBER_ID=your_phone_number_id
WA_WEBHOOK_TOKEN=your_webhook_secret

# AI Agent Server (gRPC)
AGENT_SERVER_ADDRESS=localhost:50051

# Redis (optional)
REDIS_URL=redis://localhost:6379

# User API
LIVUS_API_URL=your_user_api_url
```

### 4. Run
```bash
# Development
pnpm run dev

# Production
pnpm run build && pnpm start

# Docker
docker-compose up -d
```

## 🤖 AI Agent Interface

Your AI agent should implement this gRPC interface:

```protobuf
service InferenceService {
    rpc Infer (InferenceRequest) returns (InferenceResponse);
}

message InferenceRequest {
    string user_id = 1;
    string user_email = 2;
    string user_name = 3;      
    string user_input = 4;
}

message InferenceResponse {
    string answer = 1;
    bool success = 2;
    string error_message = 3;
}
```

## 📊 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUD_API_ACCESS_TOKEN` | WhatsApp API token | ✅ |
| `WA_PHONE_NUMBER_ID` | WhatsApp phone number ID | ✅ |
| `WA_WEBHOOK_TOKEN` | Webhook verification token | ✅ |
| `AGENT_SERVER_ADDRESS` | gRPC agent server address | ✅ |
| `LIVUS_API_URL` | User authentication API | ✅ |
| `REDIS_URL` | Redis connection URL | ❌ |
| `PORT` | Server port (default: 8080) | ❌ |
| `LOG_LEVEL` | Logging level | ❌ |

## 🐛 Troubleshooting

### Webhook Not Receiving Messages
- Verify webhook URL is publicly accessible (use ngrok for development)
- Check `WA_WEBHOOK_TOKEN` matches your Facebook webhook configuration

### gRPC Connection Failed
- Verify your AI agent server is running on `AGENT_SERVER_ADDRESS`
- Ensure your agent implements the correct protobuf interface

### Redis Connection Issues
```bash
redis-cli ping  # Should return: PONG
```
**Note**: App works without Redis (no caching).

---

**A clean foundation for your messaging AI projects** 🚀
