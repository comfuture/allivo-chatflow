# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Allivo is an AI-powered presentation assistant built with Nuxt 4, Vue 3, and TypeScript. It uses OpenAI's API through Cloudflare AI Gateway to help users prepare presentations by guiding them through a structured workflow.

## Key Commands

### Development
```bash
# Start development server on http://localhost:3000
yarn dev

# Build for production
yarn build

# Install dependencies
yarn install

# Database initialization (runs automatically on startup via Nitro plugin)
```

## Architecture

### Tech Stack
- **Frontend**: Nuxt 4, Vue 3, TypeScript, Tailwind CSS
- **Backend**: Nitro server with SQLite (local) / Cloudflare D1 (production)
- **AI Integration**: OpenAI API via Cloudflare AI Gateway using Vercel AI SDK

### Database Schema
The app uses SQLite locally and Cloudflare D1 in production with two main tables:
- `chat_session`: Stores presentation context (subject, purpose, audience, core_message, structure)
- `chat_message`: Stores conversation history with JSON content

### Core Workflow
The application guides users through collecting presentation information in this order:
1. **Subject**: What the presentation is about
2. **Purpose**: Goal or desired outcome
3. **Audience**: Who will be listening
4. **Core Message**: Key takeaway in one sentence
5. **Structure**: Story structure selection (after all info collected)

### Key Files
- `server/utils/prompt.ts`: Core prompt generation and context processing logic
- `server/api/session/[sessionId].post.ts`: Main chat endpoint handling streaming responses
- `server/utils/ai.ts`: OpenAI client configuration
- `server/tasks/db/init.ts`: Database schema initialization

### Important Implementation Details

#### Language Detection
The system detects and maintains language consistency throughout the conversation:
- Initial language hint from browser (`navigator.language`)
- Continuous detection from user messages
- Responses always match user's language

#### Off-Topic Handling
The system gracefully handles off-topic messages by:
- Detecting unrelated content via AI analysis
- Redirecting users back to presentation preparation
- Maintaining context without corruption

#### Streaming Architecture
Uses Vercel AI SDK's UI streams for:
- Real-time message streaming
- Session context updates
- Suggestion generation in parallel

## Configuration

### Environment Variables
Set in runtime config:
- `NUXT_OPENAI_API_KEY`: OpenAI API key
- `NUXT_AI_GATEWAY_API_KEY`: Cloudflare AI Gateway key (optional)

### Database
- Local development: SQLite at `server/data/allivo.db`
- Production: Cloudflare D1 database named `allivo-chatflow`