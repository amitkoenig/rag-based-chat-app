import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: 'test' });
ai.models.embedContent({ model: 'gemini-embedding-001', contents: 'hello' }).then(console.log).catch(console.error);
