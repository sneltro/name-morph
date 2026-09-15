/**
 * Letter Replacement transformation module
 * Strictly ALPHABETICAL substitutions: phonetic swaps, sound-alikes, and single-letter typo variations.
 * NO digits or leetspeak numbers are generated here.
 */

// Phonetic / sound-alike substitution pairs
const PHONETIC_MAP = {
  c: ['k'],
  k: ['c'],
  f: ['ph'],
  ph: ['f'],
  s: ['z'],
  z: ['s'],
  v: ['w'],
  w: ['v'],
  x: ['ks', 'cs', 'z'],
  ks: ['x'],
  cs: ['x'],
  i: ['y'],
  y: ['i'],
  qu: ['kw'],
  q: ['k'],
  ck: ['k', 'kk', 'cc'],
  g: ['j'],
  j: ['g']
};

// QWERTY keyboard adjacent keys for believable single-letter typos
const QWERTY_NEIGHBORS = {
  a: ['s', 'q', 'z'],
  b: ['v', 'n', 'g'],
  c: ['x', 'v', 'd'],
  d: ['s', 'f', 'e'],
  e: ['w', 'r', 'd'],
  f: ['d', 'g', 'r'],
  g: ['f', 'h', 't'],
  h: ['g', 'j', 'y'],
  i: ['u', 'o', 'k'],
  j: ['h', 'k', 'u'],
  k: ['j', 'l', 'i'],
  l: ['k', 'o', 'p'],
  m: ['n', 'k'],
  n: ['b', 'm', 'h'],
  o: ['i', 'p', 'k'],
  p: ['o', 'l'],
  q: ['w', 'a'],
  r: ['e', 't', 'f'],
  s: ['a', 'd', 'w'],
  t: ['r', 'y', 'g'],
  u: ['y', 'i', 'j'],
  v: ['c', 'b', 'f'],
  w: ['q', 'e', 's'],
  x: ['z', 'c', 's'],
  y: ['t', 'u', 'h'],
  z: ['a', 's', 'x']
};

/**
 * Generate variations using purely alphabetical letter substitutions.
 * @param {string} rawWord - Original word
 * @param {Object} options - { phonetic: boolean, typos: boolean }
 * @returns {Array<{ text: string, rule: string, tags: string[] }>}
 */
export function generateLetterReplacements(rawWord, options = { phonetic: true, typos: true }) {
  const word = rawWord.toLowerCase();
  const results = [];
  const seen = new Set([word]);

  const add = (text, tag) => {
    // Strictly verify alphabetical (a-z only)
    if (text && !seen.has(text.toLowerCase()) && /^[a-zA-Z]+$/.test(text)) {
      seen.add(text.toLowerCase());
      results.push({
        text,
        rule: 'Letter Swap',
        tags: ['Letter Replacement', tag]
      });
    }
  };

  // 1. Phonetic multi-char substring swaps (ph -> f, ck -> k, qu -> kw, ks -> x, x -> ks)
  if (options.phonetic !== false) {
    const multiKeys = ['ph', 'ck', 'qu', 'ks', 'cs'];
    for (const key of multiKeys) {
      if (word.includes(key)) {
        for (const rep of PHONETIC_MAP[key]) {
          const replaced = word.replaceAll(key, rep);
          add(replaced, 'Phonetic');
          
          const idx = word.indexOf(key);
          if (idx !== -1) {
            const single = word.slice(0, idx) + rep + word.slice(idx + key.length);
            add(single, 'Phonetic');
          }
        }
      }
    }

    // 2. Single-char phonetic swaps (c <-> k, s <-> z, v <-> w, i <-> y, x -> ks/cs/z)
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const reps = PHONETIC_MAP[char];
      if (reps) {
        for (const rep of reps) {
          const swapped = word.slice(0, i) + rep + word.slice(i + 1);
          add(swapped, 'Phonetic');

          // Capitalized variant
          const cap = swapped.charAt(0).toUpperCase() + swapped.slice(1);
          add(cap, 'Phonetic');
        }
      }
    }

    // 3. Global phonetic swap (e.g. replace all c's with k's: 'circle' -> 'kirkle')
    for (const [char, reps] of Object.entries(PHONETIC_MAP)) {
      if (char.length === 1 && word.includes(char)) {
        for (const rep of reps) {
          const allSwapped = word.replaceAll(char, rep);
          add(allSwapped, 'Phonetic Global');
        }
      }
    }

    // 4. Dual phonetic combinations (e.g. swap both x and s in nexus -> neksuz)
    if (word.length >= 3) {
      for (let i = 0; i < word.length; i++) {
        const repsI = PHONETIC_MAP[word[i]];
        if (!repsI) continue;
        for (let j = i + 1; j < word.length; j++) {
          const repsJ = PHONETIC_MAP[word[j]];
          if (!repsJ) continue;

          for (const repI of repsI) {
            for (const repJ of repsJ) {
              const dual = word.slice(0, i) + repI + word.slice(i + 1, j) + repJ + word.slice(j + 1);
              add(dual, 'Dual Phonetic');
            }
          }
        }
      }
    }
  }

  // 5. Single-letter typo variants (adjacent keyboard keys)
  if (options.typos !== false) {
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const neighbors = QWERTY_NEIGHBORS[char];
      if (neighbors) {
        for (const neighbor of neighbors) {
          const typo = word.slice(0, i) + neighbor + word.slice(i + 1);
          add(typo, 'Typo');
        }
      }
    }
  }

  return results;
}
