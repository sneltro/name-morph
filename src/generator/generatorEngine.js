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
  NOUNS_BY_LENGTH, ADJECTIVES_BY_LENGTH,
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
  const cryptoObj = getCrypto() || globalThis.crypto;
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
  for (const pair of pairs) {
    total += pair[1];
  }
  const target = (secureRandomInt(DRAW_SPACE) / DRAW_SPACE) * total;
  let acc = 0;
  for (const pair of pairs) {
    acc += pair[1];
    if (target < acc) return pair[0];
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
  return out.replace(/([a-z0-9])\1+/g, '$1');
}

export function containsBlockedTerm(candidate) {
  if (!candidate) return false;
  const raw = String(candidate).toLowerCase();
  const normalized = normalizeForSafety(candidate);

  for (const term of BLOCKED_TERMS) {
    if (raw.includes(term)) return true;
    if (term.length >= 4 && normalized.includes(term)) return true;
  }
  return false;
}

function containsExcludedChar(word, excludeChars) {
  if (!excludeChars) return false;
  for (let i = 0; i < word.length; i++) {
    if (excludeChars.includes(word.charAt(i))) return true;
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

function selectSyllableTemplate(templates, targetLen, initialNucLen) {
  let nucLen = initialNucLen;
  for (let pass = 0; pass < 2; pass++) {
    const budget = targetLen - nucLen;
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
      return { template: weightedChoice(eligible), nucLen, budget };
    }
    nucLen = nucLen === 1 ? 2 : 1;
  }

  return {
    template: weightedChoice(templates),
    nucLen: 1,
    budget: Math.max(1, targetLen - 1)
  };
}

function buildSyllable(position, targetLen, isFinal, allowDiphthong) {
  const templates = SYLLABLE_TEMPLATES[position] || SYLLABLE_TEMPLATES.medial;
  const initialNucLen = allowDiphthong ? weightedChoice([[1, 8], [2, 2]]) : 1;
  const { template: chosen, nucLen, budget } = selectSyllableTemplate(templates, targetLen, initialNucLen);

  const shape = TEMPLATE_SHAPE[chosen];
  const onsetMin = Math.max(shape.onset[0], budget - shape.coda[1]);
  const onsetMax = Math.min(shape.onset[1], budget - shape.coda[0]);
  const onsetLen = onsetMin + (onsetMax > onsetMin ? secureRandomInt(onsetMax - onsetMin + 1) : 0);
  const codaLen = Math.max(shape.coda[0], Math.min(shape.coda[1], budget - onsetLen));

  let onset = '';
  if (onsetLen === 1) onset = weightedChoice(ONSETS);
  else if (onsetLen >= 2) onset = pickSized(ONSET_CLUSTERS, onsetLen);

  const nucleus = pickSized(NUCLEI, nucLen);
  const codaBank = isFinal ? FINAL_CODAS : CODAS;
  const coda = codaLen >= 1 ? pickSized(codaBank, codaLen) : '';

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
    if (slots === 1) {
      out.push(remaining);
      break;
    }
    let t = Math.round(remaining / slots);
    const jitter = secureRandomInt(3) - 1;
    if (t + jitter >= 2 && remaining - (t + jitter) >= 2 * (slots - 1) && remaining - (t + jitter) <= 4 * (slots - 1)) {
      t += jitter;
    }
    t = Math.max(2, Math.min(4, t));
    out.push(t);
    remaining -= t;
  }
  return out;
}

function getSyllablePosition(index, count) {
  if (index === 0) return 'initial';
  if (index === count - 1) return 'final';
  return 'medial';
}

function tryAssembleSyllables(syllablesCount, budget) {
  const parts = [];
  let prev = null;
  let diphthongsLeft = 1;

  for (let i = 0; i < syllablesCount; i++) {
    const isFinal = i === syllablesCount - 1;
    const pos = getSyllablePosition(i, syllablesCount);
    let syl = null;

    for (let sAttempt = 0; sAttempt < 20; sAttempt++) {
      const cand = buildSyllable(pos, budget[i], isFinal, diphthongsLeft > 0);
      if (!prev || junctionOk(prev, cand)) {
        syl = cand;
        break;
      }
    }

    if (!syl) return null;
    if (syl.diphthong) diphthongsLeft--;
    parts.push(syl);
    prev = syl;
  }
  return parts.map(p => p.text).join('');
}

