import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export const CONFIG = {
  // Ruta donde se guarda la base de datos SQLite
  dbPath: path.join(os.homedir(), '.contextvault', 'memory.db'),
  
  // Versión del servidor
  version: '1.0.0',
  
  // Nombre del servidor MCP
  serverName: 'contextvault'
} as const;

// Función para crear el directorio si no existe
export function ensureDir(): void {
  const dir = path.dirname(CONFIG.dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}