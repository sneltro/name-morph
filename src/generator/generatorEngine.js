/**
 * Word Generator Engine
 * Client-side handle generator inspired by Wundervault.
 * 
 * Generates brand new words & usernames across 4 core modes:
 *  1. 'say'       — Easy to Say (phonotactically assembled syllables)
 *  2. 'read'      — Easy to Read (unambiguous, typo-resistant)
 *  3. 'random'    — Random characters (configurable classes)
 *  4. 'memorable' — Memorable natural word pairs (adjective + noun)
 * 
 * Pure functions: zero DOM interaction, deterministic options normalization,
 * Web Crypto RNG with rejection sampling, safety profanity filter.
 */

import {
  ONSETS, ONSET_CLUSTERS, NUCLEI, CODAS, FINAL_CODAS,
  ALLOWED_TRIPLES, ALLOWED_STOP_PAIRS, BAD_FINAL_LETTERS,
  STOPS, NEEDS_VOWEL_BEFORE, SONORANT_CODA_END,
  SYLLABLE_TEMPLATES, TEMPLATE_SHAPE,
  LOWER, UPPER, DIGITS, SYMBOLS, AMBIGUOUS,
  READABLE_VOWELS, READABLE_CONSONANTS, READABLE_DIGITS,
  CONSONANT_FOLLOWERS,
  ADJECTIVES, NOUNS, NOUNS_BY_LENGTH,
  BLOCKED_TERMS, LEET_UNMAP
} from './dictionaries.js';

// ─────────────────────────────────────────────────────────────────────────────
// Cryptographically Secure Random Utilities
// ─────────────────────────────────────────────────────────────────────────────

const DRAW_SPACE = 4294967296; // 2^32

function getCrypto() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    return globalThis.crypto;
  }
  return null;
}

