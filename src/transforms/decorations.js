/**
 * Decorations and Casing transformation module
 * Handles character extensions, gamer framing/brackets, and casing variations.
 */

/**
 * Generate letter extensions (repeating ending characters).
 * @param {string} rawWord 
 * @returns {Array<{ text: string, rule: string, tags: string[] }>}
 */
export function generateExtensions(rawWord) {
  const word = rawWord.toLowerCase();
  const results = [];
  const seen = new Set([word]);

  const lastChar = word.slice(-1);
  if (/[a-z]/.test(lastChar)) {
    const single = `${word}${lastChar}`;
    const double = `${word}${lastChar}${lastChar}`;
    
    seen.add(single);
    results.push({ text: single, rule: 'Extension', tags: ['Extension', 'Double End'] });
    
    seen.add(double);
    results.push({ text: double, rule: 'Extension', tags: ['Extension', 'Triple End'] });
  }

  // Also double penultimate consonant if word ends with vowel (e.g. 'echo' -> 'echho')
  if (word.length >= 3) {
    const pen = word[word.length - 2];
    if (/[bcdfghjklmnpqrstvwxyz]/.test(pen)) {
      const doubledConsonant = word.slice(0, -2) + pen + word.slice(-2);
      if (!seen.has(doubledConsonant)) {
        results.push({ text: doubledConsonant, rule: 'Extension', tags: ['Extension', 'Consonant'] });
      }
    }
  }

  return results;
}

/**
 * Generate gamer tags & decorative framing.
 * @param {string} rawWord 
 * @returns {Array<{ text: string, rule: string, tags: string[] }>}
 */
export function generateFraming(rawWord) {
  const word = rawWord;
  const results = [];

  const patterns = [
    { text: `xX_${word}_Xx`, tag: 'Gamer xX' },
    { text: `_${word}_`, tag: 'Underscore Wrap' },
    { text: `__${word}__`, tag: 'Double Underscore' },
    { text: `[${word}]`, tag: 'Brackets' },
    { text: `~${word}~`, tag: 'Tilde Wrap' },
    { text: `.${word}.`, tag: 'Dot Wrap' },
    { text: `-${word}-`, tag: 'Hyphen Wrap' },
    { text: `i_${word}`, tag: 'Prefix i_' },
    { text: `${word}_x`, tag: 'Suffix _x' }
  ];

  for (const p of patterns) {
    results.push({
      text: p.text,
      rule: 'Framing',
      tags: ['Decoration', p.tag]
    });
  }

  return results;
}

/**
 * Generate casing variations.
 * @param {string} rawWord 
 * @returns {Array<{ text: string, rule: string, tags: string[] }>}
 */
export function generateCasing(rawWord) {
  const word = rawWord;
  const results = [];

  // Title Case
  const title = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  if (title !== word) {
    results.push({ text: title, rule: 'Casing', tags: ['Casing', 'TitleCase'] });
  }

  // ALL CAPS
  const upper = word.toUpperCase();
  if (upper !== word) {
    results.push({ text: upper, rule: 'Casing', tags: ['Casing', 'UPPERCASE'] });
  }

  // Alternating case (aLtErNaTiNg)
  let alternating = '';
  for (let i = 0; i < word.length; i++) {
    alternating += i % 2 === 0 ? word[i].toLowerCase() : word[i].toUpperCase();
  }
  if (alternating !== word) {
    results.push({ text: alternating, rule: 'Casing', tags: ['Casing', 'Alternating'] });
  }

  // Inverse Alternating (AlTeRnAtInG)
  let invAlternating = '';
  for (let i = 0; i < word.length; i++) {
    invAlternating += i % 2 === 0 ? word[i].toUpperCase() : word[i].toLowerCase();
  }
  if (invAlternating !== word && invAlternating !== alternating) {
    results.push({ text: invAlternating, rule: 'Casing', tags: ['Casing', 'Alternating'] });
  }

  return results;
}
