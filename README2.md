# ContextVault: El Cerebro Secundario para Agentes de IA

**ContextVault** es un servidor MCP (Model Context Protocol) diseñado para dotar a los asistentes de programación (Cursor, Claude Desktop, Windsurf) de una memoria persistente, semántica y proactiva.

A diferencia del contexto efímero de una sesión de chat, ContextVault guarda decisiones, arquitectura y convenciones en una base de datos local, permitiendo que el conocimiento del proyecto sobreviva y evolucione.

---

## 🚀 Capacidades Principales

### 1. Memoria Persistente Universal
Almacena conocimiento crítico estructurado en categorías (arquitectura, estilo, decisiones).
- **Backend**: SQLite local (`~/.contextvault/memory.db`). Privado y sin dependencias de nube.
- **Herramienta**: `memory_store`
- **Uso**: "Guarda que usaremos Arquitectura Hexagonal en este proyecto".

### 2. Búsqueda Híbrida (Semántica + Keywords)
Recupera información no solo por palabras clave exactas, sino por *significado*.
- **Tecnología**: Embeddings locales (`@xenova/transformers` con modelo `all-MiniLM-L6-v2`) + Vector Search.
- **Cómo funciona**:
    - Si buscas "cómo organizo las capas?", el sistema entiende que te refieres a "Arquitectura Hexagonal" aunque no uses esas palabras exactas.
    - **Fallback Inteligente**: Si la búsqueda semántica no da resultados claros, recurre automáticamente a keywords tradicionales.
- **Herramienta**: `memory_recall`

### 3. Auto-Detección Proactiva
El servidor "escucha" la conversación y detecta cuando tomas decisiones importantes *antes* de que le pidas guardarlas.
- **Motor**: Heurísticas Regex avanzadas (Scoring System).
- **Categorías Detectadas**:
    - 🏗️ **Arquitectura**: "Vamos a usar patrón Factory..."
    - 🎨 **Estilo**: "Prefiero tabs en lugar de espacios..."
    - 📦 **Dependencias**: "Instalemos Zod para validación..."
    - 🤝 **Decisiones**: "Acordamos no usar `any` en TypeScript..."
- **Herramienta**: `context_autodetect` (Invocada automáticamente o manualmente).

### 4. Integración con Git (Pre-commit Hook)
Protege el contexto del proyecto desde tu terminal.
- **Funcionalidad**: Un hook de git analiza tus cambios en `staged` (lo que vas a commitear).
- **Aviso**: Si detecta que has introducido una nueva librería o cambiado un patrón clave sin documentarlo en ContextVault, te sugiere guardarlo.
- **Instalación**: `npx contextvault install-hooks`

### 5. Reconstrucción de Contexto (Context Warm-up)
Elimina el tiempo de "calentamiento" al iniciar una nueva sesión.
- **Flujo**: Al abrir un nuevo chat, el agente invoca esta herramienta.
- **Resultado**: Recibe un resumen comprimido de:
    - Stack tecnológico.
    - Convenciones de código activas.
    - Decisiones recientes.
- **Herramienta**: `context_rebuild`

---

## 🛠️ Herramientas MCP Disponibles

| Herramienta | Descripción |
| :--- | :--- |
| **`memory_store`** | Guarda un conocimiento explícito (categoría, clave, valor). Genera embeddings automáticamente. |
| **`memory_recall`** | Busca en la memoria. Soporta modo semántico (`semantic: true`) o exacto. |
| **`context_autodetect`** | Analiza texto libre y devuelve sugerencias estructuradas de qué guardar. |
| **`context_rebuild`** | Genera un prompt de sistema dinámico con todo el contexto vital del proyecto. |
| **`session_save`** | Guarda el estado de trabajo actual (archivos abiertos, tareas pendientes) para continuar luego. |

---

## 💻 Guía de Uso

### Instalación y Setup
```bash
# 1. Instalar dependencias y construir
npm install
npm run build

# 2. Inicializar base de datos
npm run init

# 3. (Opcional) Instalar Hook de Git
npx contextvault install-hooks
```

### Flujo de Trabajo Típico

**Escenario: Empezando una nueva feature**

1.  **Inicio de Chat**: El agente llama a `context_rebuild` y sabe de inmediato:
    > "Veo que usáis Tailwind y TypeScript estricto. Procedo con la implementación..."
2.  **Desarrollo**: Tú dices "Para el estado global usaremos Zustand".
    - El agente (o tú) llama a `context_autodetect`.
    - ContextVault sugiere: `[DEPENDENCY] Zustand`.
    - Se confirma y se guarda con `memory_store`.
3.  **Commit**: Vas a la terminal.
    ```bash
    git add .
    git commit -m "feat: add auth store"
    ```
    - El hook analiza el código. Si ve algo nuevo no registrado, te avisa:
    > "💡 ContextVault detected potential memories: [STYLE] CamelCase conventions..."

### Comandos de Mantenimiento
- **Verificar Búsqueda Semántica**: `npm run test:semantic`
- **Verificar Auto-Detección**: `npm run test:autodetect`

---

## 🧠 Arquitectura Interna

- **Core**: Node.js + TypeScript.
- **Persistencia**: `better-sqlite3` (Síncrono, robusto, archivo único).
- **Vectores**: Almacenados como BLOBs en SQLite. Cálculo de similitud coseno en memoria (rápido para <10k memorias).
- **Interfaz**: MCP (Model Context Protocol) via Stdio.

---

## 📂 Estructura del Proyecto

```
contextvault/
├── dist/                   # Código compilado (JS)
├── scripts/
│   ├── init-db.ts          # Script de inicialización de DB
│   ├── test-autodetect.ts  # Test de heurísticas de auto-detección
│   └── test-semantic.ts    # Test de búsqueda vectorial
├── src/
│   ├── core/
│   │   ├── autodetect.ts   # Motor de regex/heurísticas
│   │   ├── database.ts     # Conexión SQLite + Migraciones
│   │   ├── embeddings.ts   # Servicio Transformer.js
│   │   ├── memory.ts       # Lógica CRUD y búsqueda de memorias
│   │   └── sessions.ts     # Gestión de sesiones
│   ├── tools/
│   │   ├── definitions.ts  # Schemas JSON de herramientas MCP
│   │   └── handlers.ts     # Implementación de las herramientas
│   ├── cli.ts              # Entry point (Server + Hooks)
│   ├── config.ts           # Configuración global
│   └── server.ts           # Clase del servidor MCP
├── package.json
└── tsconfig.json
```
