import dotenv from 'dotenv';
dotenv.config();
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import multer from 'multer';
import { documentIngestionService } from './server/document-ingestion';
import { queryService } from './server/query-service';
import { vectorStore } from './server/vector-store';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', (req, res, next) => {
  console.log('Upload request received. Headers:', req.headers);
  console.log('req.body type:', typeof req.body);
  if (Buffer.isBuffer(req.body)) {
    console.log('req.body is a Buffer of length', req.body.length);
  } else if (req.body) {
    console.log('req.body keys:', Object.keys(req.body));
  }
  next();
}, upload.array('files'), async (req, res): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    let totalChunks = 0;
    let totalText = 0;
    const allErrors: string[] = [];
    for (const file of files) {
      const result = await documentIngestionService.processPdf(file.buffer, file.originalname);
      totalChunks += result.chunks;
      totalText += result.textLength;
      if (result.errors && result.errors.length > 0) {
        allErrors.push(...result.errors);
      }
    }

    res.json({ message: `Successfully processed ${files.length} files into ${totalChunks} chunks. Total text length: ${totalText}. Errors: ${allErrors.join(', ')}` });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.post('/api/chat', async (req, res): Promise<void> => {
  try {
    const { query, history } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    console.log('Chat request:', { query, historyLength: history?.length || 0 });

    const { stream, sources } = await queryService.handleQuery(query, history || []);

    // Collect all text chunks from Gemini stream
    let finalAnswer = '';
    let chunkCount = 0;

    try {
      for await (const chunk of stream) {
        console.log('Stream chunk received:', JSON.stringify(chunk, null, 2));
        
        if (chunk && chunk.text) {
          console.log(`Chunk ${chunkCount}: "${chunk.text}"`);
          finalAnswer += chunk.text;
          chunkCount++;
        }
      }
    } catch (streamError) {
      console.error('Error reading stream:', streamError);
      throw streamError;
    }

    console.log(`Final answer assembled from ${chunkCount} chunks:`, finalAnswer);
    console.log('Sources found:', sources);

    // Ensure we have a response
    if (!finalAnswer || finalAnswer.trim() === '') {
      console.log('No answer generated, using fallback');
      finalAnswer = "I could not find this information in the provided documents.";
    }

    // Send JSON response
    res.json({
      answer: finalAnswer,
      sources: sources,
      success: true
    });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      error: errorMessage,
      answer: null,
      sources: [],
      success: false
    });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({ documentChunks: vectorStore.count });
});

app.post('/api/clear', (req, res) => {
  vectorStore.clear();
  res.json({ message: 'Knowledge base cleared' });
});

// Catch-all for /api/* to prevent falling through to Angular SSR
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// Add error handler to prevent HTML responses for API errors
app.use('/api', (err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  _next();
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
