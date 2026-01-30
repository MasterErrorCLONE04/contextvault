import { db } from './database.js';
import { EmbeddingService, cosineSimilarity } from './embeddings.js';
import type { ProjectMemory, StoreMemoryArgs, RecallMemoryArgs, MemoryCategory } from '../types/index.js';

export class MemoryStore {
  static store(args: StoreMemoryArgs): ProjectMemory {
    const id = `${args.category}:${args.key}`;
    const tags = JSON.stringify(args.tags || []);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO project_memory 
      (id, category, key, value, context, file_path, tags, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(id, args.category, args.key, args.value,
      args.context || null, args.filePath || null, tags);

    return this.getById(id)!;
  }

  // Nuevo: Almacenar con embedding (async)
  static async storeWithEmbedding(args: StoreMemoryArgs): Promise<ProjectMemory> {
    // Primero guardar sin embedding
    const memory = this.store(args);

    // Generar embedding en background
    try {
      const service = await EmbeddingService.getInstance();
      const text = `${args.key} ${args.value} ${args.context || ''}`;
      const vector = await service.generateEmbedding(text);

      db.prepare('UPDATE project_memory SET embedding = ? WHERE id = ?')
        .run(EmbeddingService.vectorToBuffer(vector), memory.id);
    } catch (error) {
      console.error('Error generando embedding:', error);
    }

    return memory;
  }

  static getById(id: string): ProjectMemory | undefined {
    const row = db.prepare('SELECT * FROM project_memory WHERE id = ?').get(id) as any;
    return row ? this.rowToMemory(row) : undefined;
  }

  // Búsqueda tradicional por keywords (rápida)
  static recall(args: RecallMemoryArgs): ProjectMemory[] {
    let query = `
      SELECT * FROM project_memory 
      WHERE (key LIKE ? OR value LIKE ? OR context LIKE ?)
    `;
    const params: (string | number)[] = [`%${args.query}%`, `%${args.query}%`, `%${args.query}%`];

    if (args.category) {
      query += ' AND category = ?';
      params.push(args.category);
    }

    query += ' ORDER BY updated_at DESC LIMIT ?';
    params.push(args.limit || 10);

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => this.rowToMemory(r));
  }

  // Nuevo: Búsqueda semántica híbrida (precisa pero más lenta)
  static async recallSemantic(query: string, limit: number = 5, category?: MemoryCategory): Promise<ProjectMemory[]> {
    const service = await EmbeddingService.getInstance();
    const queryVector = await service.generateEmbedding(query);

    // ESTRATEGIA HÍBRIDA: Filtrar candidatos por keywords primero
    const keywords = query.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .join('%');

    let sql = 'SELECT * FROM project_memory WHERE (key LIKE ? OR value LIKE ?)';
    let params: any[] = [`%${keywords}%`, `%${keywords}%`];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    // Limitar a 50 candidatos para no matar la CPU
    sql += ' ORDER BY updated_at DESC LIMIT 50';

    let candidates = db.prepare(sql).all(...params) as any[];

    if (candidates.length === 0) {
      // Fallback: si no hay keywords, buscar los más recientes
      candidates = db.prepare('SELECT * FROM project_memory ORDER BY updated_at DESC LIMIT 30').all() as any[];
      if (candidates.length === 0) return [];
    }

    // Calcular similitud sobre candidatos
    const scored = await Promise.all(
      candidates.map(async (row) => {
        let vector: Float32Array;

        if (!row.embedding) {
          // Generar embedding lazy si no existe
          const text = `${row.key} ${row.value} ${row.context || ''}`;
          vector = await service.generateEmbedding(text);

          // Guardar para futuro (fire and forget)
          db.prepare('UPDATE project_memory SET embedding = ? WHERE id = ?')
            .run(EmbeddingService.vectorToBuffer(vector), row.id);
        } else {
          vector = EmbeddingService.bufferToVector(Buffer.from(row.embedding));
        }

        const similarity = cosineSimilarity(queryVector, vector);
        return { memory: this.rowToMemory(row), similarity };
      })
    );

    // Filtrar por threshold (0.3 = 30% de similitud) y ordenar
    return scored
      .filter(item => item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.memory);
  }

  static getByCategory(category: MemoryCategory): ProjectMemory[] {
    const rows = db.prepare('SELECT * FROM project_memory WHERE category = ?')
      .all(category) as any[];
    return rows.map(r => this.rowToMemory(r));
  }

  static getRecent(limit: number = 5): ProjectMemory[] {
    const rows = db.prepare('SELECT * FROM project_memory ORDER BY updated_at DESC LIMIT ?')
      .all(limit) as any[];
    return rows.map(r => this.rowToMemory(r));
  }

  private static rowToMemory(row: any): ProjectMemory {
    return {
      id: row.id,
      category: row.category,
      key: row.key,
      value: row.value,
      context: row.context,
      filePath: row.file_path,
      tags: JSON.parse(row.tags || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}