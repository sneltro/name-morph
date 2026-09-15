/**
 * NameMorph Master Transformation Engine
 * Combines active transformation modules, manages multi-pass blends,
 * strictly enforces active/inactive rules, deduplicates, and produces
 * fresh, diverse variations on every generation.
 */

import { generateLeetVariations } from './leet.js';
import { generateLetterReplacements } from './letterReplacements.js';
import { generatePrefixVariations, generateSuffixVariations, PREFIX_SETS, SUFFIX_SETS } from './affixes.js';
import { generateVowelVariations } from './vowels.js';
import { generateExtensions, generateFraming, generateCasing } from './decorations.js';

/**
 * Fisher-Yates shuffle helper
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Interleave arrays to provide balanced variety from different categories
 */
function interleave(arrays) {
  const result = [];
  let maxLen = 0;
  for (const arr of arrays) {
    if (arr.length > maxLen) maxLen = arr.length;
  }
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (i < arr.length) {
        result.push(arr[i]);
      }
    }
  }
  return result;
}

/**
 * Master generation function
 * @param {string} inputWord - The root word to mutate
 * @param {Object} config - Configuration toggles
 * @param {number} targetCount - Desired number of variations (e.g. 50)
 * @param {number} offset - For pagination / "load more"
 * @param {boolean} randomize - Whether to shuffle results for fresh variety
 * @returns {{ items: Array<{ text: string, rule: string, tags: string[] }>, totalAvailable: number }}
 */
