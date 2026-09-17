/**
 * Word Generator Inventories & Word Banks
 * - Phonotactic inventories for "Easy to Say" syllable assembly
 * - Curated adjectives and nouns for "Memorable / Words"
 * - Visually ambiguous characters for "Easy to Read"
 * - Safety blocked terms list
 */

// ─────────────────────────────────────────────────────────────────────────────
// Phonotactic Inventories (Easy to Say)
// ─────────────────────────────────────────────────────────────────────────────

// Single-consonant onsets with relative natural frequencies
export const ONSETS = [
  ['t', 10], ['n', 10], ['l', 10], ['r', 9], ['m', 9], ['s', 9], ['k', 8],
  ['v', 7], ['d', 7], ['p', 6], ['b', 6], ['f', 5], ['g', 5], ['h', 4],
  ['w', 3], ['y', 2], ['j', 2], ['z', 2]
];

// Multi-consonant onset clusters that English speakers read as a single sound
export const ONSET_CLUSTERS = [
  ['tr', 7], ['dr', 5], ['br', 5], ['pr', 5], ['kr', 4], ['gr', 4], ['fr', 4],
  ['st', 5], ['sp', 3], ['sk', 3], ['sl', 4], ['sn', 3], ['sm', 3],
  ['pl', 4], ['bl', 4], ['kl', 3], ['fl', 4], ['gl', 3],
  ['th', 3], ['sh', 3], ['ch', 3], ['vr', 1], ['tw', 1],
  ['str', 1], ['thr', 1], ['shr', 1]
];

// Vowel nuclei (single vowels and natural diphthongs)
export const NUCLEI = [
  ['a', 14], ['e', 13], ['o', 11], ['i', 10], ['u', 6], ['y', 1],
  ['ai', 3], ['au', 2], ['ea', 3], ['ei', 2], ['ia', 3],
  ['ie', 2], ['io', 2], ['oa', 1], ['ou', 2], ['ue', 1], ['ae', 1]
];

// Medial codas
export const CODAS = [
  ['n', 12], ['r', 10], ['l', 9], ['s', 7], ['m', 6], ['t', 5], ['k', 4], ['d', 3],
  ['nd', 3], ['nt', 3], ['st', 3], ['ng', 3], ['rn', 2], ['rk', 2], ['rt', 2],
  ['ld', 2], ['lt', 2], ['nk', 2], ['sk', 1], ['mp', 1], ['th', 1], ['sh', 1]
];

// Final codas: softer consonants so words don't end abruptly
export const FINAL_CODAS = [
  ['n', 14], ['r', 10], ['l', 8], ['s', 7], ['m', 5], ['t', 4], ['k', 3], ['x', 1],
  ['nt', 3], ['rn', 2], ['ns', 2], ['st', 2], ['rt', 2], ['ls', 1], ['rk', 1], ['ld', 1]
];

// Sayable 3-consonant runs
export const ALLOWED_TRIPLES = {
  str: 1, thr: 1, shr: 1, spr: 1, skr: 1, ntr: 1, ndr: 1, nkl: 1, ngl: 1, ngr: 1,
  nst: 1, nsl: 1, rst: 1, rtr: 1, rdr: 1, rkl: 1, rbl: 1, rgl: 1, rpl: 1, rfl: 1,
  lst: 1, ltr: 1, ldr: 1, lkl: 1, mbr: 1, mpl: 1, mpr: 1, nch: 1, rch: 1, lch: 1,
  nsh: 1, rsh: 1, lsh: 1, nth: 1, rth: 1, lth: 1, sth: 1, scr: 1
};

export const ALLOWED_STOP_PAIRS = { kt: 1, pt: 1, kd: 1 };
export const BAD_FINAL_LETTERS = 'hjwqvcgbp';
export const STOPS = 'tkdpbg';
export const NEEDS_VOWEL_BEFORE = 'hwyjzv';
export const SONORANT_CODA_END = 'nlrms';

