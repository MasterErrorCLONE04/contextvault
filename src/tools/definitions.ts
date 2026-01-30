export const toolDefinitions = [
  {
    name: "memory_store",
    description: "Guarda una decisión arquitectónica, convención de estilo, o conocimiento importante del proyecto. Úsalo cuando el usuario confirme un patrón o tome una decisión clave que deba recordarse en futuras sesiones.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["architecture", "style", "convention", "decision", "dependency"],
          description: "Tipo de conocimiento: architecture (patrones), style (estilo código), convention (reglas), decision (decisiones tomadas), dependency (libs importantes)"
        },
        key: {
          type: "string",
          description: "Identificador único, ej: 'auth-strategy', 'react-patterns'"
        },
        value: {
          type: "string",
          description: "El contenido a recordar, ej: 'Usamos JWT con refresh tokens rotativos'"
        },
        context: {
          type: "string",
          description: "Por qué se tomó esta decisión o contexto adicional"
        },
        filePath: {
          type: "string",
          description: "Archivo relacionado (opcional)"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags para búsqueda, ej: ['auth', 'security']"
        }
      },
      required: ["category", "key", "value"]
    }
  },
  {
    name: "memory_recall",
    description: "Recupera memoria almacenada. Usa semantic=true para búsqueda por significado (encuentra 'authentication' si buscas 'login'), o semantic=false para búsqueda exacta rápida.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Término de búsqueda (busca en key, value y context)"
        },
        category: {
          type: "string",
          enum: ["architecture", "style", "convention", "decision", "dependency"],
          description: "Filtrar por categoría específica (opcional)"
        },
        semantic: {
          type: "boolean",
          default: true,
          description: "true=búsqueda semántica (precisa, lenta), false=keywords (rápida)"
        },
        limit: {
          type: "number",
          default: 10,
          description: "Máximo de resultados"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "context_rebuild",
    description: "Genera un resumen estructurado completo del proyecto para 'calentar' rápidamente al agente. Úsalo obligatoriamente cuando inicies una NUEVA conversación o chat.",
    inputSchema: {
      type: "object",
      properties: {
        focusArea: {
          type: "string",
          description: "Área específica de foco (ej: 'authentication', 'database')"
        }
      }
    }
  },
  {
    name: "session_save",
    description: "Guarda el estado actual de una sesión de trabajo para continuar después sin perder contexto.",
    inputSchema: {
      type: "object",
      properties: {
        sessionName: { type: "string", description: "Nombre descriptivo de la sesión" },
        summary: { type: "string", description: "Qué se estaba haciendo y estado actual" },
        activeFiles: {
          type: "array",
          items: { type: "string" },
          description: "Archivos abiertos/modificados relevantes"
        },
        pendingTasks: {
          type: "array",
          items: { type: "string" },
          description: "Tareas pendientes para la próxima sesión"
        }
      },
      required: ["sessionName", "summary"]
    }
  },
  {
    name: "context_autodetect",
    description: "Analiza texto reciente de la conversación para detectar decisiones arquitectónicas, convenciones de estilo, o dependencias importantes que deberían guardarse en memoria. Úsalo cuando el usuario haya expresado una preferencia o decisión clara.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Texto reciente de la conversación a analizar (últimas 5-10 líneas)"
        },
        source: {
          type: "string",
          enum: ["user", "assistant"],
          default: "user",
          description: "Quién escribió el texto"
        }
      },
      required: ["content"]
    }
  }
];