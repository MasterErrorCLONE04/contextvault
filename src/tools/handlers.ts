import { MemoryStore } from '../core/memory.js';
import { AutoDetector } from '../core/autodetect.js';
import { SessionStore } from '../core/sessions.js';
import type { ProjectMemory } from '../types/index.js';

export const toolHandlers = {
  memory_store: async (args: any) => {
    // Ahora usa storeWithEmbedding para generar vector automáticamente
    const memory = await MemoryStore.storeWithEmbedding(args);
    return {
      content: [{
        type: "text",
        text: `✅ Guardado: [${memory.category}] ${memory.key}`
      }]
    };
  },

  memory_recall: async (args: any) => {
    let memories: ProjectMemory[];

    if (args.semantic !== false) {
      // Por defecto usa búsqueda semántica (mejor calidad)
      memories = await MemoryStore.recallSemantic(
        args.query,
        args.limit || 5,
        args.category
      );
    } else {
      // Fallback a keywords (más rápido)
      memories = MemoryStore.recall(args);
    }

    if (memories.length === 0) {
      return {
        content: [{ type: "text", text: "🔍 No se encontró memoria relacionada." }]
      };
    }

    const text = memories.map(m => formatMemory(m)).join('\n\n');
    return { content: [{ type: "text", text }] };
  },

  context_rebuild: async (args: any) => {
    const sections: string[] = ['## 🧠 Contexto del Proyecto\n'];

    // Arquitectura
    const arch = MemoryStore.getByCategory('architecture');
    if (arch.length) {
      sections.push('### 🏗️ Arquitectura\n' + arch.map(m => `- **${m.key}**: ${m.value}${m.context ? `\n  - *Por qué: ${m.context}*` : ''}`).join('\n'));
    }

    // Convenciones
    const conv = MemoryStore.getByCategory('convention');
    if (conv.length) {
      sections.push('### 📝 Convenciones\n' + conv.map(m => `- ${m.value}`).join('\n'));
    }

    // Estilo
    const style = MemoryStore.getByCategory('style');
    if (style.length) {
      sections.push('### 🎨 Estilo de Código\n' + style.map(m => `- ${m.value}`).join('\n'));
    }

    // Reciente (si no hay focus area)
    const recent = MemoryStore.getRecent(3);
    if (recent.length && !args?.focusArea) {
      sections.push('### 🔄 Reciente\n' + recent.map(m => `- [${m.category}] ${m.key}`).join('\n'));
    }

    // Focus específico (búsqueda semántica)
    if (args?.focusArea) {
      const specific = await MemoryStore.recallSemantic(args.focusArea, 3);
      if (specific.length) {
        sections.push(`### 🎯 ${args.focusArea}\n` + specific.map(m => `- ${m.key}: ${m.value}`).join('\n'));
      }
    }

    return {
      content: [{ type: "text", text: sections.join('\n\n') }]
    };
  },

  session_save: (args: any) => {
    const id = SessionStore.save(
      args.sessionName,
      args.summary,
      args.activeFiles || [],
      args.pendingTasks || []
    );
    return {
      content: [{ type: "text", text: `💾 Sesión guardada: ${args.sessionName} (ID: ${id})` }]
    };
  },

  context_autodetect: async (args: any) => {
    const suggestions = AutoDetector.detect(args.content, args.source || 'user');

    if (suggestions.length === 0) {
      return {
        content: [{
          type: "text",
          text: "🔍 No se detectaron decisiones importantes en el texto proporcionado."
        }]
      };
    }

    let text = "## 💡 Sugerencias de Memoria Detectadas\n\n";
    suggestions.forEach((s, i) => {
      text += `${i + 1}. **[${s.category.toUpperCase()}]** (confianza: ${Math.round(s.confidence * 100)}%)\n`;
      text += `   - Key sugerida: \`${s.suggestedKey}\`\n`;
      text += `   - Valor: "${s.suggestedValue}"\n`;
      text += `   - Razón: ${s.reason}\n`;
      text += `   - Texto original: "${s.originalText.slice(0, 80)}..."\n\n`;
    });

    text += "**¿Deseas guardar alguna de estas sugerencias?** Usa `memory_store` con los valores sugeridos.";

    return {
      content: [{ type: "text", text }]
    };
  }
};

function formatMemory(m: ProjectMemory): string {
  let text = `📌 [${m.category}] ${m.key}\n${m.value}`;
  if (m.context) text += `\n💭 ${m.context}`;
  if (m.filePath) text += `\n📁 ${m.filePath}`;
  if (m.tags.length) text += `\n🏷️ ${m.tags.join(', ')}`;
  return text;
}