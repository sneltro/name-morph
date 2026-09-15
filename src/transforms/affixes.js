/**
 * Affixes transformation module
 * Handles prefixes and suffixes with clean categorizations.
 * Prefixes and suffixes can be toggled and configured completely independently.
 */

export const PREFIX_SETS = {
  tech: [
    'get', 'my', 'open', 'hyper', 'meta', 'next', 'cloud', 'sync',
    'smart', 'pure', 'omni', 'cyber', 'nano', 'true', 'ultra', 'one',
    'zero', 'neo', 'prime', 'core', 'auto', 'go'
  ],
  gaming: [
    'pro', 'lord', 'captain', 'dr', 'mr', 'master', 'agent', 'epic',
    'shadow', 'pixel', 'turbo', 'mega', 'ultra', 'king', 'sir', 'chief'
  ],
  social: [
    'the', 'real', 'its', 'iam', 'official', 'hey', 'meet', 'just',
    'that', 'callme', 'yo', 'thisis'
  ]
};

export const SUFFIX_SETS = {
  startup: [
    'ify', 'ly', 'io', 'hq', 'app', 'lab', 'labs', 'box', 'hub',
    'base', 'flow', 'forge', 'craft', 'wave', 'nest', 'ai', 'stack',
    'zone', 'link', 'pulse', 'grid', 'byte', 'space', 'works', 'tech'
  ],
  gaming: [
    'gg', 'tv', 'live', 'plays', 'gaming', 'verse', 'zone', 'vibe',
    'strike', 'clover', 'edge', 'mode', 'bot', 'glitch'
  ],
  social: [
    'dev', 'design', 'official', 'real', 'media', 'studio', 'club',
    'team', 'world', 'network', 'co', 'crew'
  ]
};

/**
 * Generate prefix variations.
 * @param {string} rawWord 
 * @param {Object} options - { tech: boolean, gaming: boolean, social: boolean, delimiters: boolean }
 * @returns {Array<{ text: string, rule: string, tags: string[] }>}
 */
export function generatePrefixVariations(rawWord, options = { tech: true, gaming: true, social: true, delimiters: false }) {
  const word = rawWord.toLowerCase();
  const results = [];
  const seen = new Set([word]);

  const add = (text, category) => {
    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      results.push({
        text,
        rule: 'Prefix',
        tags: ['Prefix', category]
      });
    }
  };

  const activeCategories = [];
  if (options.tech !== false) activeCategories.push({ cat: 'Tech', list: PREFIX_SETS.tech });
  if (options.gaming !== false) activeCategories.push({ cat: 'Gaming', list: PREFIX_SETS.gaming });
  if (options.social !== false) activeCategories.push({ cat: 'Social', list: PREFIX_SETS.social });

  for (const { cat, list } of activeCategories) {
    for (const prefix of list) {
      // 1. Direct concatenation (e.g. getecho)
      add(`${prefix}${word}`, cat);

      // 2. Capitalized / CamelCase style (e.g. getEcho, GetEcho)
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
      add(`${prefix}${capitalized}`, cat);

      // 3. Delimited variants if enabled
      if (options.delimiters) {
        add(`${prefix}_${word}`, `${cat} Delimited`);
        add(`${prefix}.${word}`, `${cat} Delimited`);
        add(`${prefix}-${word}`, `${cat} Delimited`);
      }
    }
  }

  return results;
}

/**
 * Generate suffix variations.
 * @param {string} rawWord 
 * @param {Object} options - { startup: boolean, gaming: boolean, social: boolean, delimiters: boolean }
 * @returns {Array<{ text: string, rule: string, tags: string[] }>}
 */
export function generateSuffixVariations(rawWord, options = { startup: true, gaming: true, social: true, delimiters: false }) {
  const word = rawWord.toLowerCase();
  const results = [];
  const seen = new Set([word]);

  const add = (text, category) => {
    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      results.push({
        text,
        rule: 'Suffix',
        tags: ['Suffix', category]
      });
    }
  };

  const activeCategories = [];
  if (options.startup !== false) activeCategories.push({ cat: 'Startup', list: SUFFIX_SETS.startup });
  if (options.gaming !== false) activeCategories.push({ cat: 'Gaming', list: SUFFIX_SETS.gaming });
  if (options.social !== false) activeCategories.push({ cat: 'Social', list: SUFFIX_SETS.social });

  for (const { cat, list } of activeCategories) {
    for (const suffix of list) {
      // Handle vowels at join boundary (e.g., echo + ify -> echify or echoify)
      if (word.endsWith('e') && suffix.startsWith('i')) {
        add(`${word.slice(0, -1)}${suffix}`, cat);
      } else if (word.endsWith('o') && suffix === 'ify') {
        add(`${word.slice(0, -1)}ify`, cat);
      }
      
      // Standard join (e.g. echoly, echohq)
      add(`${word}${suffix}`, cat);

      // Suffix with capitalized first letter
      const capSuffix = suffix.charAt(0).toUpperCase() + suffix.slice(1);
      add(`${word}${capSuffix}`, cat);

      // Delimited variants if enabled
      if (options.delimiters) {
        add(`${word}_${suffix}`, `${cat} Delimited`);
        add(`${word}.${suffix}`, `${cat} Delimited`);
        add(`${word}-${suffix}`, `${cat} Delimited`);
      }
    }
  }

  return results;
}
