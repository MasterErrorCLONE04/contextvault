import { db } from './database.js';

export interface SessionMemory {
  id: string;
  sessionName: string;
  summary: string;
  activeFiles: string[];
  pendingTasks: string[];
  createdAt: string;
}

export class SessionStore {
  static save(name: string, summary: string, files: string[], tasks: string[]): string {
    const id = `session:${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO session_memory (id, session_name, summary, active_files, pending_tasks)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, name, summary, JSON.stringify(files), JSON.stringify(tasks));
    return id;
  }

  static getRecent(limit: number = 5): SessionMemory[] {
    const rows = db.prepare('SELECT * FROM session_memory ORDER BY created_at DESC LIMIT ?')
                   .all(limit) as any[];
    return rows.map((r: any) => ({
      id: r.id,
      sessionName: r.session_name,
      summary: r.summary,
      activeFiles: JSON.parse(r.active_files),
      pendingTasks: JSON.parse(r.pending_tasks),
      createdAt: r.created_at
    }));
  }
}