export function generateVariations(inputWord, config, targetCount = 50, offset = 0, randomize = true) {
  const trimmed = inputWord.trim();
  if (!trimmed) {
    return { items: [], totalAvailable: 0 };
  }

  const rawLower = trimmed.toLowerCase();
  const pool = [];
  const seen = new Set([rawLower]); // Prevent original unmodified word from being a variation

  const add = (item) => {
    if (!item || !item.text) return;
    const key = item.text.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      pool.push(item);
    }
  };

  const buckets = [];

  // 1. LEET SPEAK (Strictly numbers and symbols)
  if (config.enableLeet) {
    const leetItems = generateLeetVariations(trimmed, {
      subtle: config.leetSubtle,
      full: config.leetFull,
      symbols: config.leetSymbols
    });
    buckets.push(randomize ? shuffle(leetItems) : leetItems);
  }

  // 2. LETTER REPLACEMENTS (Strictly alphabetical phonetics and typos)
  if (config.enableLetterSwaps) {
    const swapItems = generateLetterReplacements(trimmed, {
      phonetic: config.swapsPhonetic,
      typos: config.swapsTypos
    });
    buckets.push(randomize ? shuffle(swapItems) : swapItems);
  }

  // 3. PREFIXES
  if (config.enablePrefixes) {
    const prefixItems = generatePrefixVariations(trimmed, {
      tech: config.affixTech,
      gaming: config.affixGaming,
      social: config.affixSocial,
      delimiters: config.affixDelimiters
    });
    buckets.push(randomize ? shuffle(prefixItems) : prefixItems);
  }

  // 4. SUFFIXES
  if (config.enableSuffixes) {
    const suffixItems = generateSuffixVariations(trimmed, {
      startup: config.affixTech,
      gaming: config.affixGaming,
      social: config.affixSocial,
      delimiters: config.affixDelimiters
    });
    buckets.push(randomize ? shuffle(suffixItems) : suffixItems);
  }

  // 5. VOWEL MODIFICATIONS
  if (config.enableVowels) {
    const vowelItems = generateVowelVariations(trimmed, {
      drop: config.vowelsDrop,
      double: config.vowelsDouble,
      swap: config.vowelsSwap
    });
    buckets.push(randomize ? shuffle(vowelItems) : vowelItems);
  }

  // 6. EXTENSIONS (Letter repeating)
  if (config.enableExtensions) {
    const extItems = generateExtensions(trimmed);
    buckets.push(randomize ? shuffle(extItems) : extItems);
  }

  // 7. FRAMING & GAMER TAGS
  if (config.enableFraming) {
    const frameItems = generateFraming(trimmed);
    buckets.push(randomize ? shuffle(frameItems) : frameItems);
  }

  // 8. CASING
  if (config.enableCasing) {
    const casingItems = generateCasing(trimmed);
    buckets.push(randomize ? shuffle(casingItems) : casingItems);
  }

  // Add primary items interleaved
  const primaryInterleaved = interleave(buckets);
  for (const item of primaryInterleaved) {
    add(item);
  }

  // 9. MULTI-PASS COMBINATIONS (Rich blends of active categories)
  const comboItems = [];

  // Combo A: Prefix + Suffix
  if (config.enablePrefixes && config.enableSuffixes) {
    const prefixes = [
      ...(config.affixTech ? PREFIX_SETS.tech : []),
      ...(config.affixGaming ? PREFIX_SETS.gaming : []),
      ...(config.affixSocial ? PREFIX_SETS.social : [])
    ];
    const suffixes = [
      ...(config.affixTech ? SUFFIX_SETS.startup : []),
      ...(config.affixGaming ? SUFFIX_SETS.gaming : []),
      ...(config.affixSocial ? SUFFIX_SETS.social : [])
    ];

    for (const p of prefixes) {
      for (const s of suffixes) {
        comboItems.push({
          text: `${p}${rawLower}${s}`,
          rule: 'Affix Combo',
          tags: ['Prefix', 'Suffix', 'Combo']
        });
        if (config.affixDelimiters) {
          comboItems.push({
            text: `${p}_${rawLower}_${s}`,
            rule: 'Affix Combo',
            tags: ['Prefix', 'Suffix', 'Delimited']
          });
        }
      }
    }
  }

  // Combo B: Vowel Drop + Suffix
  if (config.enableVowels && config.enableSuffixes && config.vowelsDrop) {
    const vowelDropped = generateVowelVariations(trimmed, { drop: true, double: false, swap: false });
    const suffixes = [
      ...(config.affixTech ? SUFFIX_SETS.startup : []),
      ...(config.affixGaming ? SUFFIX_SETS.gaming : [])
    ];
    for (const vItem of vowelDropped) {
      for (const s of suffixes) {
        comboItems.push({
          text: `${vItem.text}${s}`,
          rule: 'Vowel Drop + Suffix',
          tags: ['Vowel Drop', 'Suffix', 'Startup']
        });
      }
    }
  }

  // Combo C: Letter Swaps + Suffixes (strictly alphabetical)
  if (config.enableLetterSwaps && config.enableSuffixes) {
    const swapped = generateLetterReplacements(trimmed, { phonetic: true, typos: false });
    const suffixes = (config.affixTech ? SUFFIX_SETS.startup : SUFFIX_SETS.social);
    for (const sItem of swapped.slice(0, 15)) {
      for (const s of suffixes) {
        comboItems.push({
          text: `${sItem.text}${s}`,
          rule: 'Letter Swap + Suffix',
          tags: ['Letter Replacement', 'Suffix']
        });
      }
    }
  }

  // Combo D: Leet Speak + Gamer Framing
  if (config.enableLeet && config.enableFraming) {
    const leets = generateLeetVariations(trimmed, { subtle: true, full: true, symbols: false });
    for (const lItem of leets.slice(0, 10)) {
      comboItems.push({
        text: `xX_${lItem.text}_Xx`,
        rule: 'Leet + Gamer Frame',
        tags: ['Leet', 'Gamer xX']
      });
      comboItems.push({
        text: `_${lItem.text}_`,
        rule: 'Leet + Underscores',
        tags: ['Leet', 'Decoration']
      });
    }
  }

  // Combo E: Leet Speak + Gaming Suffix
  if (config.enableLeet && config.enableSuffixes && config.affixGaming) {
    const leets = generateLeetVariations(trimmed, { subtle: true, full: true, symbols: false });
    for (const lItem of leets.slice(0, 10)) {
      for (const s of ['gg', 'tv', 'zone', 'live', 'dev', 'pro']) {
        comboItems.push({
          text: `${lItem.text}${s}`,
          rule: 'Leet + Suffix',
          tags: ['Leet', 'Gaming']
        });
        if (config.affixDelimiters) {
          comboItems.push({
            text: `${lItem.text}_${s}`,
            rule: 'Leet + Suffix',
            tags: ['Leet', 'Gaming Delimited']
          });
        }
      }
    }
  }

  // Append combos
  const processedCombos = randomize ? shuffle(comboItems) : comboItems;
  for (const item of processedCombos) {
    add(item);
  }

  // If randomize is true, interleave some combos into the pool for balanced diversity
  let finalPool = pool;
  if (randomize) {
    // Keep high quality variety by shuffling pool
    finalPool = shuffle(pool);
  }

  const totalAvailable = finalPool.length;
  const items = finalPool.slice(offset, offset + targetCount);

  return {
    items,
    totalAvailable
  };
}