function generatePronounceableWord(targetLen, excludeChars) {
  const syllablesCount = targetLen <= 3 ? 1 : Math.max(2, Math.min(Math.floor(targetLen / 2), Math.round(targetLen / 2.8)));
  const budget = syllablesCount === 1 ? [targetLen] : lengthBudget(targetLen, syllablesCount);

  for (let attempt = 0; attempt < 80; attempt++) {
    const word = tryAssembleSyllables(syllablesCount, budget);
    if (!word || word.length !== targetLen) continue;
    if (!passesPhonotactics(word)) continue;
    if (containsExcludedChar(word, excludeChars)) continue;
    if (containsBlockedTerm(word)) continue;
    return word;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode 2: Easy to Read (Unambiguous, Typo-Free)
// ─────────────────────────────────────────────────────────────────────────────

function getReadableVowelProbability(length, lastClass) {
  if (length === 0) return 30;
  return lastClass === 'v' ? 20 : 60;
}

function determineReadableCharClass(state, targetLen) {
  if (state.consRun >= 2) return 'v';
  if (state.vowelRun >= 2) return 'c';
  const pv = getReadableVowelProbability(state.out.length, state.lastClass);
  const cls = secureRandomInt(100) < pv ? 'v' : 'c';
  if (state.out.length === targetLen - 1 && cls === 'c' && state.consRun >= 1) {
    return 'v';
  }
  return cls;
}

function getReadableCharPool(initialClass, state, config) {
  let cls = initialClass;
  let pool = cls === 'v' ? config.vowels : config.consonants;

  if (cls === 'c' && state.lastClass === 'c') {
    if (state.out.length < 2) {
      cls = 'v';
      pool = config.vowels;
    } else {
      const allowed = CONSONANT_FOLLOWERS[state.lastChar] || '';
      pool = subtract(allowed, config.exclude);
      if (!pool.length) {
        cls = 'v';
        pool = config.vowels;
      }
    }
  }

  if (state.lastChar) pool = subtract(pool, state.lastChar);
  if (!pool.length) {
    cls = 'v';
    pool = subtract(config.vowels, state.lastChar);
  }
  return { pool, cls };
}

function pickNextReadableChar(state, config) {
  const initialClass = determineReadableCharClass(state, config.targetLen);
  const { pool, cls } = getReadableCharPool(initialClass, state, config);
  if (!pool.length) return null;

  const ch = pool.charAt(secureRandomInt(pool.length));
  return { ch, cls };
}

function buildReadableAttempt(targetLen, vowels, consonants, exclude) {
  const state = {
    out: '',
    vowelRun: 0,
    consRun: 0,
    lastClass: '',
    lastChar: ''
  };
  const config = { targetLen, vowels, consonants, exclude };

  while (state.out.length < targetLen) {
    const next = pickNextReadableChar(state, config);
    if (!next) return null;

    if (next.cls === 'v') {
      state.vowelRun++;
      state.consRun = 0;
    } else {
      state.consRun++;
      state.vowelRun = 0;
    }
    state.lastClass = next.cls;
    state.lastChar = next.ch;
    state.out += next.ch;
  }
  return state.out;
}

function generateReadableWord(targetLen, excludeChars) {
  const exclude = (excludeChars || '') + AMBIGUOUS;
  const vowels = subtract(READABLE_VOWELS, exclude);
  const consonants = subtract(READABLE_CONSONANTS, exclude);
  if (!vowels.length || !consonants.length) return null;

  for (let attempt = 0; attempt < 80; attempt++) {
    const out = buildReadableAttempt(targetLen, vowels, consonants, exclude);
    if (!out || /(.)\1\1/.test(out) || containsBlockedTerm(out)) continue;
    return out;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode 3: Random
// ─────────────────────────────────────────────────────────────────────────────

function buildRandomAlphabet(options) {
  let alpha = '';
  const symbolPool = (typeof options.customSymbols === 'string') ? options.customSymbols : SYMBOLS;
  if (options.lowercase) alpha += LOWER;
  if (options.uppercase) alpha += UPPER;
  if (options.numbers) alpha += DIGITS;
  if (options.symbols) alpha += symbolPool;
  if (!alpha) alpha = LOWER;

  const alphabet = subtract(uniqueChars(alpha), options.excludeChars);
  if (!alphabet.length) return null;

  const letters = subtract(alphabet, DIGITS + symbolPool);
  const poolForFirst = (options.startWithLetter && letters.length > 0) ? letters : alphabet;
  return { alphabet, poolForFirst };
}

function assembleRandomChars(targetLen, alphabet, poolForFirst, avoidRepeats) {
  const chars = [];
  const used = new Set();

  for (let i = 0; i < targetLen; i++) {
    let pool = (i === 0) ? poolForFirst : alphabet;
    if (avoidRepeats) {
      pool = subtract(pool, Array.from(used).join(''));
      if (!pool.length) return null;
    }
    const ch = pool.charAt(secureRandomInt(pool.length));
    used.add(ch);
    chars.push(ch);
  }
  return chars;
}

function ensureDigitPresent(chars, options) {
  let word = chars.join('');
  if (options.numbers && !/\d/.test(word)) {
    const digitPool = subtract(DIGITS, options.excludeChars);
    if (digitPool.length > 0) {
      const replaceIdx = (options.startWithLetter && chars.length > 1)
        ? 1 + secureRandomInt(chars.length - 1)
        : secureRandomInt(chars.length);
      chars[replaceIdx] = digitPool.charAt(secureRandomInt(digitPool.length));
      word = chars.join('');
    }
  }
  return word;
}

function generateRandomWord(targetLen, options) {
  const config = buildRandomAlphabet(options);
  if (!config) return null;
  const { alphabet, poolForFirst } = config;

  for (let attempt = 0; attempt < 80; attempt++) {
    const chars = assembleRandomChars(targetLen, alphabet, poolForFirst, options.avoidRepeats);
    if (!chars) continue;
    const word = ensureDigitPresent(chars, options);
    if (containsBlockedTerm(word)) continue;
    return word;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode 4: Memorable (Adjective + Noun)
// ─────────────────────────────────────────────────────────────────────────────

function getMemorablePartitions(neededWordLen) {
  const partitions = [];
  for (let adjLen = 3; adjLen <= 17; adjLen++) {
    const nounLen = neededWordLen - adjLen;
    if (nounLen >= 3 && nounLen <= 17) {
      if (ADJECTIVES_BY_LENGTH[adjLen] && ADJECTIVES_BY_LENGTH[adjLen].length > 0 &&
          NOUNS_BY_LENGTH[nounLen] && NOUNS_BY_LENGTH[nounLen].length > 0) {
        partitions.push([adjLen, nounLen]);
      }
    }
  }
  return partitions;
}

function generateMemorableWord(targetLen, options) {
  const sep = options.separator || '';
  const neededWordLen = targetLen - sep.length;

  const partitions = getMemorablePartitions(neededWordLen);
  if (partitions.length === 0) {
    return null;
  }

  for (let attempt = 0; attempt < 80; attempt++) {
    const [adjLen, nounLen] = secureRandomChoice(partitions);
    const adj = secureRandomChoice(ADJECTIVES_BY_LENGTH[adjLen]);
    const noun = secureRandomChoice(NOUNS_BY_LENGTH[nounLen]);

    if (!adj || !noun) continue;

    const word = adj + sep + noun;
    if (containsExcludedChar(word, options.excludeChars)) continue;
    if (containsBlockedTerm(word)) continue;
    return { adj, noun, sep };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Casing & Decoration Modifiers
// ─────────────────────────────────────────────────────────────────────────────

function applyRandomMixedCase(word) {
  const chars = word.split('');
  const letterIndices = [];
  for (let i = 0; i < chars.length; i++) {
    if (/[a-zA-Z]/.test(chars[i])) {
      letterIndices.push(i);
      chars[i] = (secureRandomInt(2) === 1) ? chars[i].toUpperCase() : chars[i].toLowerCase();
    }
  }
  if (letterIndices.length >= 2) {
    const allUpper = letterIndices.every(idx => chars[idx] === chars[idx].toUpperCase());
    const allLower = letterIndices.every(idx => chars[idx] === chars[idx].toLowerCase());
    if (allUpper || allLower) {
      const flipIdx = letterIndices[secureRandomInt(letterIndices.length)];
      chars[flipIdx] = allUpper ? chars[flipIdx].toLowerCase() : chars[flipIdx].toUpperCase();
    }
  }
  return chars.join('');
}

export function applyCasingByOptions(word, options = {}) {
  if (!word) return word;

  const hasLower = !!options.lowercase;
  const hasUpper = !!options.uppercase;

  // If only uppercase is enabled, all words are uppercase
  if (hasUpper && !hasLower) {
    return word.toUpperCase();
  }

  // If both are enabled, each character can be either lowercase or uppercase (decided randomly)
  if (hasLower && hasUpper) {
    return applyRandomMixedCase(word);
  }

  // If only lowercase is enabled (or fallback): all words are lowercase
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

function replaceLettersWithNumbers(chars, eligibleIndices, digitPool) {
  let digitCount = 0;
  // Each character has an independent ~25% chance to be a number
  for (const idx of eligibleIndices) {
    if (secureRandomInt(100) < 25) {
      chars[idx] = digitPool.charAt(secureRandomInt(digitPool.length));
      digitCount++;
    }
  }

  // Guarantee at least one digit is present if numbers is enabled
  if (digitCount === 0) {
    const pickedIdx = eligibleIndices[secureRandomInt(eligibleIndices.length)];
    chars[pickedIdx] = digitPool.charAt(secureRandomInt(digitPool.length));
  }
}

export function applyNumbersByChance(word, options = {}) {
  if (!word || !options.numbers) return word;

  const chars = word.split('');
  const isReadMode = options.mode === 'read';
  const digitPool = isReadMode
    ? subtract(READABLE_DIGITS, options.excludeChars)
    : subtract(DIGITS, options.excludeChars);

  if (!digitPool.length) return word;

  const hasLetters = !!options.lowercase || !!options.uppercase;

  // If only numbers is enabled (no letters), all characters become digits
  if (!hasLetters) {
    for (let i = 0; i < chars.length; i++) {
      chars[i] = digitPool.charAt(secureRandomInt(digitPool.length));
    }
    return chars.join('');
  }

  // Determine eligible character positions (e.g. letters)
  const startIndex = (options.startWithLetter && chars.length > 1) ? 1 : 0;
  const eligibleIndices = [];
  for (let i = startIndex; i < chars.length; i++) {
    if (/[a-zA-Z0-9]/.test(chars[i])) {
      eligibleIndices.push(i);
    }
  }

  if (!eligibleIndices.length) return word;

  replaceLettersWithNumbers(chars, eligibleIndices, digitPool);

  return chars.join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization & Master Generation Pipeline
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_GENERATOR_CONFIG = {
  mode: 'say',               // 'say' | 'read' | 'random' | 'memorable'
  minLength: 6,              // 3 to 25
  maxLength: 10,             // 3 to 25
  count: 16,                 // 4, 8, 16, 32, 64, or custom up to 999
  lowercase: true,
  uppercase: false,
  numbers: false,
  symbols: false,
  customSymbols: SYMBOLS,
  prefix: '',
  suffix: '',
  keyword: '',
  excludeChars: '',
  startWithLetter: true,
  avoidRepeats: false,
  leetspeak: false
};

export function normalizeGeneratorOptions(rawOpts = {}) {
  const o = { ...DEFAULT_GENERATOR_CONFIG, ...rawOpts };
  let minLen = Number(o.minLength ?? o.length ?? 6);
  let maxLen = Number(o.maxLength ?? o.length ?? 10);
  if (Number.isNaN(minLen)) minLen = 6;
  if (Number.isNaN(maxLen)) maxLen = 10;
  minLen = Math.max(3, Math.min(25, minLen));
  maxLen = Math.max(3, Math.min(25, maxLen));
  if (minLen > maxLen) {
    minLen = maxLen;
  }
  o.minLength = minLen;
  o.maxLength = maxLen;
  o.count = Math.max(1, Math.min(999, Number(o.count) || 12));
  o.prefix = String(o.prefix || '').trim();
  o.suffix = String(o.suffix || '').trim();
  o.keyword = String(o.keyword || '').trim();
  o.excludeChars = String(o.excludeChars || '').trim();
  o.customSymbols = typeof o.customSymbols === 'string' ? o.customSymbols : SYMBOLS;
  return o;
}

function pickTargetLength(options, minMemorableCore, affixLen) {
  if (options.mode === 'memorable') {
    const effMin = Math.max(options.minLength, minMemorableCore + affixLen);
    if (effMin > options.maxLength) return null;
    return effMin === options.maxLength
      ? effMin
      : effMin + secureRandomInt(options.maxLength - effMin + 1);
  }
  return options.minLength === options.maxLength
    ? options.minLength
    : options.minLength + secureRandomInt(options.maxLength - options.minLength + 1);
}

function generateCoreWord(mode, coreTargetLen, options) {
  if (mode === 'say') return generatePronounceableWord(coreTargetLen, options.excludeChars);
  if (mode === 'read') return generateReadableWord(coreTargetLen, options.excludeChars);
  if (mode === 'random') return generateRandomWord(coreTargetLen, options);
  if (mode === 'memorable') {
    const pair = generateMemorableWord(coreTargetLen, options);
    return pair ? pair.adj + pair.sep + pair.noun : null;
  }
  return null;
}

function finalizeGeneratedWord(rawCore, options) {
  let finished = rawCore;

  // If numbers enabled in non-random modes, each character has a chance to be a number (disabled for say & read)
  if (options.numbers && options.mode !== 'random' && options.mode !== 'say' && options.mode !== 'read') {
    finished = applyNumbersByChance(finished, options);
  }

  // Keyword insertion at a random position in the generated word
  if (options.keyword) {
    const insertIdx = secureRandomInt(finished.length + 1);
    finished = finished.slice(0, insertIdx) + options.keyword + finished.slice(insertIdx);
  }

  // Leetspeak
  if (options.leetspeak) {
    finished = applyLightLeet(finished);
  }

  // Prefix & Suffix
  if (options.prefix) finished = options.prefix + finished;
  if (options.suffix) finished = finished + options.suffix;

  // Apply casing based on Lowercase & Uppercase switchers:
  // - If only lowercase: all words are lowercase
  // - If only uppercase: all words are uppercase
  // - If both: each character can be either lowercase or uppercase (decided randomly)
  return applyCasingByOptions(finished, options);
}

function buildWordMetadata(finished, options) {
  const modeLabels = {
    say: 'Easy to Say',
    read: 'Easy to Read',
    random: 'Random',
    memorable: 'Memorable Words'
  };
  const modeLabel = modeLabels[options.mode] || 'Easy to Say';

  const tags = [modeLabel];
  if (options.numbers && options.mode !== 'say' && options.mode !== 'read') tags.push('Numbers');
  if (options.symbols && options.mode === 'random') tags.push('Symbols');
  if (options.leetspeak) tags.push('Leet');
  if (options.prefix || options.suffix || options.keyword) tags.push('Affixed');

  return {
    text: finished,
    mode: options.mode,
    rule: modeLabel,
    tags
  };
}

function generateBatchCandidate(o, minMemorableCore, affixLen, seen) {
  const targetLength = pickTargetLength(o, minMemorableCore, affixLen);
  if (targetLength === null) return { done: true };

  let coreTargetLen = targetLength - affixLen;
  if (o.mode !== 'memorable') {
    coreTargetLen = Math.max(3, coreTargetLen);
  }

  const rawCore = generateCoreWord(o.mode, coreTargetLen, o);
  if (!rawCore) return null;

  const finished = finalizeGeneratedWord(rawCore, o);
  if (finished.length < o.minLength || finished.length > o.maxLength) {
    return null;
  }

  const normalizedKey = finished.toLowerCase();
  if (seen.has(normalizedKey) || containsBlockedTerm(finished)) {
    return null;
  }

  seen.add(normalizedKey);
  return { item: buildWordMetadata(finished, o) };
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

  const affixLen = o.prefix.length + o.suffix.length + o.keyword.length;
  const sepLen = (o.separator || '').length;
  const minMemorableCore = 6 + sepLen;

  if (o.mode === 'memorable' && (o.maxLength - affixLen) < minMemorableCore) {
    return {
      items: [],
      totalAvailable: 0,
      error: 'No words matched these criteria. Try relaxing length or exclusions.'
    };
  }

  const maxAttempts = Math.max(o.count * 60 + 200, 1000);
  let attempts = 0;
  const deadline = Date.now() + Math.max(800, o.count * 15);

  while (out.length < o.count && attempts < maxAttempts && Date.now() < deadline) {
    attempts++;
    const cand = generateBatchCandidate(o, minMemorableCore, affixLen, seen);
    if (!cand) continue;
    if (cand.done) break;
    out.push(cand.item);
  }

  return {
    items: out,
    totalAvailable: out.length,
    error: out.length === 0 ? 'No words matched these criteria. Try relaxing length or exclusions.' : null
  };
}