export function secureRandomInt(maxExclusive) {
  if (maxExclusive <= 1) return 0;
  const cryptoObj = getCrypto();
  if (!cryptoObj) {
    return Math.floor(Math.random() * maxExclusive);
  }
  const limit = Math.floor(DRAW_SPACE / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let v;
  do {
    cryptoObj.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return v % maxExclusive;
}

export function secureRandomChoice(list) {
  if (!list || list.length === 0) return null;
  return list[secureRandomInt(list.length)];
}

export function weightedChoice(pairs) {
  if (!pairs || pairs.length === 0) return null;
  let total = 0;
  for (let i = 0; i < pairs.length; i++) {
    total += pairs[i][1];
  }
  const target = (secureRandomInt(DRAW_SPACE) / DRAW_SPACE) * total;
  let acc = 0;
  for (let i = 0; i < pairs.length; i++) {
    acc += pairs[i][1];
    if (target < acc) return pairs[i][0];
  }
  return pairs[pairs.length - 1][0];
}

export function shuffled(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Utilities & Safety Filtering
// ─────────────────────────────────────────────────────────────────────────────

function subtract(str, exclude) {
  if (!exclude) return str;
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    if (!exclude.includes(c)) out += c;
  }
  return out;
}

function uniqueChars(str) {
  const seen = new Set();
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    if (!seen.has(c)) {
      seen.add(c);
      out += c;
    }
  }
  return out;
}

function normalizeForSafety(str) {
  const lower = String(str).toLowerCase();
  let out = '';
  for (let i = 0; i < lower.length; i++) {
    let ch = lower.charAt(i);
    if (LEET_UNMAP[ch]) ch = LEET_UNMAP[ch];
    if (/[a-z0-9]/.test(ch)) out += ch;
  }
  // Collapse duplicate runs (e.g. fuuuck -> fuck)
  return out.replace(/([a-z0-9])\1{1,}/g, '$1');
}

export function containsBlockedTerm(candidate) {
  if (!candidate) return false;
  const raw = String(candidate).toLowerCase();
  const normalized = normalizeForSafety(candidate);

  for (let i = 0; i < BLOCKED_TERMS.length; i++) {
    const term = BLOCKED_TERMS[i];
    if (raw.includes(term)) return true;
    if (term.length >= 4 && normalized.includes(term)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode 1: Easy to Say (Phonotactic Syllables)
// ─────────────────────────────────────────────────────────────────────────────

function pickSized(pairs, wantLen) {
  const exact = pairs.filter(p => p[0].length === wantLen);
  if (exact.length > 0) return weightedChoice(exact);
  // Fallback to nearest size
  let best = [];
  let bestDelta = Infinity;
  for (const pair of pairs) {
    const d = Math.abs(pair[0].length - wantLen);
    if (d < bestDelta) {
      bestDelta = d;
      best = [pair];
    } else if (d === bestDelta) {
      best.push(pair);
    }
  }
  return weightedChoice(best);
}

function buildSyllable(position, targetLen, isFinal, allowDiphthong) {
  const templates = SYLLABLE_TEMPLATES[position] || SYLLABLE_TEMPLATES.medial;
  let nucLen = allowDiphthong ? weightedChoice([[1, 8], [2, 2]]) : 1;
  let chosen = null;
  let budget = 0;

  for (let pass = 0; pass < 2 && !chosen; pass++) {
    budget = targetLen - nucLen;
    const eligible = [];
    for (const tpl of templates) {
      const name = tpl[0];
      const shape = TEMPLATE_SHAPE[name];
      if (nucLen > 1 && (shape.coda[1] > 0 || shape.onset[1] === 0)) continue;
      const minC = shape.onset[0] + shape.coda[0];
      const maxC = shape.onset[1] + shape.coda[1];
      if (budget >= minC && budget <= maxC) eligible.push(tpl);
    }
    if (eligible.length > 0) {
      chosen = weightedChoice(eligible);
      break;
    }
    nucLen = nucLen === 1 ? 2 : 1;
  }

  if (!chosen) {
    nucLen = 1;
    budget = Math.max(1, targetLen - 1);
    chosen = weightedChoice(templates);
  }

  const shape = TEMPLATE_SHAPE[chosen];
  const onsetMin = Math.max(shape.onset[0], budget - shape.coda[1]);
  const onsetMax = Math.min(shape.onset[1], budget - shape.coda[0]);
  const onsetLen = onsetMin + (onsetMax > onsetMin ? secureRandomInt(onsetMax - onsetMin + 1) : 0);
  const codaLen = Math.max(shape.coda[0], Math.min(shape.coda[1], budget - onsetLen));

  let onset = '';
  if (onsetLen === 1) onset = weightedChoice(ONSETS);
  else if (onsetLen >= 2) onset = pickSized(ONSET_CLUSTERS, onsetLen);

  const nucleus = pickSized(NUCLEI, nucLen);
  const coda = codaLen >= 1 ? pickSized(isFinal ? FINAL_CODAS : CODAS, codaLen) : '';

  return {
    text: onset + nucleus + coda,
    onset,
    nucleus,
    coda,
    template: chosen,
    diphthong: nucleus.length > 1
  };
}

function junctionOk(prev, next) {
  const coda = prev.coda;
  const onset = next.onset;
  if (!onset) return true;
  if (!coda) return true;

  const last = coda.charAt(coda.length - 1);
  const first = onset.charAt(0);
  const run = coda + onset;

  if (run.length >= 4) return false;
  if (run.length === 3 && !ALLOWED_TRIPLES[run]) return false;
  if (coda.length >= 2 && onset.length >= 2) return false;
  if (onset.length >= 2 && !SONORANT_CODA_END.includes(last)) return false;
  if (NEEDS_VOWEL_BEFORE.includes(first)) return false;
  if (STOPS.includes(last) && STOPS.includes(first)) {
    if (last !== first && !ALLOWED_STOP_PAIRS[last + first]) return false;
  }
  return true;
}

function passesPhonotactics(word) {
  if (!word || word.length < 2) return false;
  if (!/[aeiouy]/.test(word)) return false;
  if (/(.)\1\1/.test(word)) return false; // No triple repeat
  if (/[aeiouy]{3,}/.test(word)) return false; // No 3+ consecutive vowels
  if (/q/.test(word)) return false;
  const rare = word.match(/[xzj]/g);
  if (rare && rare.length > 1) return false;
  if (BAD_FINAL_LETTERS.includes(word.charAt(word.length - 1))) return false;
  if (/[^aeiouy]{4,}/.test(word)) return false; // No 4+ consonants

  const triples = word.match(/[^aeiouy]{3}/g);
  if (triples) {
    for (const t of triples) {
      if (!ALLOWED_TRIPLES[t]) return false;
    }
  }
  return true;
}

function lengthBudget(total, n) {
  const out = [];
  let remaining = total;
  for (let i = 0; i < n; i++) {
    const slots = n - i;
    let t = Math.round(remaining / slots);
    if (slots > 1) {
      const jitter = secureRandomInt(3) - 1;
      if (t + jitter >= 2 && remaining - (t + jitter) >= 2 * (slots - 1)) {
        t += jitter;
      }
    }
    t = Math.max(2, Math.min(4, t));
    out.push(t);
    remaining -= t;
  }
  return out;
}

function generatePronounceableWord(targetLen, excludeChars) {
  const syllablesCount = Math.max(2, Math.min(5, Math.round(targetLen / 2.8)));
  const budget = lengthBudget(targetLen, syllablesCount);

  for (let attempt = 0; attempt < 80; attempt++) {
    const parts = [];
    let prev = null;
    let ok = true;
    let diphthongsLeft = 1;

    for (let i = 0; i < syllablesCount; i++) {
      const pos = i === 0 ? 'initial' : (i === syllablesCount - 1 ? 'final' : 'medial');
      const isFinal = i === syllablesCount - 1;
      let syl = null;

      for (let sAttempt = 0; sAttempt < 20; sAttempt++) {
        const cand = buildSyllable(pos, budget[i], isFinal, diphthongsLeft > 0);
        if (!prev || junctionOk(prev, cand)) {
          syl = cand;
          break;
        }
      }

      if (!syl) {
        ok = false;
        break;
      }
      if (syl.diphthong) diphthongsLeft--;
      parts.push(syl);
      prev = syl;
    }

    if (!ok) continue;
    const word = parts.map(p => p.text).join('');
    if (!passesPhonotactics(word)) continue;
    if (excludeChars) {
      let hasExcluded = false;
      for (let i = 0; i < word.length; i++) {
        if (excludeChars.includes(word.charAt(i))) {
          hasExcluded = true;
          break;
        }
      }
      if (hasExcluded) continue;
    }
    if (containsBlockedTerm(word)) continue;
    return word;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode 2: Easy to Read (Unambiguous, Typo-Free)
// ─────────────────────────────────────────────────────────────────────────────

function generateReadableWord(targetLen, excludeChars) {
  const exclude = (excludeChars || '') + AMBIGUOUS;
  const vowels = subtract(READABLE_VOWELS, exclude);
  const consonants = subtract(READABLE_CONSONANTS, exclude);
  if (!vowels.length || !consonants.length) return null;

  for (let attempt = 0; attempt < 80; attempt++) {
    let out = '';
    let vowelRun = 0;
    let consRun = 0;
    let lastClass = '';
    let lastChar = '';
    let stuck = false;

    while (out.length < targetLen) {
      let pool = '';
      let cls = '';

      if (consRun >= 2) {
        cls = 'v';
        pool = vowels;
      } else if (vowelRun >= 2) {
        cls = 'c';
        pool = consonants;
      } else {
        const pv = out.length === 0 ? 30 : (lastClass === 'v' ? 20 : 60);
        cls = secureRandomInt(100) < pv ? 'v' : 'c';
        pool = cls === 'v' ? vowels : consonants;
      }

      if (out.length === targetLen - 1 && cls === 'c' && consRun >= 1) {
        cls = 'v';
        pool = vowels;
      }

      if (cls === 'c' && lastClass === 'c') {
        if (out.length < 2) {
          cls = 'v';
          pool = vowels;
        } else {
          const allowed = CONSONANT_FOLLOWERS[lastChar] || '';
          pool = subtract(allowed, exclude);
          if (!pool.length) {
            cls = 'v';
            pool = vowels;
          }
        }
      }

      if (lastChar) pool = subtract(pool, lastChar);
      if (!pool.length) {
        cls = 'v';
        pool = subtract(vowels, lastChar);
      }
      if (!pool.length) {
        stuck = true;
        break;
      }

      const ch = pool.charAt(secureRandomInt(pool.length));
      if (cls === 'v') {
        vowelRun++;
        consRun = 0;
      } else {
        consRun++;
        vowelRun = 0;
      }
      lastClass = cls;
      lastChar = ch;
      out += ch;
    }

    if (stuck) continue;
    if (/(.)\1\1/.test(out)) continue;
    if (containsBlockedTerm(out)) continue;
    return out;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode 3: Random
// ─────────────────────────────────────────────────────────────────────────────

function generateRandomWord(targetLen, options) {
  let alpha = '';
  if (options.lowercase) alpha += LOWER;
  if (options.uppercase) alpha += UPPER;
  if (options.numbers) alpha += DIGITS;
  if (options.symbols) alpha += SYMBOLS;
  if (!alpha) alpha = LOWER;

  const alphabet = subtract(uniqueChars(alpha), options.excludeChars);
  if (!alphabet.length) return null;

  const letters = subtract(alphabet, DIGITS + SYMBOLS);
  const poolForFirst = (options.startWithLetter && letters.length > 0) ? letters : alphabet;

  for (let attempt = 0; attempt < 80; attempt++) {
    const chars = [];
    const used = new Set();
    let ok = true;

    for (let i = 0; i < targetLen; i++) {
      let pool = (i === 0) ? poolForFirst : alphabet;
      if (options.avoidRepeats) {
        pool = subtract(pool, Array.from(used).join(''));
        if (!pool.length) {
          ok = false;
          break;
        }
      }
      const ch = pool.charAt(secureRandomInt(pool.length));
      used.add(ch);
      chars.push(ch);
    }

    if (!ok) continue;
    const word = chars.join('');
    if (containsBlockedTerm(word)) continue;
    return word;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode 4: Memorable (Adjective + Noun)
// ─────────────────────────────────────────────────────────────────────────────

function generateMemorableWord(targetLen, options) {
  const sep = options.separator || '';
  const neededWordLen = targetLen - sep.length;

  for (let attempt = 0; attempt < 100; attempt++) {
    let adj = '';
    let noun = '';

    if (attempt < 50 && neededWordLen >= 7) {
      // Attempt exact length match
      const shuffledAdj = shuffled(ADJECTIVES);
      for (const a of shuffledAdj) {
        const remaining = neededWordLen - a.length;
        if (NOUNS_BY_LENGTH[remaining] && NOUNS_BY_LENGTH[remaining].length > 0) {
          adj = a;
          noun = secureRandomChoice(NOUNS_BY_LENGTH[remaining]);
          break;
        }
      }
    }

    if (!adj || !noun) {
      adj = secureRandomChoice(ADJECTIVES);
      noun = secureRandomChoice(NOUNS);
      const total = adj.length + noun.length;
      if (Math.abs(total - neededWordLen) > 3 && attempt < 80) continue;
    }

    let word = adj + sep + noun;
    if (options.excludeChars) {
      let hasExcluded = false;
      for (let i = 0; i < word.length; i++) {
        if (options.excludeChars.includes(word.charAt(i))) {
          hasExcluded = true;
          break;
        }
      }
      if (hasExcluded) continue;
    }
    if (containsBlockedTerm(word)) continue;
    return { adj, noun, sep };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Casing & Decoration Modifiers
// ─────────────────────────────────────────────────────────────────────────────

function applyCasing(word, style) {
  if (!word) return word;
  if (style === 'uppercase') return word.toUpperCase();
  if (style === 'first') return word.charAt(0).toUpperCase() + word.slice(1);
  if (style === 'camel') {
    return word.replace(/(^|[^a-zA-Z0-9])([a-zA-Z])/g, (_, boundary, letter) => boundary + letter.toUpperCase());
  }
  return word.toLowerCase();
}

function applyLightLeet(word) {
  const leetMap = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' };
  const chars = word.split('');
  const eligible = [];
  for (let i = 0; i < chars.length; i++) {
    if (leetMap[chars[i].toLowerCase()]) eligible.push(i);
  }
  if (!eligible.length) return word;
  const count = Math.max(1, Math.round(eligible.length * 0.35));
  const picked = shuffled(eligible).slice(0, count);
  for (const idx of picked) {
    chars[idx] = leetMap[chars[idx].toLowerCase()];
  }
  return chars.join('');
}

function generateDigits(count) {
  let s = '';
  for (let i = 0; i < count; i++) {
    s += DIGITS.charAt(secureRandomInt(DIGITS.length));
  }
  return s;
}

function insertDigits(word, digits, placement) {
  if (!digits) return word;
  if (placement === 'start') return digits + word;
  if (placement === 'anywhere' && word.length > 2) {
    const at = 1 + secureRandomInt(word.length - 1);
    return word.slice(0, at) + digits + word.slice(at);
  }
  return word + digits; // default 'end'
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization & Master Generation Pipeline
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_GENERATOR_CONFIG = {
  mode: 'say',               // 'say' | 'read' | 'random' | 'memorable'
  length: 8,                 // 4 to 24
  count: 12,                 // 4, 8, 12, 24, 48
  lowercase: true,
  uppercase: false,
  numbers: false,
  symbols: false,
  digitCount: 2,
  numberPlacement: 'end',    // 'end' | 'start' | 'anywhere'
  capitalize: 'none',        // 'none' | 'first' | 'camel' | 'uppercase'
  prefix: '',
  suffix: '',
  keyword: '',
  keywordPlacement: 'start', // 'start' | 'end'
  separator: '',             // '' | '-' | '_' | '.'
  excludeChars: '',
  startWithLetter: true,
  avoidRepeats: false,
  leetspeak: false
};

export function normalizeGeneratorOptions(rawOpts = {}) {
  const o = { ...DEFAULT_GENERATOR_CONFIG, ...rawOpts };
  o.length = Math.max(4, Math.min(28, Number(o.length) || 8));
  o.count = Math.max(1, Math.min(60, Number(o.count) || 12));
  o.digitCount = Math.max(1, Math.min(4, Number(o.digitCount) || 2));
  o.prefix = String(o.prefix || '').trim();
  o.suffix = String(o.suffix || '').trim();
  o.keyword = String(o.keyword || '').trim();
  o.excludeChars = String(o.excludeChars || '').trim();
  return o;
}

/**
 * Main batch word generator
 * @param {Object} rawOptions 
 * @returns {{ items: Array<{ text: string, mode: string, rule: string, tags: string[] }>, totalAvailable: number, error: string|null }}
 */
export function generateWordBatch(rawOptions = {}) {
  const o = normalizeGeneratorOptions(rawOptions);
  const out = [];
  const seen = new Set();

  // Core length available for the root generated word
  let affixLen = o.prefix.length + o.suffix.length + o.keyword.length;
  if (o.keyword && o.separator) affixLen += o.separator.length;
  const digitsLen = o.numbers ? o.digitCount : 0;
  let coreTargetLen = Math.max(3, o.length - affixLen - digitsLen);

  const maxAttempts = o.count * 50 + 150;
  let attempts = 0;
  const deadline = Date.now() + 600; // 600ms sync ceiling

  while (out.length < o.count && attempts < maxAttempts && Date.now() < deadline) {
    attempts++;
    let rawCore = '';

    if (o.mode === 'say') {
      rawCore = generatePronounceableWord(coreTargetLen, o.excludeChars);
    } else if (o.mode === 'read') {
      rawCore = generateReadableWord(coreTargetLen, o.excludeChars);
    } else if (o.mode === 'random') {
      rawCore = generateRandomWord(coreTargetLen, o);
    } else if (o.mode === 'memorable') {
      const pair = generateMemorableWord(coreTargetLen, o);
      if (pair) {
        if (o.capitalize === 'camel') {
          rawCore = pair.adj.toLowerCase() + pair.sep + pair.noun.charAt(0).toUpperCase() + pair.noun.slice(1).toLowerCase();
        } else {
          rawCore = pair.adj + pair.sep + pair.noun;
        }
      }
    }

    if (!rawCore) continue;

    // Apply casing
    let finished = (o.mode === 'memorable' && o.capitalize === 'camel')
      ? rawCore
      : applyCasing(rawCore, o.capitalize);

    // If uppercase toggle without lowercase
    if (o.uppercase && !o.lowercase && o.mode !== 'memorable') {
      finished = finished.toUpperCase();
    }

    // Insert digits if requested
    if (o.numbers) {
      const digits = generateDigits(o.digitCount);
      finished = insertDigits(finished, digits, o.numberPlacement);
    }

    // Keyword attachment
    if (o.keyword) {
      const sep = o.separator || '';
      finished = o.keywordPlacement === 'end'
        ? `${finished}${sep}${o.keyword}`
        : `${o.keyword}${sep}${finished}`;
    }

    // Leetspeak
    if (o.leetspeak) {
      finished = applyLightLeet(finished);
    }

    // Prefix & Suffix
    if (o.prefix) finished = o.prefix + finished;
    if (o.suffix) finished = finished + o.suffix;

    // Deduplication check & safety check
    const normalizedKey = finished.toLowerCase();
    if (seen.has(normalizedKey)) continue;
    if (containsBlockedTerm(finished)) continue;

    seen.add(normalizedKey);

    // Tags & Mode Label
    let modeLabel = 'Easy to Say';
    if (o.mode === 'read') modeLabel = 'Easy to Read';
    else if (o.mode === 'random') modeLabel = 'Random';
    else if (o.mode === 'memorable') modeLabel = 'Memorable Words';

    const tags = [modeLabel];
    if (o.numbers) tags.push(`${o.digitCount} Digits`);
    if (o.leetspeak) tags.push('Leet');
    if (o.prefix || o.suffix || o.keyword) tags.push('Affixed');

    out.push({
      text: finished,
      mode: o.mode,
      rule: modeLabel,
      tags: tags
    });
  }

  return {
    items: out,
    totalAvailable: out.length,
    error: out.length === 0 ? 'No words matched these criteria. Try relaxing length or exclusions.' : null
  };
}
