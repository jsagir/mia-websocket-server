# Mia WebSocket Server - Current State Documentation

**Date**: October 19, 2025
**Version**: 1.0.0
**Status**: Development - Built and Functional

---

## Project Overview

**Mia WebSocket Server** is a real-time communication server for an AI-powered emotional support companion. It provides WebSocket-based chat functionality with OpenAI GPT-4o integration, safety detection, and adaptive conversation modes.

### Key Information
- **Location**: `/home/jsagi/projects/mia-websocket-server`
- **Language**: TypeScript 5.3.3
- **Runtime**: Node.js v20+
- **Total Lines of Code**: 483 lines
- **Build Status**: Compiled and ready
- **Git Repository**: Initialized with 2 commits, synced to GitHub

---

## Technology Stack

### Runtime & Framework
- **Node.js**: v20+ (LTS)
- **TypeScript**: 5.3.3 with strict type checking
- **Express**: 4.18.2 (HTTP server)
- **Socket.io**: 4.6.1 (WebSocket communication)

### External Services
- **OpenAI API**: GPT-4o model for AI conversations
- **Model**: `gpt-4o`
- **Temperature**: 0.7
- **Streaming**: Enabled

### Authentication & Security
- **JWT**: jsonwebtoken 9.0.2
- **CORS**: cors 2.8.5

### Utilities
- **Logging**: Winston 3.11.0
- **Environment**: dotenv 16.3.1

---

## Current Architecture

### File Structure

```
mia-websocket-server/
├── src/
│   ├── server.ts                  # Main server entry point (158 lines)
│   ├── middleware/
│   │   └── auth.ts               # JWT authentication (35 lines)
│   ├── services/
│   │   ├── mia.service.ts        # OpenAI integration (151 lines)
│   │   └── session.service.ts    # Session management (126 lines)
│   └── utils/
│       └── logger.ts             # Winston logger (18 lines)
├── dist/                         # Compiled JavaScript
├── node_modules/                 # Dependencies (152 packages)
├── package.json                  # Project configuration
├── tsconfig.json                 # TypeScript configuration
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── README.md                     # Project documentation
└── test-chat.html               # Test client interface
```

### System Architecture

```
┌─────────────────────────────────────────┐
│         Client (Browser/App)            │
│         - WebSocket Connection          │
│         - HTTP Requests                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Express HTTP Server               │
│       Port: 3001 (configurable)         │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  REST Endpoints:               │    │
│  │  - GET  /health                │    │
│  │  - POST /api/auth/token        │    │
│  └────────────────────────────────┘    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Socket.io WebSocket Server        │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Events:                       │    │
│  │  - connection                  │    │
│  │  - join_session                │    │
│  │  - message                     │    │
│  │  - disconnect                  │    │
│  └────────────────────────────────┘    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Authentication Middleware         │
│       - JWT token verification          │
│       - Anonymous user support          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Session Service                   │
│       - In-memory storage (Map)         │
│       - Conversation history            │
│       - User state management           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Mia AI Service                    │
│       - OpenAI API calls                │
│       - Safety detection                │
│       - Age detection                   │
│       - Mode detection                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       OpenAI API (GPT-4o)               │
│       - Streaming responses             │
└─────────────────────────────────────────┘
```

---

## Core Components

### 1. server.ts - Main Application

**Purpose**: Application entry point and WebSocket event handling

**Configuration**:
- Port: 3001 (from `PORT` env variable)
- CORS: Configured for allowed origins
- Health check: Available at `/health`

**REST Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns server health status, timestamp, and uptime |
| POST | `/api/auth/token` | Generates JWT token for a given userId |

**WebSocket Events**:

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `connection` | Server | Socket object | New client connected |
| `join_session` | Client → Server | `{ sessionId }` | Join/create a session |
| `session_created` | Server → Client | Session data | Confirms session creation |
| `message` | Client → Server | `{ sessionId, message }` | Send user message |
| `message_chunk` | Server → Client | `{ sessionId, chunk }` | Streaming AI response chunk |
| `message_complete` | Server → Client | `{ sessionId, message }` | Complete AI response |
| `safety_alert` | Server → Client | `{ tier, sessionId }` | Safety concern detected |
| `error` | Server → Client | `{ message, error }` | Error occurred |
| `disconnect` | Server | - | Client disconnected |

**Message Processing Flow**:
1. Receive user message
2. Save to session history
3. Detect safety tier (keyword matching)
4. Detect user age (regex patterns)
5. Determine conversation mode
6. Send to OpenAI with streaming
7. Stream chunks back to client
8. Save complete response to history

---

### 2. middleware/auth.ts - Authentication