export const SYLLABLE_TEMPLATES = {
  initial: [['CV', 40], ['CVC', 18], ['CCV', 16], ['CCVC', 6], ['CCCV', 2], ['V', 4], ['VC', 2]],
  medial:  [['CV', 52], ['CVC', 22], ['CCV', 10], ['CCVC', 3], ['CCCV', 1]],
  final:   [['CV', 34], ['CVC', 30], ['CCV', 7], ['CCVC', 3], ['CCCV', 1]]
};

export const TEMPLATE_SHAPE = {
  V:    { onset: [0, 0], coda: [0, 0] },
  VC:   { onset: [0, 0], coda: [1, 2] },
  CV:   { onset: [1, 1], coda: [0, 0] },
  CVC:  { onset: [1, 1], coda: [1, 2] },
  CCV:  { onset: [2, 2], coda: [0, 0] },
  CCVC: { onset: [2, 2], coda: [1, 2] },
  CCCV: { onset: [3, 3], coda: [0, 0] }
};

// ─────────────────────────────────────────────────────────────────────────────
// Easy to Read Consonants & Character Sets
// ─────────────────────────────────────────────────────────────────────────────

export const LOWER = 'abcdefghijklmnopqrstuvwxyz';
export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const DIGITS = '0123456789';
export const ALL_SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~';
export const MINIMAL_SYMBOLS = '-_.,$';
export const DEFAULT_SYMBOLS = MINIMAL_SYMBOLS;
export const SYMBOLS = DEFAULT_SYMBOLS;
export const AMBIGUOUS = '0Oo1lIi';
export const READABLE_VOWELS = 'aeu';
export const READABLE_CONSONANTS = 'bcdfghjkmnprstvwxyz'; // no l/i/o, no q
export const READABLE_DIGITS = '23456789';

export const CONSONANT_FOLLOWERS = {
  b: 'r', c: 'hkrt', d: 'r', f: 'frt', g: 'hr', h: '', j: '', k: 'nrst',
  m: 'bmnps', n: 'cdgknst', p: 'hprst', r: 'bcdfgkmnpstv', s: 'chkmnptw',
  t: 'hrtw', v: '', w: '', x: '', y: '', z: 'z'
};

// ─────────────────────────────────────────────────────────────────────────────
// Curated Words for "Memorable" Mode
// ─────────────────────────────────────────────────────────────────────────────

export const ADJECTIVES = [
  'amber', 'ample', 'arctic', 'ashen', 'aurora', 'azure', 'balmy', 'blithe', 'bold',
  'brave', 'brisk', 'bronze', 'calm', 'candid', 'civil', 'clever', 'cobalt', 'copper',
  'coral', 'cosmic', 'crimson', 'crisp', 'daring', 'dawn', 'deft', 'dusky', 'eager',
  'early', 'easy', 'elder', 'ember', 'fabled', 'fair', 'fleet', 'fluent', 'frosted',
  'gentle', 'gilded', 'glad', 'golden', 'grand', 'hardy', 'hazel', 'humble', 'ivory',
  'jade', 'jolly', 'keen', 'kindly', 'lively', 'lucid', 'lunar', 'marble', 'mellow',
  'merry', 'mild', 'misty', 'noble', 'nimble', 'olive', 'opal', 'polar', 'prime',
  'quiet', 'rapid', 'rustic', 'sable', 'sandy', 'scarlet', 'sharp', 'silent', 'silver',
  'sleek', 'slate', 'solar', 'spry', 'stellar', 'stormy', 'sunny', 'swift', 'tidal',
  'timber', 'topaz', 'tranquil', 'trusty', 'umber', 'urban', 'valiant', 'velvet',
  'verdant', 'vivid', 'warm', 'whisper', 'wild', 'wily', 'winter', 'wise', 'zesty',
  'neon', 'cyber', 'hyper', 'crypto', 'shadow', 'iron', 'steel', 'mystic', 'vortex',
  'astro', 'sonic', 'turbo', 'quantum', 'prime', 'alpha', 'omega', 'blaze', 'flux'
];

