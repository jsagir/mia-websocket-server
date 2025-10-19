# Mia WebSocket Server

WebSocket server for Mia AI Companion - providing real-time emotional support and guidance through AI-powered conversations.

## Features

- Real-time WebSocket communication using Socket.io
- OpenAI GPT-4o integration with streaming responses
- JWT-based authentication with anonymous fallback
- Session management with conversation history
- Safety tier detection (Tier 1-3)
- Age detection and mode switching
- Comprehensive logging with Winston

## Prerequisites

- Node.js v20+
- npm
- OpenAI API key

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
OPENAI_API_KEY=your-openai-api-key
MIA_WORKFLOW_ID=your-workflow-id
JWT_SECRET=your-secret-key
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000
LOG_LEVEL=info
```

## Development

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## API Endpoints

### REST API

- `GET /health` - Health check endpoint
- `POST /api/auth/token` - Generate JWT token

### WebSocket Events

**Client to Server:**
- `join_session` - Join or create a session
- `message` - Send a message to Mia

**Server to Client:**
- `session_created` - Session created/joined successfully
- `message_chunk` - Streaming message chunk from Mia
- `message_complete` - Complete message from Mia
- `safety_alert` - Safety tier alert (Tier 2-3)
- `error` - Error message

## Modes

- `GREETING` - Initial greeting mode
- `MIRROR_LEARNING` - For ages 5-12
- `EDUCATIONAL` - For ages 13+
- `URGENCY` - Urgent support needed
- `FUNDRAISING` - Fundraising/building mode

## Safety Tiers

- **Tier 1**: Normal conversation
- **Tier 2**: Moderate concerns (substance-related)
- **Tier 3**: Critical concerns (self-harm, suicide)

## Project Structure

```
mia-websocket-server/
├── src/
│   ├── server.ts              # Main server file
│   ├── middleware/
│   │   └── auth.ts            # JWT authentication
│   ├── services/
│   │   ├── mia.service.ts     # OpenAI integration
│   │   └── session.service.ts # Session management
│   └── utils/
│       └── logger.ts          # Winston logger
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
└── README.md
```

## License

MIT