**Purpose**: WebSocket authentication middleware

**Authentication Methods**:
1. **JWT Token**: Validates token from `socket.handshake.auth.token` or `Authorization` header
2. **Anonymous**: Falls back to `anon_${Date.now()}` if no token or invalid token

**Process**:
```
Token provided?
├── Yes → Verify JWT
│   ├── Valid → Use userId from token
│   └── Invalid → Create anonymous ID
└── No → Create anonymous ID
```

**JWT Configuration**:
- Secret: From `JWT_SECRET` env variable (defaults to 'change-this-secret')
- Expiration: 7 days
- Algorithm: Default (HS256)

---

### 3. services/session.service.ts - Session Management

**Purpose**: Manages user sessions and conversation history

**Storage**: In-memory JavaScript `Map<string, Session>`

**Session Structure**:
```typescript
interface Session {
  sessionId: string;           // Unique session identifier
  userId: string;              // User identifier
  conversationHistory: Message[];  // Array of messages
  age: number | null;          // Detected user age
  mode: string;                // Conversation mode
  safetyTier: number;          // Safety level (1-3)
  status: string;              // Session status
  createdAt: number;           // Timestamp
  updatedAt: number;           // Last update timestamp
}
```

**Message Structure**:
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

**Methods**:

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `generateToken()` | userId | string (JWT) | Creates a JWT token |
| `getOrCreate()` | userId, sessionId? | Session | Gets existing or creates new session |
| `addMessage()` | sessionId, role, content | void | Adds message to history |
| `getHistory()` | sessionId | Message[] | Returns conversation history |
| `updateAge()` | sessionId, age | void | Updates user age |
| `updateMode()` | sessionId, mode | void | Updates conversation mode |
| `updateStatus()` | sessionId, status | void | Updates session status |
| `updateSafetyTier()` | sessionId, tier | void | Updates safety tier |
| `getSession()` | sessionId | Session \| undefined | Retrieves session |

**Session ID Format**: `session_${userId}_${timestamp}`

**Initial State**:
- mode: 'GREETING'
- safetyTier: 1
- status: 'active'
- age: null

---

### 4. services/mia.service.ts - AI Integration

**Purpose**: OpenAI API integration and detection logic

#### OpenAI Integration

**Configuration**:
- Model: `gpt-4o`
- Temperature: 0.7
- Streaming: Enabled

**System Prompt**:
```
"You are Mia, a compassionate AI companion designed to provide emotional support and guidance."
```

**Message Format**:
1. System prompt
2. Conversation history (all previous messages)
3. New user message

**Response**: Async stream of message chunks

#### Safety Tier Detection

**Method**: Keyword matching (case-insensitive)

**Tier 3 - Critical** (Keywords):
- "want to die"
- "kill myself"
- "suicide"
- "self harm" / "self-harm"
- "end my life"
- "better off dead"

**Tier 2 - Moderate** (Keywords):
- "pills"
- "drugs"
- "dealer"
- "addicted"
- "overdose"
- "cutting"
- "hurt myself"

**Tier 1 - Normal**: Default (no keywords matched)

#### Age Detection

**Method**: Regex pattern matching

**Patterns**:
- `i('m| am) (\d+)( years? old)?` - "I am 15 years old", "I'm 15"
- `(\d+) years? old` - "15 years old"
- `age (is )?(\d+)` - "age is 15", "age 15"
- `turning (\d+)` - "turning 15"

**Validation**: Age must be between 5-100

**Returns**: number | null

#### Mode Detection

**Logic**:

| Priority | Condition | Mode |
|----------|-----------|------|
| 1 | Message contains "why now" or "urgent" | URGENCY |
| 2 | Message contains "donate", "fund", or "build" | FUNDRAISING |
| 3 | Age 5-12 detected | MIRROR_LEARNING |
| 4 | Age 13+ detected | EDUCATIONAL |
| 5 | Default | GREETING |

**Modes**:
- **GREETING**: Initial greeting mode
- **MIRROR_LEARNING**: For children (ages 5-12), learning through reflection
- **EDUCATIONAL**: For teenagers and adults (ages 13+)
- **URGENCY**: Urgent support needed
- **FUNDRAISING**: Fundraising/building mode

---

### 5. utils/logger.ts - Logging

**Purpose**: Centralized logging with Winston

**Configuration**:
- Level: From `LOG_LEVEL` env variable (default: 'info')
- Format: `YYYY-MM-DD HH:mm:ss [level]: message`
- Colors: Enabled
- Transport: Console only

**Log Levels** (Winston standard):
- `error`: Error messages
- `warn`: Warning messages
- `info`: Informational messages
- `debug`: Debug messages

