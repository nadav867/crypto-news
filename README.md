# Crypto News Agent 🤖📰

An LLM-powered web application that understands user questions and provides real-time, accurate answers based on the latest cryptocurrency news.

## Features

- 🔄 **Live Crypto News Ingestion** - Automatically fetches news from The Defiant RSS feed
- 🔍 **Semantic Search** - Uses free Hugging Face embeddings to find relevant articles
- 🤖 **LLM-Powered Answers** - Generates contextual answers using free Mistral model
- 📡 **Real-time Streaming** - Streams answers word-by-word using Server-Sent Events (SSE)
- 🛡️ **Content Moderation** - Basic moderation for offensive content
- 🎨 **Modern UI** - Clean React frontend with Tailwind CSS
- 🏗️ **Modular Architecture** - Well-organized codebase with separated utilities, API calls, and components

## Tech Stack

### Backend

- NestJS (Node.js/TypeScript)
- Hugging Face Inference API (free LLM and embeddings)
- RSS Parser (for news ingestion)
- Cheerio (for web scraping)

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm

### Quick Start (Recommended - Single node_modules)

This project uses **npm workspaces** for a unified dependency management system. All dependencies are installed in a single `node_modules` folder at the root.

1. **Install all dependencies** (from project root):

```bash
npm install
```

This will install dependencies for both backend and frontend in a single `node_modules` folder.

2. **Create backend `.env` file** (required):

```bash
cd backend
echo "PORT=3001
HUGGINGFACE_API_KEY=your_api_key_here" > .env
cd ..
```

**Important:** You **must** add your Hugging Face API key to the `.env` file. The application will not start without it.

**How to get a free Hugging Face API key:**

1. Go to [huggingface.co](https://huggingface.co) and create a free account (if you don't have one)
2. Navigate to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Click "New token" and create a token with "Read" permissions
4. Copy the token and paste it into your `.env` file as `HUGGINGFACE_API_KEY=your_token_here`

5. **Start both servers** (from project root):

Simply run:

```bash
npm run dev
```

This will start both the backend and frontend servers simultaneously.

The backend will start on `http://localhost:3001` and begin fetching news articles.
The frontend will start on `http://localhost:5173`

**Alternative:** If you prefer to run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### Alternative: Separate Setup

If you prefer separate `node_modules` folders:

**Backend:**

```bash
cd backend
npm install
# Create .env file with HUGGINGFACE_API_KEY (required)
echo "PORT=3001
HUGGINGFACE_API_KEY=your_api_key_here" > .env
npm run start:dev
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Open `http://localhost:5173` in your browser
2. Type a question about cryptocurrency news in the input field
3. Click "Send" to get a real-time streaming answer based on the latest news articles

## API Endpoint

### GET /ask

Query crypto news and get streaming answers.

**Parameters:**

- `q` (required): Your question about crypto news

**Example:**

```
GET http://localhost:3001/ask?q=What%20is%20happening%20with%20Bitcoin%20today?
```

**Response:**
Server-Sent Events (SSE) stream with JSON messages:

- `{ type: 'chunk', content: '...' }` - Text chunks as they're generated
- `{ type: 'done' }` - Stream completion
- `{ type: 'error', message: '...' }` - Error occurred

## Project Structure

```
crypto-news-agent/
├── node_modules/          # Single node_modules (npm workspaces)
├── package.json           # Root package.json with workspaces
├── backend/
│   ├── src/
│   │   ├── api/           # External API integrations
│   │   │   ├── huggingface-api.ts
│   │   │   ├── rss-api.ts
│   │   │   └── web-scraper-api.ts
│   │   ├── interfaces/    # TypeScript interfaces
│   │   │   ├── news.interface.ts
│   │   │   └── article-metadata.interface.ts
│   │   ├── services/      # Business logic services
│   │   │   ├── moderation.service.ts
│   │   │   ├── news.service.ts
│   │   │   ├── search.service.ts
│   │   │   └── llm.service.ts
│   │   ├── utils/         # Utility functions
│   │   │   ├── cosine-similarity.util.ts
│   │   │   ├── keyword-search.util.ts
│   │   │   ├── prompt-builder.util.ts
│   │   │   ├── llm-error-handler.util.ts
│   │   │   ├── sse-headers.util.ts
│   │   │   └── embedding-response-parser.util.ts
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/           # API call functions
    │   │   └── ask-api.ts
    │   ├── components/    # React components
    │   │   ├── AskQuestion.tsx      # Main chat component
    │   │   ├── ChatInput.tsx        # Input form
    │   │   ├── ChatMessages.tsx     # Messages container
    │   │   ├── ChatMessage.tsx      # Individual message
    │   │   ├── WelcomeMessage.tsx   # Welcome screen
    │   │   ├── LoadingIndicator.tsx # Loading state
    │   │   ├── StreamingMessage.tsx # Streaming text
    │   │   └── ErrorMessage.tsx      # Error display
    │   ├── types/         # TypeScript types
    │   │   └── index.ts
    │   ├── utils/         # Utility functions
    │   │   └── sse-parser.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    └── package.json
```

## Available Scripts

From the **project root**:

- `npm install` - Install all dependencies (workspaces)
- `npm run dev:backend` - Start backend development server
- `npm run dev:frontend` - Start frontend development server
- `npm run build` - Build both backend and frontend
- `npm run clean` - Remove all node_modules folders

From **individual workspaces**:

- `npm run start:dev --workspace=backend` - Start backend
- `npm run dev --workspace=frontend` - Start frontend

## Architecture

### Backend Architecture

- **API Layer** (`api/`): Handles all external API calls (Hugging Face, RSS, Web Scraping)
- **Services Layer** (`services/`): Contains business logic and orchestrates API calls
- **Utils Layer** (`utils/`): Pure utility functions (calculations, formatting, error handling)
- **Interfaces** (`interfaces/`): TypeScript type definitions

### Frontend Architecture

- **API Layer** (`api/`): Centralized API call functions
- **Components** (`components/`): Small, focused React components
- **Utils** (`utils/`): Utility functions (SSE parsing, etc.)
- **Types** (`types/`): Shared TypeScript interfaces

## Notes

- **npm workspaces**: This project uses npm workspaces for unified dependency management. All dependencies are installed in a single `node_modules` folder at the root, reducing disk space and installation time.
- **Free LLM**: Uses Hugging Face's free Mistral-7B-Instruct model for generating answers
- **Free Embeddings**: Uses Hugging Face's BAAI/bge-small-en-v1.5 model for semantic search
- News articles are fetched on startup and cached for 30 minutes (1800000ms)
- The semantic search falls back to keyword-based search if embeddings fail
- The application handles concurrent requests and includes comprehensive error handling
- **Modular Design**: Code is organized into small, maintainable files with clear separation of concerns
