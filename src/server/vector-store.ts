export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    fileName: string;
    pageNumber?: number;
    chunkIndex: number;
  };
  embedding: number[];
}

export class VectorStore {
  private chunks: DocumentChunk[] = [];

  addChunks(newChunks: DocumentChunk[]) {
    this.chunks.push(...newChunks);
    console.log(`Added ${newChunks.length} chunks. Total chunks: ${this.chunks.length}`);
  }

  async search(queryEmbedding: number[], topK = 5): Promise<DocumentChunk[]> {
    if (this.chunks.length === 0) return [];

    const scoredChunks = this.chunks.map(chunk => {
      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      return { chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK).map(sc => sc.chunk);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  clear() {
    this.chunks = [];
  }
  
  get count() {
    return this.chunks.length;
  }
}

export const vectorStore = new VectorStore();
