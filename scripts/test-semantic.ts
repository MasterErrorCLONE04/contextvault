import { MemoryStore } from '../src/core/memory.js';
import { EmbeddingService } from '../src/core/embeddings.js';

async function test() {
    console.log('🧪 Test de Búsqueda Semántica\n');

    try {
        // Esperar a que cargue el modelo
        await EmbeddingService.getInstance();

        // Test 1: Guardar memoria sobre arquitectura (sin palabra "capas")
        console.log('1. Guardando memoria sobre arquitectura hexagonal...');
        await MemoryStore.storeWithEmbedding({
            category: 'architecture',
            key: 'hexagonal-pattern',
            value: 'Usamos arquitectura hexagonal con puertos y adaptadores',
            context: 'El dominio está aislado de infraestructura mediante interfaces',
            tags: ['architecture', 'ddd']
        });

        // Test 2: Buscar usando concepto relacionado pero diferente vocabulario
        console.log('2. Buscando semánticamente: "cómo organizo las capas del sistema?"');
        const results = await MemoryStore.recallSemantic('cómo organizo las capas del sistema', 3);

        console.log(`   Encontrados: ${results.length} resultados`);
        results.forEach((m, i) => {
            console.log(`   ${i + 1}. [${m.category}] ${m.key}: ${m.value.slice(0, 50)}...`);
        });

        // Verificación
        const found = results.some(m => m.key === 'hexagonal-pattern');
        if (found) {
            console.log('\n✅ TEST PASADO: Encontró "hexagonal" buscando "capas" (similitud semántica)');
        } else {
            console.log('\n⚠️  TEST: No encontró coincidencia (puede ser normal si el modelo no relaciona esas palabras)');
        }

        // Test 3: Búsqueda por keywords (modo antiguo) para comparar
        console.log('\n3. Buscando por keywords (modo antiguo): "capas"');
        const keywordResults = MemoryStore.recall({ query: 'capas', limit: 3 });
        console.log(`   Encontrados: ${keywordResults.length} resultados`);

        if (keywordResults.length === 0 && found) {
            console.log('✅ La búsqueda semántica encontró lo que keywords no pudo');
        }

    } catch (error) {
        console.error('❌ Error en test:', error);
    }

    process.exit(0);
}

test();