**Usage Throughout App**:
- Connection events
- Authentication
- Session operations
- OpenAI API calls
- Safety tier detections
- Age detections
- Mode changes
- Errors

---

## Environment Configuration

### Required Variables

```bash
# .env file
OPENAI_API_KEY=sk-proj-...        # OpenAI API key
JWT_SECRET=your-secret-key        # JWT signing secret
PORT=3001                         # Server port
NODE_ENV=production               # Environment mode
ALLOWED_ORIGINS=http://localhost:3000  # CORS allowed origins
LOG_LEVEL=info                    # Logging level
```

### Optional Variables

```bash
MIA_WORKFLOW_ID=wf_...           # Workflow ID (defined but not used)
```

---

## Data Flow Examples

### Example 1: New User Connection

```
1. Client connects to ws://localhost:3001
2. Server applies auth middleware
3. No token provided → Creates anonymous ID: anon_1729345678901
4. Socket connection established
5. Server emits 'connection' event
6. Logger: "Client connected: abc123, userId: anon_1729345678901"
```

### Example 2: Joining a Session

```
Client → Server: emit('join_session', { sessionId: undefined })
Server:
  1. sessionService.getOrCreate('anon_123', undefined)
  2. Creates new session: session_anon_123_1729345678901
  3. Initial state: { mode: 'GREETING', safetyTier: 1, age: null }
Server → Client: emit('session_created', { sessionId, userId, age, mode, safetyTier, conversationHistory: [] })
```

### Example 3: Normal Message

```
Client → Server: emit('message', {
  sessionId: 'session_123',
  message: 'Hello, I need someone to talk to'
})

Server Process:
  1. sessionService.addMessage('session_123', 'user', 'Hello...')
  2. miaService.detectSafetyTier('Hello...') → 1 (normal)
  3. miaService.detectAge('Hello...') → null
  4. miaService.detectMode('Hello...', null) → 'GREETING'
  5. sessionService.updateMode('session_123', 'GREETING')
  6. miaService.sendMessage() → OpenAI stream
  7. For each chunk:
     Server → Client: emit('message_chunk', { sessionId, chunk: '...' })
  8. sessionService.addMessage('session_123', 'assistant', fullResponse)
  9. Server → Client: emit('message_complete', { sessionId, message: fullResponse })
```

### Example 4: Crisis Detection

```
Client → Server: emit('message', {
  sessionId: 'session_123',
  message: 'I want to die'
})

Server Process:
  1. sessionService.addMessage()
  2. miaService.detectSafetyTier('I want to die') → 3 (critical)
  3. sessionService.updateSafetyTier('session_123', 3)
  4. Server → Client: emit('safety_alert', { tier: 3, sessionId: 'session_123' })
  5. Continue with normal message processing...
```

### Example 5: Age Detection

```
Client → Server: emit('message', {
  sessionId: 'session_123',
  message: "Hi, I'm 10 years old"
})

Server Process:
  1. sessionService.addMessage()
  2. miaService.detectSafetyTier() → 1
  3. miaService.detectAge("I'm 10 years old") → 10
  4. sessionService.updateAge('session_123', 10)
  5. miaService.detectMode(..., age: 10) → 'MIRROR_LEARNING' (age 5-12)
  6. sessionService.updateMode('session_123', 'MIRROR_LEARNING')
  7. Continue with OpenAI call...
```

---

## Current Capabilities

### What Works

✅ **Real-time Communication**
- WebSocket connections via Socket.io
- Bidirectional event-based messaging
- Connection/disconnection handling

✅ **AI Conversations**
- OpenAI GPT-4o integration
- Streaming responses (word-by-word)
- Conversation history maintained
- Context-aware responses

✅ **Authentication**
- JWT token generation
- Token verification
- Anonymous user support
- Graceful fallback

✅ **Safety Features**
- Keyword-based crisis detection
- 3-tier safety system
- Alerts sent to client

✅ **User Adaptation**
- Age detection from messages
- Mode switching based on age/context
- 5 conversation modes

✅ **Session Management**
- Session creation and retrieval
- Conversation history storage
- User state tracking

✅ **Monitoring**
- Health check endpoint
- Comprehensive logging
- Colored console output

✅ **Security**
- CORS configuration
- JWT authentication
- Environment variable configuration

---

## Current Limitations

### Storage
- Sessions stored in-memory (lost on restart)
- No persistent database
- No session expiration

### Scalability
- Single server instance only
- No horizontal scaling support
- No load balancing

### Safety
- Basic keyword matching only
- No machine learning
- No context awareness in detection

### Validation
- No input validation
- No message length limits
- No rate limiting

### Testing
- No unit tests
- No integration tests
- No test coverage

