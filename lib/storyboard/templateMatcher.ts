import { DEFAULT_PROMPT_TEMPLATES } from './defaultPromptTemplates';
import { TEMPLATE_ANNOTATIONS } from './templateAnnotations';

export interface TemplateCandidate {
  name: string;
  prompt: string;
  score: number;
  matchReason: string;
  priority: number;
  matchCount: number;
}

export function findBestTemplates(
  description: string,
  type: 'character' | 'environment' | 'prop',
  topN = 3
): TemplateCandidate[] {
  const descLower = description.toLowerCase();
  const typeTemplates = DEFAULT_PROMPT_TEMPLATES.filter(t => t.type === type);

  const scored = typeTemplates
    .map(t => {
      const annotation = TEMPLATE_ANNOTATIONS[t.name];
      if (!annotation) {
        return {
          name: t.name,
          prompt: t.prompt,
          score: 0,
          matchReason: 'No annotation',
          priority: 0,
          matchCount: 0,
        };
      }
      const keywordMatches = annotation.matchKeywords.filter(k =>
        descLower.includes(k.toLowerCase())
      );
      const score = keywordMatches.length * 10 + annotation.priority;
      const matchReason =
        keywordMatches.length > 0
          ? `Matched: ${keywordMatches.slice(0, 3).join(', ')}`
          : annotation.matchDescription;
      return {
        name: t.name,
        prompt: t.prompt,
        score,
        matchReason,
        priority: annotation.priority,
        matchCount: keywordMatches.length,
      };
    })
    .sort((a, b) => b.score - a.score);

  const topResults = scored.slice(0, topN);

  // Always ensure a broad fallback template (priority <= 2) is accessible
  const hasFallback = topResults.some(r => r.priority <= 2);
  if (!hasFallback) {
    const fallback = scored.find(r => r.priority <= 2);
    if (fallback) topResults[topResults.length - 1] = fallback;
  }

  return topResults;
}

/**
 * Returns a single best-match template. Use this when you only need one result
 * (e.g. auto-fill without presenting options to the user).
 */
export function findTopTemplate(
  description: string,
  type: 'character' | 'environment' | 'prop'
): TemplateCandidate | null {
  const results = findBestTemplates(description, type, 1);
  return results[0] ?? null;
}
