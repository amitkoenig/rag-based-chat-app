import { PDFParse } from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';
import { vectorStore, DocumentChunk } from './vector-store';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    let key = process.env['GEMINI_API_KEY'];
    if (!key || key === 'undefined' || key === 'null' || key === 'YOUR_GEMINI_API_KEY' || key === '${GEMINI_API_KEY}' || key === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY is not set or is invalid placeholder');
    }
    // Strip quotes and whitespace
    key = key.replace(/^['"]|['"]$/g, '').trim();
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export class DocumentIngestionService {
  
  async processPdf(buffer: Buffer, fileName: string) {
    console.log(`Processing PDF: ${fileName}`);
    
    // 1. Extract text
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    const text = data.text;
    console.log(`Extracted text length: ${text?.length || 0}`);
    
    // 2. Clean and preprocess
    const cleanedText = this.cleanText(text || '');
    console.log(`Cleaned text length: ${cleanedText.length}`);
    
    // 3. Chunk the content
    const chunks = this.chunkText(cleanedText, 1000, 200);
    console.log(`Generated ${chunks.length} chunks`);
    
    // 4. Generate embeddings and store
    const documentChunks: DocumentChunk[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      try {
        const ai = getAiClient();
        const response = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: chunkText,
        });
        
        const embedding = response.embeddings?.[0]?.values;
        if (embedding) {
          documentChunks.push({
            id: `${fileName}-chunk-${i}`,
            text: chunkText,
            metadata: {
              fileName,
              chunkIndex: i,
            },
            embedding,
          });
        } else {
          errors.push(`No embedding returned for chunk ${i}`);
        }
      } catch (error: unknown) {
        console.error(`Error embedding chunk ${i} of ${fileName}:`, error);
        errors.push(`Error embedding chunk ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // 5. Store in vector database
    vectorStore.addChunks(documentChunks);
    return { chunks: documentChunks.length, textLength: text?.length || 0, cleanedLength: cleanedText.length, errors };
  }

  private cleanText(text: string): string {
    return text
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.substring(i, i + chunkSize));
      i += chunkSize - overlap;
    }
    return chunks;
  }
}

export const documentIngestionService = new DocumentIngestionService();
