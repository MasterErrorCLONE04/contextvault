#!/usr/bin/env node
import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { CONFIG, ensureDir } from '../src/config.js';

console.log('🧠 ContextVault - Inicialización de Base de Datos\n');

// Asegurar directorio
ensureDir();
console.log(`📁 Directorio: ${path.dirname(CONFIG.dbPath)}`);

// Verificar si ya existe
const dbExists = fs.existsSync(CONFIG.dbPath);
if (dbExists) {
  console.log(`⚠️  La base de datos ya existe en: ${CONFIG.dbPath}`);
  console.log('   Use este script solo para crear una nueva instancia.\n');
  process.exit(0);
}

// Crear conexión
const db = new Database(CONFIG.dbPath);
console.log(`💾 Base de datos creada: ${CONFIG.dbPath}\n`);

// Crear tablas
console.log('🛠️  Creando tablas...');

db.exec(`
  -- Tabla principal de memoria del proyecto
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

  -- Tabla de sesiones guardadas
  CREATE TABLE IF NOT EXISTS session_memory (
    id TEXT PRIMARY KEY,
    session_name TEXT NOT NULL,
    summary TEXT NOT NULL,
    active_files TEXT DEFAULT '[]',
    pending_tasks TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Índices para búsquedas rápidas
  CREATE INDEX IF NOT EXISTS idx_memory_key ON project_memory(key);
  CREATE INDEX IF NOT EXISTS idx_memory_category ON project_memory(category);
  CREATE INDEX IF NOT EXISTS idx_memory_updated ON project_memory(updated_at);
  CREATE INDEX IF NOT EXISTS idx_session_created ON session_memory(created_at);
`);

console.log('   ✅ project_memory');
console.log('   ✅ session_memory');
console.log('   ✅ Índices creados\n');

// Insertar datos de ejemplo opcionales
const seedData = process.argv.includes('--seed');
if (seedData) {
  console.log('🌱 Insertando datos de ejemplo...');
  
  const insert = db.prepare(`
    INSERT INTO project_memory (id, category, key, value, context, tags) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const examples = [
    ['architecture:example', 'architecture', 'layered-architecture', 
     'Usamos arquitectura en capas: Presentation -> Application -> Domain -> Infrastructure', 
     'Mantiene separación de concerns y facilita testing', '["architecture", "patterns"]'],
    
    ['style:example', 'style', 'naming-conventions', 
     'PascalCase para clases/interfaces, camelCase para funciones/variables, SCREAMING_SNAKE para constantes', 
     'Mantiene consistencia con el ecosistema TypeScript', '["style", "naming"]'],
    
    ['convention:example', 'convention', 'error-handling', 
     'Usamos Result<T,E> en lugar de try-catch para operaciones de negocio', 
     'Facilita el manejo explícito de errores y composición funcional', '["error-handling", "functional"]']
  ];
  
  examples.forEach(row => insert.run(...row));
  console.log('   ✅ 3 ejemplos insertados\n');
}

// Estadísticas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(`📊 Tablas en la base de datos: ${tables.length}`);
tables.forEach((t: any) => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get() as any;
  console.log(`   • ${t.name}: ${count.count} registros`);
});

console.log('\n✨ Inicialización completada!');
console.log(`\n💡 Uso rápido:`);
console.log(`   1. Configura ContextVault en tu IDE (Cursor/Claude)`);
console.log(`   2. Inicia una conversación y di: "Recuerda que usamos arquitectura hexagonal"`);
console.log(`   3. La próxima sesión, el AI recordará automáticamente el contexto\n`);

db.close();