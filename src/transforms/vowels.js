/**
 * Vowel transformation module
 * Handles disemvoweling (dropping vowels), vowel doubling, and vowel shifting.
 */

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * Generate vowel modifications.
 * @param {string} rawWord 
 * @param {Object} options - { drop: boolean, double: boolean, swap: boolean }
 * @returns {Array<{ text: string, rule: string, tags: string[] }>}
 */
export function generateVowelVariations(rawWord, options = { drop: true, double: true, swap: true }) {
  const word = rawWord.toLowerCase();
  const results = [];
  const seen = new Set([word]);

  const add = (text, tag) => {
    if (text && text.length >= 2 && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      results.push({
        text,
        rule: 'Vowel Mod',
        tags: ['Vowel', tag]
      });
    }
  };

  // 1. Disemvoweling / Vowel Dropping
  if (options.drop !== false) {
    // 1a. Full disemvoweling except first letter (e.g. twitter -> twttr, nexus -> nxs)
    let droppedInterior = word[0];
    for (let i = 1; i < word.length; i++) {
      if (!VOWELS.has(word[i])) {
        droppedInterior += word[i];
      }
    }
    if (droppedInterior !== word) {
      add(droppedInterior, 'Vowel Drop (All)');
    }

    // 1b. Drop only last vowel (e.g. Flickr / Tumblr style)
    for (let i = word.length - 1; i >= 1; i--) {
      if (VOWELS.has(word[i])) {
        const dropOne = word.slice(0, i) + word.slice(i + 1);
        add(dropOne, 'Vowel Drop (End)');
        break;
      }
    }

    // 1c. Drop each vowel one by one
    for (let i = 1; i < word.length; i++) {
      if (VOWELS.has(word[i])) {
        const dropOne = word.slice(0, i) + word.slice(i + 1);
        add(dropOne, 'Single Vowel Drop');
      }
    }
  }

  // 2. Vowel Doubling (e.g. cool -> coool, pixel -> pixeel)
  if (options.double !== false) {
    for (let i = 0; i < word.length; i++) {
      if (VOWELS.has(word[i])) {
        const doubled = word.slice(0, i) + word[i] + word.slice(i);
        add(doubled, 'Double Vowel');
      }
    }
  }

  // 3. Vowel Swapping (e.g. a <-> e, o <-> u, i <-> y)
  if (options.swap !== false) {
    const vowelSwapMap = {
      a: 'e',
      e: 'a',
      o: 'u',
      u: 'o',
      i: 'y'
    };

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const rep = vowelSwapMap[char];
      if (rep) {
        const swapped = word.slice(0, i) + rep + word.slice(i + 1);
        add(swapped, 'Vowel Shift');
      }
    }
  }

  return results;
}
