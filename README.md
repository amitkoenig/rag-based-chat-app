# RAG Assistant

A Retrieval-Augmented Generation (RAG) chat application built with Angular, Express, and the Gemini API.

## Features

- **PDF Knowledge Base Upload**: Upload multiple PDF documents to create a custom knowledge base.
- **RAG Pipeline**: Extracts text, chunks it, generates embeddings, and stores them in an in-memory vector database.
- **Semantic Search**: Retrieves the most relevant chunks based on user queries.
- **Grounded Answers**: The chatbot uses the Gemini API to answer questions strictly based on the retrieved context, citing sources when possible.
- **Streaming Responses**: Real-time streaming of the LLM's response.

## Prerequisites

- Node.js (v20 or later recommended)
- npm
- A Gemini API Key from Google AI Studio

## Local Setup (Without Docker)

1. **Clone the repository** (if applicable) or navigate to the project directory.

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY="your_actual_api_key_here"
   PORT=3000
   ```

4. **Run the development server with proxy**:
   ```bash
   npm run build
   npm run start
   ```
   
   Alternatively, to use the Angular dev server with proxy configuration:
   ```bash
   ng serve --proxy-config proxy.conf.json --port 3000
   ```
   
   The proxy configuration in `proxy.conf.json` routes all `/api/*` requests to `http://127.0.0.1:4000`. This avoids SSRF issues with localhost.
   
   The application will be available at `http://localhost:3000` or `http://127.0.0.1:3000`.

## Running with Docker

1. **Build the Docker image**:
   ```bash
   docker build -t rag-assistant .
   ```

2. **Run the Docker container**:
   Replace `your_actual_api_key_here` with your Gemini API key.
   ```bash
   docker run -p 3000:3000 -e GEMINI_API_KEY="your_actual_api_key_here" rag-assistant
   ```
   The application will be available at `http://localhost:3000`.

## Architecture Overview

- **Frontend**: Angular 19+ standalone components, styled with Tailwind CSS.
- **Backend**: Express server integrated with Angular Universal (SSR).
- **API Proxy**: Proxy configuration routes frontend `/api/*` requests to Node.js backend at `http://127.0.0.1:4000`.
- **PDF Processing**: `pdf-parse` is used to extract text from uploaded PDFs.
- **Embeddings & LLM**: `@google/genai` SDK is used to generate embeddings (`gemini-embedding-001`) and chat responses (`models/gemini-2.5-flash-lite`).
- **Vector Store**: A simple, in-memory vector store using cosine similarity for retrieval.

## Usage

1. Open the application in your browser.
2. Use the "Knowledge Base" panel on the left to upload one or more PDF documents.
3. Wait for the processing to complete (the UI will show the number of indexed chunks).
4. Use the chat interface on the right to ask questions about the uploaded documents.
