# Crypto News Agent 🤖📰

An LLM-powered web application that understands user questions and provides real-time, accurate answers based on the latest cryptocurrency news.

## Features

- 🔄 **Live Crypto News Ingestion** - Automatically fetches news from DL News, The Defiant, and Cointelegraph
- 🔍 **Semantic Search** - Uses free Hugging Face embeddings to find relevant articles
- 🤖 **LLM-Powered Answers** - Generates contextual answers using free Mistral model
- 📡 **Real-time Streaming** - Streams answers word-by-word using Server-Sent Events (SSE)
- 🛡️ **Content Moderation** - Basic moderation for offensive content
- 🎨 **Modern UI** - Clean React frontend with Tailwind CSS

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
- (Optional) Hugging Face API key for faster responses (works without it too!)

### Quick Start (Recommended - Single node_modules)

This project uses **npm workspaces** for a unified dependency management system. All dependencies are installed in a single `node_modules` folder at the root.

1. **Install all dependencies** (from project root):
```bash
npm install
```

This will install dependencies for both backend and frontend in a single `node_modules` folder.

2. **Create backend `.env` file** (optional - works without API key too):
```bash
cd backend
echo "PORT=3000
HUGGINGFACE_API_KEY=
NEWS_UPDATE_INTERVAL=3600000" > .env
cd ..
```

**Note:** The Hugging Face API key is optional. Without it, the API will work but may have rate limits. Get a free API key at [huggingface.co](https://huggingface.co/settings/tokens) if you want faster responses.

3. **Start both servers** (from project root):

**Option A: Run both together** (requires `&` or use two terminals):
```bash
npm run dev:backend
# In another terminal:
npm run dev:frontend
```

**Option B: Run individually**:
```bash
# Backend (Terminal 1)
npm run dev:backend

# Frontend (Terminal 2)  
npm run dev:frontend
```

The backend will start on `http://localhost:3000` and begin fetching news articles.
The frontend will start on `http://localhost:5173`

### Alternative: Separate Setup

If you prefer separate `node_modules` folders:

**Backend:**
```bash
cd backend
npm install
# Create .env file
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
3. Click "Ask" to get a real-time streaming answer based on the latest news articles

## API Endpoint

### GET /ask

Query crypto news and get streaming answers.

**Parameters:**
- `q` (required): Your question about crypto news

**Example:**
```
GET http://localhost:3000/ask?q=What%20is%20happening%20with%20Bitcoin%20today?
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
│   │   ├── interfaces/
│   │   │   └── news.interface.ts
│   │   ├── services/
│   │   │   ├── moderation.service.ts
│   │   │   ├── news.service.ts
│   │   │   ├── search.service.ts
│   │   │   └── llm.service.ts
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── AskQuestion.tsx
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

## Notes

- **npm workspaces**: This project uses npm workspaces for unified dependency management. All dependencies are installed in a single `node_modules` folder at the root, reducing disk space and installation time.
- **Free LLM**: Uses Hugging Face's free Mistral-7B-Instruct model for generating answers
- **Free Embeddings**: Uses Hugging Face's free sentence-transformers model for semantic search
- News articles are fetched on startup and updated every hour (configurable via `NEWS_UPDATE_INTERVAL`)
- The semantic search falls back to keyword-based search if embeddings fail
- The application handles concurrent requests and includes error handling

