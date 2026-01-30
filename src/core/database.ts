import Database from 'better-sqlite3';
import { CONFIG, ensureDir } from '../config.js';

ensureDir();

// Exportar con tipo explícito para evitar error de "cannot be named"
export const db: Database.Database = new Database(CONFIG.dbPath);

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS project_memory (
    id TEXT PRIMARY KEY,
    category TEXT CHECK(category IN ('architecture', 'style', 'convention', 'decision', 'dependency')),
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    context TEXT,
    file_path TEXT,
    tags TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(key, file_path)
  );

  CREATE TABLE IF NOT EXISTS session_memory (
    id TEXT PRIMARY KEY,
    session_name TEXT NOT NULL,
    summary TEXT NOT NULL,
    active_files TEXT DEFAULT '[]',
    pending_tasks TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_memory_key ON project_memory(key);
  CREATE INDEX IF NOT EXISTS idx_memory_category ON project_memory(category);
  CREATE INDEX IF NOT EXISTS idx_memory_updated ON project_memory(updated_at);
`);

// Migración: Agregar columna embedding si no existe
const tableInfo = db.prepare("PRAGMA table_info(project_memory)").all() as any[];
const hasEmbedding = tableInfo.some(col => col.name === 'embedding');

if (!hasEmbedding) {
  console.error('🔄 Migrando base de datos para soportar embeddings...');
  try {
    db.exec('ALTER TABLE project_memory ADD COLUMN embedding BLOB');
    console.error('✅ Columna embedding agregada');
  } catch (e) {
    console.error('⚠️  Error en migración (posiblemente ya existe):', e);
  }
}