export const NOUNS = [
  'acorn', 'anchor', 'arbor', 'arrow', 'aspen', 'atlas', 'badger', 'basin', 'beacon',
  'birch', 'bison', 'bramble', 'breeze', 'brook', 'canyon', 'cedar', 'cinder', 'cliff',
  'clover', 'comet', 'cypress', 'cove', 'crane', 'crest', 'delta', 'dune', 'eagle',
  'echo', 'ember', 'fable', 'falcon', 'fathom', 'fern', 'fjord', 'flint', 'forge',
  'fox', 'gale', 'garnet', 'glade', 'granite', 'grove', 'harbor', 'harvest', 'haven',
  'heron', 'hollow', 'ibis', 'inlet', 'juniper', 'kestrel', 'lantern', 'lark', 'ledger',
  'lichen', 'lotus', 'lynx', 'maple', 'meadow', 'meridian', 'mesa', 'nectar', 'nimbus',
  'onyx', 'orchard', 'osprey', 'otter', 'pebble', 'pine', 'pilot', 'quarry', 'quill',
  'raven', 'reef', 'ridge', 'river', 'rowan', 'sable', 'sage', 'sequoia', 'shore',
  'sparrow', 'spruce', 'summit', 'thicket', 'thistle', 'tide', 'timber', 'trail',
  'tundra', 'valley', 'vessel', 'vista', 'walnut', 'warden', 'willow', 'wren', 'zenith',
  'nexus', 'pixel', 'cipher', 'vector', 'matrix', 'stride', 'surge', 'pulse', 'spark',
  'drift', 'blade', 'titan', 'ghost', 'shield', 'relic', 'shard', 'orbit', 'signal'
];

// Pre-bucket nouns by character length for instant target matching
export const NOUNS_BY_LENGTH = (() => {
  const map = {};
  for (const n of NOUNS) {
    const len = n.length;
    if (!map[len]) map[len] = [];
    map[len].push(n);
  }
  return map;
})();

// ─────────────────────────────────────────────────────────────────────────────
// Safety Filter: Blocked Terms & Leet Normalization
// ─────────────────────────────────────────────────────────────────────────────

export const BLOCKED_TERMS = [
  'anal', 'anus', 'arse', 'ballsack', 'bastard', 'bitch', 'blowjob', 'bollock',
  'boner', 'boob', 'bugger', 'bukkake', 'butthole', 'clit', 'cock', 'coon', 'cum',
  'cunt', 'dick', 'dildo', 'douche', 'ejacul', 'erotic', 'fag', 'fart', 'felch',
  'fellat', 'fuck', 'fuk', 'gangbang', 'handjob', 'hentai', 'hooker', 'horny',
  'incest', 'jerkoff', 'jizz', 'labia', 'masturb', 'milf', 'molest', 'nig', 'nigg', 'nigr', 'niga', 'nige',
  'nipple', 'nude', 'orgasm', 'orgy', 'penis', 'phuck', 'piss', 'porn', 'prick',
  'pube', 'pussy', 'queef', 'rape', 'rapist', 'rectum', 'retard', 'rimjob', 'scrotum',
  'semen', 'sexo', 'shit', 'shyt', 'slut', 'smegma', 'sperm', 'spunk', 'testicle',
  'tits', 'titty', 'turd', 'twat', 'vagina', 'viagra', 'vulva', 'wank', 'whore',
  'sex', 'ass', 'tit', 'poop', 'crap', 'shag', 'slag', 'skank', 'pedo', 'paedo',
  'quim', 'schlong', 'scrote', 'vag', 'wang', 'willy', 'muff', 'minge', 'knob',
  'gash', 'shite', 'twunt', 'punani', 'poon', 'nads', 'phag', 'jap', 'wop',
  'beaner', 'chink', 'darkie', 'dyke', 'gook', 'gyp', 'heeb', 'honkey', 'kike',
  'kraut', 'nazi', 'paki', 'raghead', 'redskin', 'shemale', 'spic', 'tranny',
  'wetback', 'wigger', 'hitler', 'holocaust', 'lynch', 'klux', 'kkk',
  'suicide', 'killself', 'genocide', 'terrorist', 'behead',
  'admin', 'moderator', 'support'
];

export const LEET_UNMAP = {
  '4': 'a', '@': 'a', '1': 'i', '!': 'i', '|': 'i', '0': 'o',
  '3': 'e', '5': 's', '$': 's', '7': 't', '+': 't', '8': 'b', '9': 'g'
};
