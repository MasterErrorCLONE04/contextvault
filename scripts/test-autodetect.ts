import { AutoDetector } from '../src/core/autodetect.js';

const testCases = [
    {
        name: "Arquitectura Hexagonal",
        text: "Let's use Hexagonal Architecture for this project. It will help us isolate the domain logic from infrastructure.",
        expected: 'architecture'
    },
    {
        name: "Decisión de estilo",
        text: "We decided to use tabs instead of spaces for indentation. It's more accessible for blind developers.",
        expected: 'style'
    },
    {
        name: "Dependencia",
        text: "I think we should install Zod for schema validation. It's lightweight and works great with TypeScript.",
        expected: 'dependency'
    },
    {
        name: "Patrón de diseño",
        text: "Going with the Repository Pattern for data access. We don't want Active Record polluting our domain model.",
        expected: 'architecture'
    },
    {
        name: "Convención Naming",
        text: "Let's agree on naming conventions: PascalCase for components, camelCase for functions.",
        expected: 'style'
    },
    {
        name: "Sin decisión importante",
        text: "Can you explain what this function does? I'm not sure I understand the logic here.",
        expected: null
    }
];

console.log('🧪 Test de Auto-Detección\n');

let passed = 0;
let failed = 0;

for (const test of testCases) {
    console.log(`\n📌 Test: ${test.name}`);
    console.log(`Texto: "${test.text.slice(0, 60)}..."`);

    const suggestions = AutoDetector.detect(test.text);

    if (test.expected === null) {
        if (suggestions.length === 0) {
            console.log('✅ PASSED: Correctamente no detectó nada');
            passed++;
        } else {
            console.log('❌ FAILED: Detectó algo cuando no debería');
            failed++;
        }
    } else {
        const found = suggestions.find(s => s.category === test.expected);
        if (found) {
            console.log(`✅ PASSED: Detectó categoría '${test.expected}'`);
            console.log(`   Key: ${found.suggestedKey}`);
            console.log(`   Confianza: ${Math.round(found.confidence * 100)}%`);
            passed++;
        } else {
            console.log(`❌ FAILED: No detectó categoría '${test.expected}'`);
            console.log(`   Detectado: ${suggestions.map(s => s.category).join(', ') || 'nada'}`);
            failed++;
        }
    }
}

console.log(`\n\n📊 Resultados: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
