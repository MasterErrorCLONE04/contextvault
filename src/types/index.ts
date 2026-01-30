export type MemoryCategory = 'architecture' | 'style' | 'convention' | 'decision' | 'dependency';

export interface ProjectMemory {
  id: string;
  category: MemoryCategory;
  key: string;
  value: string;
  context?: string;
  filePath?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionMemory {
  id: string;
  sessionName: string;
  summary: string;
  activeFiles: string[];
  pendingTasks: string[];
  createdAt: string;
}

export interface StoreMemoryArgs {
  category: MemoryCategory;
  key: string;
  value: string;
  context?: string;
  filePath?: string;
  tags?: string[];
}

export interface RecallMemoryArgs {
  query: string;
  category?: MemoryCategory;
  limit?: number;
}