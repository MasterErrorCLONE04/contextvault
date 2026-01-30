import { pipeline } from '@xenova/transformers';

export class EmbeddingService {
    private static instance: EmbeddingService;
    private embedder: any | null = null;
    private cache = new Map<string, Float32Array>();
    private modelName = 'Xenova/all-MiniLM-L6-v2'; // 384 dims, ~22MB

    private constructor() { }

    static async getInstance(): Promise<EmbeddingService> {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
            await EmbeddingService.instance.init();
        }
        return EmbeddingService.instance;
    }

    private async init() {
        console.error('🧠 Cargando modelo de embeddings (primera vez ~20MB)...');
        this.embedder = await pipeline('feature-extraction', this.modelName, {
            quantized: false,
            revision: 'main'
        });
        console.error('✅ Modelo de embeddings listo');
    }

    async generateEmbedding(text: string): Promise<Float32Array> {
        const normalized = text.toLowerCase().trim().slice(0, 512);

        if (this.cache.has(normalized)) {
            return this.cache.get(normalized)!;
        }

        if (!this.embedder) throw new Error('EmbeddingService no inicializado');

        const output = await this.embedder(normalized, {
            pooling: 'mean',
            normalize: true
        });

        const vector = new Float32Array(output.data);

        // Cache limitado a 1000 entradas (LRU simple)
        if (this.cache.size < 1000) {
            this.cache.set(normalized, vector);
        }

        return vector;
    }

    // Convertir Float32Array a Buffer para SQLite
    static vectorToBuffer(vector: Float32Array): Buffer {
        return Buffer.from(vector.buffer);
    }

    // Convertir Buffer de SQLite a Float32Array
    static bufferToVector(buffer: Buffer): Float32Array {
        return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
    }
}

// Cosine similarity optimizado
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) throw new Error('Dimensiones distintas');

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i]! * b[i]!;
        normA += a[i]! * a[i]!;
        normB += b[i]! * b[i]!;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
