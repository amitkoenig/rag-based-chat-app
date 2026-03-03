import { GoogleGenAI } from '@google/genai';
import { vectorStore } from './vector-store';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    let key = process.env['GEMINI_API_KEY'];
    if (!key || key === 'undefined' || key === 'null' || key === 'YOUR_GEMINI_API_KEY' || key === '${GEMINI_API_KEY}' || key === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY is not set or is invalid placeholder');
    }
    key = key.replace(/^['"]|['"]$/g, '').trim();
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export class QueryService {
  async handleQuery(query: string, history: {role: string, content: string}[] = []) {
    console.log(`Handling query: ${query}`);
    
    // 1. Generate embedding for query
    const ai = getAiClient();
    const embedResponse = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: query,
    });
    
    const queryEmbedding = embedResponse.embeddings?.[0]?.values;
    if (!queryEmbedding) {
      throw new Error("Failed to generate embedding for query");
    }
    
    // 2. Retrieve top relevant chunks
    const topChunks = await vectorStore.search(queryEmbedding, 5);
    // 3. Construct context prompt
    const contextText = topChunks.map((chunk) => 
      `[Document: ${chunk.metadata.fileName}, Chunk: ${chunk.metadata.chunkIndex}]\n${chunk.text}`
    ).join('\n\n');

    // Debug: log context
    console.log('Gemini context prompt:', contextText);

    const systemInstruction = `You are a knowledge base assistant.
Use ONLY the provided context to answer questions.
If the context does not contain the answer say:
"I could not find this information in the provided documents."
Cite the document name when possible.

Context:
${contextText}
`;

    const contents = [];
    for (const msg of history) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: query }]
    });

    // Debug: log model input
    console.log('Gemini model input:', JSON.stringify({
      model: 'models/gemini-2.5-flash-lite',
      contents,
      config: { systemInstruction, temperature: 0.2 }
    }, null, 2));

    const response = await ai.models.generateContentStream({
      model: 'models/gemini-2.5-flash-lite',
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });
    
    console.log('Gemini response:', response);
    console.log('Gemini response type:', typeof response);
    console.log('Gemini response constructor:', response?.constructor?.name);

    return {
      stream: response,
      sources: topChunks.map(c => ({
        fileName: c.metadata.fileName,
        chunkIndex: c.metadata.chunkIndex,
        text: c.text.substring(0, 100) + '...'
      }))
    };
  }
}

export const queryService = new QueryService();
