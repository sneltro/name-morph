/**
 * Leet Speak transformation module
 * Replaces letters with numbers and special symbols.
 * STRICTLY independent from alphabetical letter-to-letter replacements.
 */

const LEET_MAP = {
  a: ['4', '@'],
  b: ['8'],
  c: ['<', '('],
  e: ['3'],
  g: ['9', '6'],
  i: ['1', '!'],
  l: ['1'],
  o: ['0'],
  s: ['5', '$'],
  t: ['7'],
  x: ['8', '%'],
  z: ['2']
};

// Common gamer numeric suffixes / tags
const GAMER_NUMBERS = ['777', '404', '007', '99', '01', '360', '88', '00', '101', '420', '69'];

/**
 * Generate variations using Leet Speak (numbers & symbols).
 * @param {string} rawWord - Original word
 * @param {Object} options - { subtle: boolean, full: boolean, symbols: boolean }
 * @returns {Array<{ text: string, rule: string, tags: string[] }>}
 */
export function generateLeetVariations(rawWord, options = { subtle: true, full: true, symbols: true }) {
  const word = rawWord.toLowerCase();
  const results = [];
  const seen = new Set([word]);

  const add = (text, tag) => {
    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      results.push({
        text,
        rule: 'Leet Speak',
        tags: ['Leet', tag]
      });
    }
  };

  // 1. Single character substitutions (Subtle Leet)
  if (options.subtle !== false) {
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const replacements = LEET_MAP[char];
      if (replacements) {
        for (const rep of replacements) {
          if (!options.symbols && ['@', '!', '$', '<', '(', '%'].includes(rep)) continue;
          const subtle = word.slice(0, i) + rep + word.slice(i + 1);
          add(subtle, 'Subtle Leet');

          // Add capitalized variant
          const cap = subtle.charAt(0).toUpperCase() + subtle.slice(1);
          add(cap, 'Subtle Leet');
        }
      }
    }
  }

  // 2. Full Leet (replace all eligible letters with standard numbers)
  if (options.full !== false) {
    let fullNumeric = '';
    let hasReplaced = false;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const reps = LEET_MAP[char];
      if (reps && reps[0] && /[0-9]/.test(reps[0])) {
        fullNumeric += reps[0];
        hasReplaced = true;
      } else {
        fullNumeric += char;
      }
    }
    if (hasReplaced) {
      add(fullNumeric, 'Full Leet');
      add(fullNumeric.toUpperCase(), 'Full Leet');
    }

    // 3. Two-char leet combinations
    if (word.length >= 2) {
      for (let i = 0; i < word.length; i++) {
        const repsI = LEET_MAP[word[i]];
        if (!repsI) continue;
        for (let j = i + 1; j < word.length; j++) {
          const repsJ = LEET_MAP[word[j]];
          if (!repsJ) continue;
          
          for (const repI of repsI) {
            if (!options.symbols && !/[0-9]/.test(repI)) continue;
            for (const repJ of repsJ) {
              if (!options.symbols && !/[0-9]/.test(repJ)) continue;
              const combo = word.slice(0, i) + repI + word.slice(i + 1, j) + repJ + word.slice(j + 1);
              add(combo, 'Dual Leet');
              
              const capCombo = combo.charAt(0).toUpperCase() + combo.slice(1);
              add(capCombo, 'Dual Leet');
            }
          }
        }
      }
    }
  }

  // 4. Symbolic substitutions (@ for a, $ for s, ! for i)
  if (options.symbols !== false) {
    let symbolized = '';
    let symReplaced = false;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (char === 'a') { symbolized += '@'; symReplaced = true; }
      else if (char === 's') { symbolized += '$'; symReplaced = true; }
      else if (char === 'i') { symbolized += '!'; symReplaced = true; }
      else { symbolized += char; }
    }
    if (symReplaced) {
      add(symbolized, 'Symbol Leet');
    }
  }

  // 5. Classic gamer numbers (numbers appended/prepended to leet variations)
  // Ensures words with few vowels still have plenty of leet possibilities
  for (const num of GAMER_NUMBERS) {
    add(`${word}${num}`, 'Leet Number');
    add(`${word}_${num}`, 'Leet Number');
    add(`${num}_${word}`, 'Leet Number');
    add(`x${num}_${word}`, 'Leet Number');

    // Also combine with subtle leet if available
    if (results.length > 0) {
      const firstLeet = results[0].text;
      add(`${firstLeet}${num}`, 'Leet Number');
      add(`${firstLeet}_${num}`, 'Leet Number');
    }
  }

  return results;
}