### Monitoring
- Console logging only
- No metrics collection
- No error tracking service

---

## How to Run

### Development Mode

```bash
# Install dependencies
npm install

# Run in development (with ts-node)
npm run dev

# Server starts on http://localhost:3001
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Run compiled JavaScript
npm start
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Run in development mode with ts-node |
| `npm start` | Run compiled production build |
| `npm run watch` | Watch mode for TypeScript compilation |

---

## Testing the Server

### Using test-chat.html

A test HTML file is available at the project root:

```bash
# Open in browser
open test-chat.html
```

**Features**:
- WebSocket connection interface
- Send messages
- View streaming responses
- Session management
- Safety alerts display

### Using REST API

```bash
# Health check
curl http://localhost:3001/health

# Generate token
curl -X POST http://localhost:3001/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
```

### Using WebSocket Client (JavaScript)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' } // or omit for anonymous
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);

  // Join session
  socket.emit('join_session', { sessionId: null });
});

socket.on('session_created', (data) => {
  console.log('Session:', data.sessionId);

  // Send message
  socket.emit('message', {
    sessionId: data.sessionId,
    message: 'Hello Mia!'
  });
});

socket.on('message_chunk', (data) => {
  process.stdout.write(data.chunk);
});

socket.on('message_complete', (data) => {
  console.log('\nComplete:', data.message);
});

socket.on('safety_alert', (data) => {
  console.log('ALERT - Tier', data.tier);
});
```

---

## Dependencies

### Production Dependencies (7)

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | HTTP server framework |
| socket.io | ^4.6.1 | WebSocket communication |
| openai | ^4.28.0 | OpenAI API client |
| dotenv | ^16.3.1 | Environment variable management |
| cors | ^2.8.5 | CORS middleware |
| jsonwebtoken | ^9.0.2 | JWT token handling |
| winston | ^3.11.0 | Logging framework |

### Development Dependencies (4)

| Package | Version | Purpose |
|---------|---------|---------|
| @types/node | ^20.10.0 | Node.js type definitions |
| @types/express | ^4.17.21 | Express type definitions |
| @types/cors | ^2.8.17 | CORS type definitions |
| @types/jsonwebtoken | ^9.0.5 | JWT type definitions |
| typescript | ^5.3.3 | TypeScript compiler |
| ts-node | ^10.9.2 | TypeScript execution |

**Total Package Count**: 152 packages (including transitive dependencies)

---

## Git Repository

### Status
- **Branch**: main
- **Commits**: 2
- **Remote**: origin/main (GitHub)
- **Sync Status**: Up to date

### Commit History

```
44762f0 - Update package-lock.json to fix dependency sync
5b71909 - Initial commit - Mia WebSocket Server
```

### Untracked Files
- `CODE_REVIEW.md` (code review document)
- `test-chat.html` (test client)

---

## Build Output

### Compiled Files (dist/)

The TypeScript compilation produces:

```
dist/
├── server.js
├── server.d.ts
├── server.js.map
├── middleware/
│   ├── auth.js
│   ├── auth.d.ts
│   └── auth.js.map
├── services/
│   ├── mia.service.js
│   ├── mia.service.d.ts
│   ├── mia.service.js.map
│   ├── session.service.js
│   ├── session.service.d.ts
│   └── session.service.js.map
└── utils/
    ├── logger.js
    ├── logger.d.ts
    └── logger.js.map
```

**Total Compiled Output**: CommonJS modules with source maps and type declarations

---

## Project Statistics

| Metric | Value |
|--------|-------|
| Total TypeScript Files | 5 |
| Total Lines of Code | 483 |
| Dependencies (Production) | 7 |
| Dependencies (Dev) | 6 |
| Total Packages | 152 |
| TypeScript Version | 5.3.3 |
| Node.js Requirement | v20+ |
| Git Commits | 2 |
| API Endpoints | 2 |
| WebSocket Events | 8 |
| Conversation Modes | 5 |
| Safety Tiers | 3 |

---

## Summary

The Mia WebSocket Server is a **functional, working application** in development stage. It successfully:

- Handles real-time WebSocket connections
- Integrates with OpenAI GPT-4o for AI conversations
- Provides streaming responses for better UX
- Detects safety concerns using keyword matching
- Adapts conversation mode based on user age
- Manages sessions and conversation history
- Authenticates users via JWT with anonymous fallback
- Logs all operations comprehensively

The codebase is **clean, well-organized, and type-safe** with good separation of concerns. All core features are implemented and working, making it ready for development testing and further enhancement.

---

**Document Version**: 1.0
**Last Updated**: October 19, 2025
**Next Update**: When changes are made to the codebase
