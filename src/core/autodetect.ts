import type { MemoryCategory } from '../types/index.js';

export interface SuggestedMemory {
    category: MemoryCategory;
    suggestedKey: string;
    suggestedValue: string;
    confidence: number; // 0-1
    reason: string;
    originalText: string;
}

export class AutoDetector {
    // Patrones por categoría
    private static patterns = {
        architecture: {
            keywords: [
                'architecture', 'pattern', 'layer', 'structure', 'hexagonal', 'onion',
                'clean', 'mvc', 'mvvm', 'microservice', 'monolith', 'domain', 'ddd',
                'repository', 'service', 'controller', 'component', 'module', 'system design',
                'data flow', 'state management', 'redux', 'zustand', 'context api'
            ],
            weight: 0.9
        },
        style: {
            keywords: [
                'style', 'lint', 'convention', 'naming', 'format', 'camelcase', 'pascalcase',
                'snakecase', 'kebabcase', 'tab', 'space', 'indent', 'semicolon', 'quotes',
                'single quote', 'double quote', 'trailing comma', 'prettier', 'eslint',
                'strict mode', 'typescript strict', 'any', 'interface', 'type'
            ],
            weight: 0.85
        },
        decision: {
            keywords: [
                'agree', 'decided', 'decide', 'choose', 'chosen', 'will use', 'going to use',
                'let\'s use', 'we should', 'we must', 'important', 'critical', 'rule',
                'never', 'always', 'avoid', 'prefer', 'instead of', 'rather than',
                'going with', 'settled on', 'opted for', 'concluded'
            ],
            weight: 0.8
        },
        dependency: {
            keywords: [
                'install', 'dependency', 'package', 'library', 'npm', 'pip', 'cargo', 'gem',
                'nuget', 'composer', 'import', 'require', 'using', 'add', 'yarn', 'pnpm',
                'version', 'lockfile', 'node_modules'
            ],
            weight: 0.75
        },
        convention: {
            keywords: [
                'convention', 'standard', 'practice', 'workflow', 'process', 'guideline',
                'policy', 'procedure', 'habit', 'custom', 'usual', 'typically'
            ],
            weight: 0.7
        }
    };

    /**
     * Analiza texto y detecta posibles memorias importantes
     */
    static detect(text: string, source: 'user' | 'assistant' = 'user'): SuggestedMemory[] {
        const suggestions: SuggestedMemory[] = [];
        const normalizedText = text.toLowerCase();

        // Dividir en oraciones para análisis granular
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (trimmed.length < 10) continue; // Ignorar muy cortas

            // Detectar cada categoría
            for (const [category, config] of Object.entries(this.patterns)) {
                if (category === 'convention') continue; // Evaluar al final como fallback

                const match = this.checkPattern(trimmed, normalizedText, category as MemoryCategory, config);
                if (match && match.confidence > 0.5) {
                    suggestions.push(match);
                }
            }
        }

        // Filtrar duplicados y ordenar por confianza
        const unique = this.deduplicate(suggestions);
        return unique.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
    }

    private static checkPattern(
        sentence: string,
        normalized: string,
        category: MemoryCategory,
        config: { keywords: string[], weight: number }
    ): SuggestedMemory | null {
        let matches = 0;
        let matchedKeywords: string[] = [];

        for (const keyword of config.keywords) {
            if (normalized.includes(keyword.toLowerCase())) {
                matches++;
                matchedKeywords.push(keyword);
            }
        }

        if (matches === 0) return null;

        // Calcular confianza basada en matches y contexto
        let confidence = Math.min(matches * 0.4, config.weight);

        // Boost si es una oración imperativa o declarativa fuerte
        if (this.isStrongStatement(sentence)) {
            confidence += 0.15;
        }

        // Boost si menciona acuerdo/decisión explícita
        if (category === 'decision' || normalized.match(/(agree|decided|let's|we will)/)) {
            confidence += 0.1;
        }

        confidence = Math.min(confidence, 1.0);

        // Generar key y value sugeridos
        const { key, value } = this.generateSuggestion(sentence, category, matchedKeywords);

        return {
            category,
            suggestedKey: key,
            suggestedValue: value,
            confidence: Math.round(confidence * 100) / 100,
            reason: `Detected keywords: ${matchedKeywords.join(', ')}`,
            originalText: sentence.trim()
        };
    }

    private static isStrongStatement(sentence: string): boolean {
        const strongPatterns = [
            /(?:^|\s)we (will|must|should|are going to)/i,
            /^let's /i,
            /^(never|always|must|should) /i,
            /decided$/i,
            /agreed$/i,
            /Going with/i
        ];

        return strongPatterns.some(pattern => pattern.test(sentence));
    }

    private static generateSuggestion(
        sentence: string,
        category: string,
        keywords: string[]
    ): { key: string, value: string } {
        // Limpiar la oración para usar como value
        let value = sentence
            .replace(/^(we|let's|I think|maybe|probably)\s+/i, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Capitalizar primera letra
        value = value.charAt(0).toUpperCase() + value.slice(1);

        // Generar key basada en categoría y contenido
        let key = '';
        const lowerValue = value.toLowerCase();

        switch (category) {
            case 'architecture':
                if (lowerValue.includes('hexagonal')) key = 'hexagonal-architecture';
                else if (lowerValue.includes('mvc')) key = 'mvc-pattern';
                else if (lowerValue.includes('microservice')) key = 'microservices';
                else if (lowerValue.includes('clean')) key = 'clean-architecture';
                else if (lowerValue.includes('domain')) key = 'domain-driven-design';
                else key = `arch-${this.slugify(keywords[0] || 'pattern')}`;
                break;

            case 'style':
                if (lowerValue.includes('camelcase')) key = 'naming-camelcase';
                else if (lowerValue.includes('pascalcase')) key = 'naming-pascalcase';
                else if (lowerValue.includes('tab')) key = 'indentation-tabs';
                else if (lowerValue.includes('space')) key = 'indentation-spaces';
                else if (lowerValue.includes('semicolon')) key = 'style-semicolons';
                else if (lowerValue.includes('strict')) key = 'typescript-strict';
                else key = `style-${this.slugify(keywords[0] || 'convention')}`;
                break;

            case 'decision':
                // Extraer sustantivo clave
                const nounMatch = value.match(/(?:use|using|choose|chose)\s+(\w+)/i);
                if (nounMatch) {
                    key = `decision-${nounMatch[1]!.toLowerCase()}`;
                } else {
                    key = `decision-${this.slugify(value.slice(0, 20))}`;
                }
                break;

            case 'dependency':
                const pkgMatch = value.match(/(?:install|add|use)\s+(@?[\w-]+)/i);
                if (pkgMatch) {
                    key = `dep-${pkgMatch[1]!.replace('@', '')}`;
                } else {
                    key = `dependency-choice`;
                }
                break;

            default:
                key = `memory-${Date.now()}`;
        }

        return { key, value };
    }

    private static slugify(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 30);
    }

    private static deduplicate(suggestions: SuggestedMemory[]): SuggestedMemory[] {
        const seen = new Set<string>();
        return suggestions.filter(s => {
            const key = `${s.category}:${s.suggestedKey}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}
