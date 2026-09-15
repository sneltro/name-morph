/**
 * NameMorph Application Core
 * 
 * Subcategories:
 *  1. Username Generator (New word & handle creation: Say, Read, Random, Memorable)
 *  2. Username Checker (Stub / Coming Soon multi-platform availability check)
 *  3. Username Tweaker (Current NameMorph variation generator)
 * 
 * State management, reactive generation, UI bindings & event orchestration
 */

import { generateVariations } from './transforms/engine.js';
import { PRESETS } from './transforms/presets.js';
import { getFavorites, saveFavorite, removeFavorite, isFavorite, clearAllFavorites } from './storage.js';
import { generateWordBatch, DEFAULT_GENERATOR_CONFIG } from './generator/generatorEngine.js';

// Random starter word bank for Tweaker
const SAMPLE_WORDS = [
  'nexus', 'pixel', 'cipher', 'echo', 'matrix', 'hyper', 'pulse',
  'phantom', 'zenith', 'vertex', 'nova', 'atlas', 'stride', 'surge',
  'vector', 'apex', 'prism', 'vortex', 'glide', 'drift', 'spark'
];

// Active Subcategory View state
let currentSubcategory = 'generator';

// ─────────────────────────────────────────────────────────────────────────────
// Tweaker State & References
// ─────────────────────────────────────────────────────────────────────────────

const tweakerState = {
  word: 'nexus',
  targetCount: 50,
  activePreset: 'all',
  config: { ...PRESETS.all.config },
  results: [],
  filteredResults: [],
  searchFilter: '',
  sortBy: 'random',
  pageOffset: 0
};

// ─────────────────────────────────────────────────────────────────────────────
// Generator State
// ─────────────────────────────────────────────────────────────────────────────

const genState = {
  config: { ...DEFAULT_GENERATOR_CONFIG },
  results: [],
  filteredResults: [],
  searchFilter: '',
  sortBy: 'random'
};

// DOM References
const elements = {
  // Navigation
  subcatNavBtns: document.querySelectorAll('.subcat-nav-btn'),
  subcatViews: document.querySelectorAll('.subcat-view'),
  btnCheckerGotoGen: document.getElementById('btn-checker-goto-gen'),
  btnCheckerGotoTweak: document.getElementById('btn-checker-goto-tweak'),

  // Checker Stub
  checkerMockInput: document.getElementById('checker-mock-input'),
  btnCheckerSimulate: document.getElementById('btn-checker-simulate'),
  platformGrid: document.getElementById('platform-grid'),

  // Generator DOM
  genModeInputs: document.querySelectorAll('input[name="gen-mode"]'),
  genModeHint: document.getElementById('gen-mode-hint'),
  genLenMin: document.getElementById('gen-len-min'),
  genLenMax: document.getElementById('gen-len-max'),
  genBatchPills: document.querySelectorAll('.gen-batch-pills .qty-pill'),
  genBatchCustom: document.getElementById('gen-batch-custom'),
  genOptLowercase: document.getElementById('gen-opt-lowercase'),
  genOptUppercase: document.getElementById('gen-opt-uppercase'),
  genOptNumbers: document.getElementById('gen-opt-numbers'),
  genOptSymbols: document.getElementById('gen-opt-symbols'),
  genNumberSettings: document.getElementById('gen-number-settings'),
  genNumberPlacement: document.getElementById('gen-number-placement'),
  genDigitCount: document.getElementById('gen-digit-count'),
  genAdvPrefix: document.getElementById('gen-adv-prefix'),
  genAdvSuffix: document.getElementById('gen-adv-suffix'),
  genAdvKeyword: document.getElementById('gen-adv-keyword'),
  genAdvKeywordPos: document.getElementById('gen-adv-keyword-pos'),
  genAdvSeparator: document.getElementById('gen-adv-separator'),
  genAdvExclude: document.getElementById('gen-adv-exclude'),
  genAdvStartLetter: document.getElementById('gen-adv-start-letter'),
  genAdvAvoidRepeats: document.getElementById('gen-adv-avoid-repeats'),
  genAdvLeetspeak: document.getElementById('gen-adv-leetspeak'),
  genBtnGenerate: document.getElementById('gen-btn-generate'),
  genBtnSurprise: document.getElementById('gen-btn-surprise'),
  genBtnReset: document.getElementById('gen-btn-reset'),
  genStatsCount: document.getElementById('gen-stats-count'),
  genSelectSort: document.getElementById('gen-select-sort'),
  genSearchFilter: document.getElementById('gen-search-filter'),
  genBtnCopyAll: document.getElementById('gen-btn-copy-all'),
  genBtnExportTxt: document.getElementById('gen-btn-export-txt'),
  genCardsGrid: document.getElementById('gen-cards-grid'),
  genLoadMoreContainer: document.getElementById('gen-load-more-container'),
  genBtnLoadMore: document.getElementById('gen-btn-load-more'),

  // Tweaker DOM
  inputWord: document.getElementById('input-word'),
  btnClearInput: document.getElementById('btn-clear-input'),
  btnGenerate: document.getElementById('btn-generate'),
  btnShuffle: document.getElementById('btn-shuffle'),
  inputCustomQty: document.getElementById('input-custom-qty'),
  qtyPills: document.querySelectorAll('.hero-card .qty-pill'),
  presetsList: document.getElementById('presets-list'),
  cardsGrid: document.getElementById('cards-grid'),
  statsCount: document.getElementById('stats-count'),
  statsWord: document.getElementById('stats-word'),
  searchFilter: document.getElementById('search-filter'),
  selectSort: document.getElementById('select-sort'),
  btnCopyAll: document.getElementById('btn-copy-all'),
  btnExportTxt: document.getElementById('btn-export-txt'),
  loadMoreContainer: document.getElementById('load-more-container'),
  btnLoadMore: document.getElementById('btn-load-more'),
  btnResetRules: document.getElementById('btn-reset-rules'),

  // Favorites Drawer
  btnOpenFavorites: document.getElementById('btn-open-favorites'),
  btnCloseDrawer: document.getElementById('btn-close-drawer'),
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  favoritesDrawer: document.getElementById('favorites-drawer'),
  drawerFavCount: document.getElementById('drawer-fav-count'),
  favCountBadge: document.getElementById('fav-count-badge'),
  drawerFavoritesList: document.getElementById('drawer-favorites-list'),
  btnCopyFavorites: document.getElementById('btn-copy-favorites'),
  btnClearFavorites: document.getElementById('btn-clear-favorites'),

  // Tweaker Toggles
  toggleEnableLeet: document.getElementById('toggle-enable-leet'),
  checkLeetSubtle: document.getElementById('check-leet-subtle'),
  checkLeetFull: document.getElementById('check-leet-full'),
  checkLeetSymbols: document.getElementById('check-leet-symbols'),
  toggleEnableLetterSwaps: document.getElementById('toggle-enable-letter-swaps'),
  checkSwapsPhonetic: document.getElementById('check-swaps-phonetic'),
  checkSwapsTypos: document.getElementById('check-swaps-typos'),
  toggleEnablePrefixes: document.getElementById('toggle-enable-prefixes'),
  checkPrefixTech: document.getElementById('check-prefix-tech'),
  checkPrefixGaming: document.getElementById('check-prefix-gaming'),
  checkPrefixSocial: document.getElementById('check-prefix-social'),
  toggleEnableSuffixes: document.getElementById('toggle-enable-suffixes'),
  checkSuffixStartup: document.getElementById('check-suffix-startup'),
  checkSuffixGaming: document.getElementById('check-suffix-gaming'),
  checkSuffixSocial: document.getElementById('check-suffix-social'),
  toggleEnableVowels: document.getElementById('toggle-enable-vowels'),
  checkVowelsDrop: document.getElementById('check-vowels-drop'),
  checkVowelsDouble: document.getElementById('check-vowels-double'),
  checkVowelsSwap: document.getElementById('check-vowels-swap'),
  toggleEnableExtensions: document.getElementById('toggle-enable-extensions'),
  toggleEnableFraming: document.getElementById('toggle-enable-framing'),
  checkAffixDelimiters: document.getElementById('check-affix-delimiters'),
  toggleEnableCasing: document.getElementById('toggle-enable-casing')
};

/**
 * Toast Notification Helper (Disabled)
 */
function showToast() {
  // Notifications in bottom right corner disabled
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcategory Tab Routing
// ─────────────────────────────────────────────────────────────────────────────

function switchSubcategory(tabId) {
  currentSubcategory = tabId;

  // Update nav buttons
  elements.subcatNavBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update views
  elements.subcatViews.forEach(view => {
    if (view.id === `view-${tabId}`) {
      view.style.display = 'block';
      view.classList.add('active');
    } else {
      view.style.display = 'none';
      view.classList.remove('active');
    }
  });

  // Sync hash
  try {
    history.replaceState(null, '', `#${tabId}`);
  } catch (e) {}

  // First time view triggers
  if (tabId === 'generator' && genState.results.length === 0) {
    generateNames();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator Logic
// ─────────────────────────────────────────────────────────────────────────────

const MODE_HINTS = {
  say: 'Natural, pronounceable names built from phonetic English syllables (e.g., velora, talmir).',
  read: 'Characters constrained to avoid confusing lookalikes like 0/O and 1/l/I. Easy to read and type.',
  memorable: 'Memorable compound handles formed by combining evocative adjectives and nouns (e.g., swift-falcon, amber_ridge).',
  random: 'True pseudorandom combinations from enabled character sets (lowercase, uppercase, numbers, symbols).'
};

function readGenConfigFromUI() {
  const selectedMode = document.querySelector('input[name="gen-mode"]:checked');
  if (selectedMode) {
    genState.config.mode = selectedMode.value;
  }

  let minVal = parseInt(elements.genLenMin.value, 10);
  let maxVal = parseInt(elements.genLenMax.value, 10);
  if (isNaN(minVal) || minVal < 3) minVal = 3;
  if (minVal > 32) minVal = 32;
  if (isNaN(maxVal) || maxVal < 3) maxVal = 3;
  if (maxVal > 32) maxVal = 32;
  if (minVal > maxVal) minVal = maxVal;
  genState.config.minLength = minVal;
  genState.config.maxLength = maxVal;
  genState.config.lowercase = elements.genOptLowercase.checked;
  genState.config.uppercase = elements.genOptUppercase.checked;
  genState.config.numbers = elements.genOptNumbers.checked;
  genState.config.symbols = elements.genOptSymbols.checked;
  genState.config.numberPlacement = elements.genNumberPlacement.value;
  genState.config.digitCount = parseInt(elements.genDigitCount.value, 10) || 2;

  genState.config.prefix = elements.genAdvPrefix.value;
  genState.config.suffix = elements.genAdvSuffix.value;
  genState.config.keyword = elements.genAdvKeyword.value;
  genState.config.keywordPlacement = elements.genAdvKeywordPos.value;
  genState.config.separator = elements.genAdvSeparator.value;
  genState.config.excludeChars = elements.genAdvExclude.value;
  genState.config.startWithLetter = elements.genAdvStartLetter.checked;
  genState.config.avoidRepeats = elements.genAdvAvoidRepeats.checked;
  genState.config.leetspeak = elements.genAdvLeetspeak.checked;

  if (elements.genBatchCustom && elements.genBatchCustom.classList.contains('active') && elements.genBatchCustom.value) {
    let customVal = parseInt(elements.genBatchCustom.value, 10);
    if (!isNaN(customVal) && customVal >= 1) {
      if (customVal > 999) customVal = 999;
      genState.config.count = customVal;
    }
  } else {
    const activePill = document.querySelector('.gen-batch-pills .qty-pill.active');
    if (activePill) {
      genState.config.count = parseInt(activePill.dataset.count, 10) || 12;
    }
  }

  elements.genNumberSettings.style.display = genState.config.numbers ? 'flex' : 'none';
  elements.genModeHint.textContent = MODE_HINTS[genState.config.mode] || MODE_HINTS.say;
}

function syncGenUIFromConfig() {
  const c = genState.config;
  elements.genModeInputs.forEach(input => {
    input.checked = input.value === c.mode;
  });

  elements.genLenMin.value = c.minLength || 6;
  elements.genLenMax.value = c.maxLength || 10;
  elements.genOptLowercase.checked = !!c.lowercase;
  elements.genOptUppercase.checked = !!c.uppercase;
  elements.genOptNumbers.checked = !!c.numbers;
  elements.genOptSymbols.checked = !!c.symbols;
  elements.genNumberPlacement.value = c.numberPlacement || 'end';
  elements.genDigitCount.value = String(c.digitCount || 2);

  elements.genAdvPrefix.value = c.prefix || '';
  elements.genAdvSuffix.value = c.suffix || '';
  elements.genAdvKeyword.value = c.keyword || '';
  elements.genAdvKeywordPos.value = c.keywordPlacement || 'start';
  elements.genAdvSeparator.value = c.separator || '';
  elements.genAdvExclude.value = c.excludeChars || '';
  elements.genAdvStartLetter.checked = !!c.startWithLetter;
  elements.genAdvAvoidRepeats.checked = !!c.avoidRepeats;
  elements.genAdvLeetspeak.checked = !!c.leetspeak;

  const isPreset = [3, 6, 9, 12, 24, 48].includes(c.count);
  elements.genBatchPills.forEach(p => {
    p.classList.toggle('active', parseInt(p.dataset.count, 10) === c.count);
  });

  if (elements.genBatchCustom) {
    if (!isPreset && c.count) {
      elements.genBatchCustom.value = c.count;
      elements.genBatchCustom.classList.add('active');
    } else {
      elements.genBatchCustom.value = '';
      elements.genBatchCustom.classList.remove('active');
    }
  }

  elements.genNumberSettings.style.display = c.numbers ? 'flex' : 'none';
  elements.genModeHint.textContent = MODE_HINTS[c.mode] || MODE_HINTS.say;
}

function generateNames(isUserAction = false) {
  readGenConfigFromUI();

  if (isUserAction) {
    elements.genBtnGenerate.classList.add('generating');
    setTimeout(() => {
      elements.genBtnGenerate.classList.remove('generating');
    }, 400);
  }

  const { items, error } = generateWordBatch(genState.config);
  genState.results = items;

  applyGenFilter();

  if (isUserAction) {
    if (error) {
      showToast(error);
    } else if (items.length > 0) {
      showToast(`Generated ${items.length} fresh names!`);
    }
  }
}

function applyGenFilter() {
  const filter = elements.genSearchFilter.value.trim().toLowerCase();
  genState.searchFilter = filter;

  let list = [...genState.results];

  if (filter) {
    list = list.filter(item =>
      item.text.toLowerCase().includes(filter) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(filter))) ||
      (item.rule && item.rule.toLowerCase().includes(filter))
    );
  }

  if (genState.sortBy === 'shortest') {
    list.sort((a, b) => a.text.length - b.text.length || a.text.localeCompare(b.text));
  } else if (genState.sortBy === 'longest') {
    list.sort((a, b) => b.text.length - a.text.length || a.text.localeCompare(b.text));
  } else if (genState.sortBy === 'alpha') {
    list.sort((a, b) => a.text.localeCompare(b.text));
  }

  genState.filteredResults = list;
  renderGenResults();
}

// Reusable SVG for GitHub icon
const GITHUB_SVG_ICON = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle;"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`;

function renderGenResults() {
  elements.genStatsCount.textContent = genState.filteredResults.length;

  if (genState.filteredResults.length === 0) {
    elements.genCardsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <h3>No names found</h3>
        <p>Try relaxing your exclusions, changing mode, or adjusting length.</p>
      </div>
    `;
    return;
  }

  elements.genCardsGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (const item of genState.filteredResults) {
    const card = document.createElement('div');
    card.className = 'name-card card-enter';
    const favorited = isFavorite(item.text);

    card.innerHTML = `
      <div class="card-top">
        <span class="card-text" title="${item.text}">${item.text}</span>
      </div>
      <div class="card-bottom">
        <div class="card-actions">
          <button class="btn-card-icon btn-card-copy" title="Copy to clipboard">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
          </button>
          <button class="btn-card-icon btn-card-fav ${favorited ? 'active-favorite' : ''}" title="Save to favorites">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${favorited ? '#fbbf24' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        </div>
        <div class="card-checker">
          <a class="btn-check-link" href="https://x.com/${encodeURIComponent(item.text)}" target="_blank" rel="noopener noreferrer" title="Check on X">X</a>
          <a class="btn-check-link btn-check-gh" href="https://github.com/${encodeURIComponent(item.text)}" target="_blank" rel="noopener noreferrer" title="Check on GitHub" aria-label="Check on GitHub">${GITHUB_SVG_ICON}</a>
          <button class="btn-check-link btn-card-tweak" title="Morph variations in Tweaker">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 3px;">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Tweak
          </button>
        </div>
      </div>
    `;

    // Copy action
    const btnCopy = card.querySelector('.btn-card-copy');
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(item.text).then(() => {
        btnCopy.classList.add('copied');
        btnCopy.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        `;
        showToast(`Copied "${item.text}" to clipboard`);
        setTimeout(() => {
          btnCopy.classList.remove('copied');
          btnCopy.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
          `;
        }, 1500);
      });
    });

    // Favorite action
    const btnFav = card.querySelector('.btn-card-fav');
    btnFav.addEventListener('click', () => {
      if (isFavorite(item.text)) {
        removeFavorite(item.text);
        btnFav.classList.remove('active-favorite');
        btnFav.querySelector('svg').setAttribute('fill', 'none');
        showToast(`Removed "${item.text}" from saved`);
      } else {
        saveFavorite({ text: item.text, rule: item.tags[0] || item.rule, tags: item.tags });
        btnFav.classList.add('active-favorite');
        btnFav.querySelector('svg').setAttribute('fill', '#fbbf24');
        showToast(`Saved "${item.text}" to favorites`);
      }
      updateFavoritesUI();
    });

    // Tweak action (Synergy: Switch to Tweaker with this word!)
    const btnTweak = card.querySelector('.btn-card-tweak');
    btnTweak.addEventListener('click', () => {
      tweakGeneratedName(item.text);
    });

    fragment.appendChild(card);
  }

  elements.genCardsGrid.appendChild(fragment);
}

function tweakGeneratedName(name) {
  elements.inputWord.value = name;
  switchSubcategory('tweaker');
  generate({ isUserAction: true });
  showToast(`Loaded "${name}" into Tweaker!`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tweaker Logic (Preserved)
// ─────────────────────────────────────────────────────────────────────────────

function syncUIFromConfig() {
  const c = tweakerState.config;
  elements.toggleEnableLeet.checked = !!c.enableLeet;
  elements.checkLeetSubtle.checked = !!c.leetSubtle;
  elements.checkLeetFull.checked = !!c.leetFull;
  elements.checkLeetSymbols.checked = !!c.leetSymbols;

  elements.toggleEnableLetterSwaps.checked = !!c.enableLetterSwaps;
  elements.checkSwapsPhonetic.checked = !!c.swapsPhonetic;
  elements.checkSwapsTypos.checked = !!c.swapsTypos;

  elements.toggleEnablePrefixes.checked = !!c.enablePrefixes;
  elements.checkPrefixTech.checked = !!c.affixTech;
  elements.checkPrefixGaming.checked = !!c.affixGaming;
  elements.checkPrefixSocial.checked = !!c.affixSocial;

  elements.toggleEnableSuffixes.checked = !!c.enableSuffixes;
  elements.checkSuffixStartup.checked = !!c.affixTech;
  elements.checkSuffixGaming.checked = !!c.affixGaming;
  elements.checkSuffixSocial.checked = !!c.affixSocial;

  elements.toggleEnableVowels.checked = !!c.enableVowels;
  elements.checkVowelsDrop.checked = !!c.vowelsDrop;
  elements.checkVowelsDouble.checked = !!c.vowelsDouble;
  elements.checkVowelsSwap.checked = !!c.vowelsSwap;

  elements.toggleEnableExtensions.checked = !!c.enableExtensions;
  elements.toggleEnableFraming.checked = !!c.enableFraming;
  elements.checkAffixDelimiters.checked = !!c.affixDelimiters;
  elements.toggleEnableCasing.checked = !!c.enableCasing;

  document.getElementById('sub-options-leet').style.opacity = c.enableLeet ? '1' : '0.4';
  document.getElementById('sub-options-letter-swaps').style.opacity = c.enableLetterSwaps ? '1' : '0.4';
  document.getElementById('sub-options-prefixes').style.opacity = c.enablePrefixes ? '1' : '0.4';
  document.getElementById('sub-options-suffixes').style.opacity = c.enableSuffixes ? '1' : '0.4';
  document.getElementById('sub-options-vowels').style.opacity = c.enableVowels ? '1' : '0.4';
  document.getElementById('sub-options-framing').style.opacity = c.enableFraming ? '1' : '0.4';
}

function readConfigFromUI() {
  tweakerState.config = {
    enableLeet: elements.toggleEnableLeet.checked,
    leetSubtle: elements.checkLeetSubtle.checked,
    leetFull: elements.checkLeetFull.checked,
    leetSymbols: elements.checkLeetSymbols.checked,
    enableLetterSwaps: elements.toggleEnableLetterSwaps.checked,
    swapsPhonetic: elements.checkSwapsPhonetic.checked,
    swapsTypos: elements.checkSwapsTypos.checked,
    enablePrefixes: elements.toggleEnablePrefixes.checked,
    affixTech: elements.checkPrefixTech.checked,
    affixGaming: elements.checkPrefixGaming.checked,
    affixSocial: elements.checkPrefixSocial.checked,
    enableSuffixes: elements.toggleEnableSuffixes.checked,
    enableVowels: elements.toggleEnableVowels.checked,
    vowelsDrop: elements.checkVowelsDrop.checked,
    vowelsDouble: elements.checkVowelsDouble.checked,
    vowelsSwap: elements.checkVowelsSwap.checked,
    enableExtensions: elements.toggleEnableExtensions.checked,
    enableFraming: elements.toggleEnableFraming.checked,
    affixDelimiters: elements.checkAffixDelimiters.checked,
    enableCasing: elements.toggleEnableCasing.checked
  };

  syncUIFromConfig();
}

function renderPresetChips() {
  elements.presetsList.innerHTML = '';
  for (const [id, preset] of Object.entries(PRESETS)) {
    const chip = document.createElement('button');
    chip.className = `preset-chip ${tweakerState.activePreset === id ? 'active' : ''}`;
    chip.dataset.presetId = id;
    chip.title = preset.description;
    chip.innerHTML = `<span>${preset.name}</span>`;
    chip.addEventListener('click', () => {
      applyPreset(id);
    });
    elements.presetsList.appendChild(chip);
  }
}

function applyPreset(presetId) {
  const preset = PRESETS[presetId];
  if (!preset) return;
  tweakerState.activePreset = presetId;
  tweakerState.config = { ...preset.config };
  syncUIFromConfig();

  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.presetId === presetId);
  });

  generate();
}

function generate(options = {}) {
  const resetOffset = options.resetOffset !== false;
  const isUserAction = options.isUserAction || false;

  if (resetOffset) {
    tweakerState.pageOffset = 0;
  }

  const word = elements.inputWord.value.trim();
  tweakerState.word = word;

  elements.btnClearInput.style.display = word.length > 0 ? 'block' : 'none';

  if (!word) {
    tweakerState.results = [];
    tweakerState.filteredResults = [];
    renderResults();
    return;
  }

  if (isUserAction) {
    elements.btnGenerate.classList.add('generating');
    setTimeout(() => {
      elements.btnGenerate.classList.remove('generating');
    }, 450);
  }

  const { items, totalAvailable } = generateVariations(
    word,
    tweakerState.config,
    tweakerState.targetCount,
    tweakerState.pageOffset,
    tweakerState.sortBy === 'random'
  );

  tweakerState.results = items;
  applyFilter();

  if (totalAvailable > tweakerState.pageOffset + tweakerState.targetCount) {
    elements.loadMoreContainer.style.display = 'flex';
  } else {
    elements.loadMoreContainer.style.display = 'none';
  }

  if (isUserAction && tweakerState.filteredResults.length > 0) {
    showToast(`Generated ${tweakerState.filteredResults.length} variations for "${word}"!`);
  }
}

function applyFilter() {
  const filter = elements.searchFilter.value.trim().toLowerCase();
  tweakerState.searchFilter = filter;

  let list = [...tweakerState.results];

  if (filter) {
    list = list.filter(item =>
      item.text.toLowerCase().includes(filter) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(filter))) ||
      (item.rule && item.rule.toLowerCase().includes(filter))
    );
  }

  if (tweakerState.sortBy === 'shortest') {
    list.sort((a, b) => a.text.length - b.text.length || a.text.localeCompare(b.text));
  } else if (tweakerState.sortBy === 'longest') {
    list.sort((a, b) => b.text.length - a.text.length || a.text.localeCompare(b.text));
  } else if (tweakerState.sortBy === 'alpha') {
    list.sort((a, b) => a.text.localeCompare(b.text));
  }

  tweakerState.filteredResults = list;
  renderResults();
}

function renderResults() {
  elements.statsWord.textContent = tweakerState.word ? `"${tweakerState.word}"` : '""';
  elements.statsCount.textContent = tweakerState.filteredResults.length;

  if (!tweakerState.word) {
    elements.cardsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
          </svg>
        </div>
        <h3>No word entered</h3>
        <p>Type a username, handle, or brand name in the box above to generate variations.</p>
      </div>
    `;
    return;
  }

  if (tweakerState.filteredResults.length === 0) {
    elements.cardsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <h3>No variations match your filters</h3>
        <p>Try enabling more categories in the sidebar or clearing your search filter.</p>
      </div>
    `;
    return;
  }

  elements.cardsGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (const item of tweakerState.filteredResults) {
    const card = document.createElement('div');
    card.className = 'name-card card-enter';
    const favorited = isFavorite(item.text);

    let tagClass = 'tag-pill';
    const firstTag = (item.tags && item.tags[0]) || item.rule || '';
    if (firstTag.includes('Leet')) tagClass += ' tag-leet';
    else if (firstTag.includes('Letter') || firstTag.includes('Phonetic') || firstTag.includes('Typo')) tagClass += ' tag-letter';
    else if (firstTag.includes('Prefix')) tagClass += ' tag-prefix';
    else if (firstTag.includes('Suffix')) tagClass += ' tag-suffix';
    else if (firstTag.includes('Vowel')) tagClass += ' tag-vowel';

    card.innerHTML = `
      <div class="card-top">
        <span class="card-text" title="${item.text}">${item.text}</span>
      </div>
      <div class="card-bottom">
        <div class="card-bottom-left">
          <div class="card-actions">
            <button class="btn-card-icon btn-card-copy" title="Copy to clipboard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
            <button class="btn-card-icon btn-card-fav ${favorited ? 'active-favorite' : ''}" title="Save to favorites">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${favorited ? '#fbbf24' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          </div>
          <span class="${tagClass}">${item.tags && item.tags[1] ? item.tags[1] : item.rule}</span>
        </div>
        <div class="card-checker">
          <span class="card-length">${item.text.length} chars</span>
          <a class="btn-check-link" href="https://x.com/${encodeURIComponent(item.text)}" target="_blank" rel="noopener noreferrer" title="Check on X">X</a>
          <a class="btn-check-link btn-check-gh" href="https://github.com/${encodeURIComponent(item.text)}" target="_blank" rel="noopener noreferrer" title="Check on GitHub" aria-label="Check on GitHub">${GITHUB_SVG_ICON}</a>
        </div>
      </div>
    `;

    const btnCopy = card.querySelector('.btn-card-copy');
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(item.text).then(() => {
        btnCopy.classList.add('copied');
        btnCopy.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        `;
        showToast(`Copied "${item.text}" to clipboard`);
        setTimeout(() => {
          btnCopy.classList.remove('copied');
          btnCopy.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
          `;
        }, 1500);
      });
    });

    const btnFav = card.querySelector('.btn-card-fav');
    btnFav.addEventListener('click', () => {
      if (isFavorite(item.text)) {
        removeFavorite(item.text);
        btnFav.classList.remove('active-favorite');
        btnFav.querySelector('svg').setAttribute('fill', 'none');
        showToast(`Removed "${item.text}" from saved`);
      } else {
        saveFavorite({ text: item.text, rule: item.rule, tags: item.tags });
        btnFav.classList.add('active-favorite');
        btnFav.querySelector('svg').setAttribute('fill', '#fbbf24');
        showToast(`Saved "${item.text}" to favorites`);
      }
      updateFavoritesUI();
    });

    fragment.appendChild(card);
  }

  elements.cardsGrid.appendChild(fragment);
}

// ─────────────────────────────────────────────────────────────────────────────
// Favorites Drawer Management
// ─────────────────────────────────────────────────────────────────────────────

function updateFavoritesUI() {
  const favorites = getFavorites();
  elements.drawerFavCount.textContent = favorites.length;
  elements.favCountBadge.textContent = favorites.length;
  elements.favCountBadge.style.display = favorites.length > 0 ? 'inline-flex' : 'none';

  if (favorites.length === 0) {
    elements.drawerFavoritesList.innerHTML = `
      <div class="empty-state" style="padding: 2rem 1rem;">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <h4 style="font-size: 1rem; color: var(--text-primary); margin-bottom: 0.25rem;">No saved names yet</h4>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Click the star icon on any generated name to save it here.</p>
      </div>
    `;
    return;
  }

  elements.drawerFavoritesList.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (const fav of favorites) {
    const itemEl = document.createElement('div');
    itemEl.className = 'drawer-fav-item';
    itemEl.innerHTML = `
      <div class="drawer-fav-text">
        <span class="drawer-fav-name">${fav.text}</span>
        <span class="tag-pill" style="font-size: 0.65rem; padding: 1px 6px;">${fav.rule || 'Saved'}</span>
      </div>
      <div class="drawer-fav-actions">
        <button class="btn-fav-copy" title="Copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
        </button>
        <button class="btn-fav-delete" title="Remove" aria-label="Remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    itemEl.querySelector('.btn-fav-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(fav.text).then(() => {
        showToast(`Copied "${fav.text}" to clipboard`);
      });
    });

    itemEl.querySelector('.btn-fav-delete').addEventListener('click', () => {
      removeFavorite(fav.text);
      updateFavoritesUI();
      renderResults();
      renderGenResults();
    });

    fragment.appendChild(itemEl);
  }

  elements.drawerFavoritesList.appendChild(fragment);
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Listeners Wiring
// ─────────────────────────────────────────────────────────────────────────────

function setupEventListeners() {
  // Subcategory Navigation Tabs
  elements.subcatNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchSubcategory(btn.dataset.tab);
    });
  });

  if (elements.btnCheckerGotoGen) {
    elements.btnCheckerGotoGen.addEventListener('click', () => switchSubcategory('generator'));
  }
  if (elements.btnCheckerGotoTweak) {
    elements.btnCheckerGotoTweak.addEventListener('click', () => switchSubcategory('tweaker'));
  }

  // Checker Stub Simulate Check
  if (elements.btnCheckerSimulate) {
    elements.btnCheckerSimulate.addEventListener('click', () => {
      const query = (elements.checkerMockInput.value || '').trim() || 'nexus';
      const badges = document.querySelectorAll('.platform-status-badge');
      badges.forEach(b => {
        b.innerHTML = `<span class="status-indicator" style="background: #fbbf24;"></span><span class="status-text">Checking...</span>`;
      });

      setTimeout(() => {
        const statuses = ['Available', 'Taken', 'Reserved'];
        badges.forEach((b, idx) => {
          const st = idx % 2 === 0 ? 'Available' : 'Taken';
          const color = st === 'Available' ? '#10b981' : '#f43f5e';
          const bg = st === 'Available' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
          b.style.background = bg;
          b.innerHTML = `<span class="status-indicator" style="background: ${color};"></span><span class="status-text" style="color: ${color};">${st}</span>`;
        });
        showToast(`Simulated check complete for "${query}"!`);
      }, 600);
    });
  }

  // Generator Controls Handlers
  elements.genModeInputs.forEach(input => {
    input.addEventListener('change', () => {
      readGenConfigFromUI();
      generateNames(true);
    });
  });

  // Length Range Inputs with min/max validation
  function commitMinLength() {
    let minVal = parseInt(elements.genLenMin.value, 10);
    const maxVal = parseInt(elements.genLenMax.value, 10) || 10;
    if (isNaN(minVal) || minVal < 3) minVal = 3;
    if (minVal > 32) minVal = 32;
    // Check min isn't bigger than max; then it defaults to the same number as max
    if (minVal > maxVal) {
      minVal = maxVal;
    }
    elements.genLenMin.value = minVal;
    genState.config.minLength = minVal;
    generateNames();
  }

  function commitMaxLength() {
    let maxVal = parseInt(elements.genLenMax.value, 10);
    const minVal = parseInt(elements.genLenMin.value, 10) || 3;
    if (isNaN(maxVal) || maxVal > 32) maxVal = 32;
    if (maxVal < 3) maxVal = 3;
    // Vice versa: check max isn't smaller than min; then it defaults to the same number as min
    if (maxVal < minVal) {
      maxVal = minVal;
    }
    elements.genLenMax.value = maxVal;
    genState.config.maxLength = maxVal;
    generateNames();
  }

  elements.genLenMin.addEventListener('input', () => {
    const minVal = parseInt(elements.genLenMin.value, 10);
    const maxVal = parseInt(elements.genLenMax.value, 10);
    if (!isNaN(minVal) && minVal >= 3 && minVal <= maxVal) {
      genState.config.minLength = minVal;
      generateNames();
    }
  });
  elements.genLenMin.addEventListener('change', commitMinLength);
  elements.genLenMin.addEventListener('blur', commitMinLength);
  elements.genLenMin.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') elements.genLenMin.blur();
  });

  elements.genLenMax.addEventListener('input', () => {
    const maxVal = parseInt(elements.genLenMax.value, 10);
    const minVal = parseInt(elements.genLenMin.value, 10);
    if (!isNaN(maxVal) && maxVal <= 32 && maxVal >= minVal) {
      genState.config.maxLength = maxVal;
      generateNames();
    }
  });
  elements.genLenMax.addEventListener('change', commitMaxLength);
  elements.genLenMax.addEventListener('blur', commitMaxLength);
  elements.genLenMax.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') elements.genLenMax.blur();
  });

  // Batch Count Pills
  elements.genBatchPills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.genBatchPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      if (elements.genBatchCustom) {
        elements.genBatchCustom.value = '';
        elements.genBatchCustom.classList.remove('active');
      }
      genState.config.count = parseInt(pill.dataset.count, 10);
      generateNames(true);
    });
  });

  if (elements.genBatchCustom) {
    const commitCustomBatch = () => {
      let val = parseInt(elements.genBatchCustom.value, 10);
      if (isNaN(val) || val < 1) {
        const activePill = document.querySelector('.gen-batch-pills .qty-pill.active');
        if (activePill) {
          genState.config.count = parseInt(activePill.dataset.count, 10);
          elements.genBatchCustom.value = '';
          elements.genBatchCustom.classList.remove('active');
          return;
        }
        val = 12;
      }
      if (val > 999) val = 999;
      elements.genBatchCustom.value = val;
      genState.config.count = val;

      const matchingPill = Array.from(elements.genBatchPills).find(
        p => parseInt(p.dataset.count, 10) === val
      );
      elements.genBatchPills.forEach(p => p.classList.remove('active'));
      if (matchingPill) {
        matchingPill.classList.add('active');
        elements.genBatchCustom.classList.remove('active');
      } else {
        elements.genBatchCustom.classList.add('active');
      }
      generateNames(true);
    };

    elements.genBatchCustom.addEventListener('input', () => {
      const raw = elements.genBatchCustom.value.trim();
      if (raw !== '') {
        let val = parseInt(raw, 10);
        if (!isNaN(val)) {
          if (val > 999) {
            val = 999;
            elements.genBatchCustom.value = 999;
          }
          if (val >= 1) {
            genState.config.count = val;
            const matchingPill = Array.from(elements.genBatchPills).find(
              p => parseInt(p.dataset.count, 10) === val
            );
            elements.genBatchPills.forEach(p => p.classList.remove('active'));
            if (matchingPill) {
              matchingPill.classList.add('active');
              elements.genBatchCustom.classList.remove('active');
            } else {
              elements.genBatchCustom.classList.add('active');
            }
          }
        }
      }
    });
    elements.genBatchCustom.addEventListener('change', commitCustomBatch);
    elements.genBatchCustom.addEventListener('blur', commitCustomBatch);
    elements.genBatchCustom.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        elements.genBatchCustom.blur();
      }
    });
  }

  // Generator Checkboxes & Selects
  const genInputsToWatch = [
    elements.genOptLowercase, elements.genOptUppercase, elements.genOptNumbers, elements.genOptSymbols,
    elements.genNumberPlacement, elements.genDigitCount,
    elements.genAdvPrefix, elements.genAdvSuffix, elements.genAdvKeyword, elements.genAdvKeywordPos,
    elements.genAdvSeparator, elements.genAdvExclude, elements.genAdvStartLetter,
    elements.genAdvAvoidRepeats, elements.genAdvLeetspeak
  ];

  genInputsToWatch.forEach(input => {
    if (input) {
      input.addEventListener('change', () => {
        readGenConfigFromUI();
        generateNames();
      });
    }
  });

  // Primary Generator Triggers
  elements.genBtnGenerate.addEventListener('click', () => generateNames(true));
  elements.genBtnLoadMore.addEventListener('click', () => generateNames(true));

  // Generator "Surprise Me"
  elements.genBtnSurprise.addEventListener('click', () => {
    const modes = ['say', 'read', 'memorable', 'random'];
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    const randomMin = Math.floor(Math.random() * 4) + 4; // 4 to 7
    const randomMax = randomMin + Math.floor(Math.random() * 4) + 1; // min + 1..4
    const caseCombos = [
      { lowercase: true, uppercase: false },
      { lowercase: false, uppercase: true },
      { lowercase: true, uppercase: true }
    ];
    const pickedCase = caseCombos[Math.floor(Math.random() * caseCombos.length)];

    genState.config.mode = randomMode;
    genState.config.minLength = randomMin;
    genState.config.maxLength = randomMax;
    genState.config.lowercase = pickedCase.lowercase;
    genState.config.uppercase = pickedCase.uppercase;
    genState.config.numbers = Math.random() > 0.6;
    syncGenUIFromConfig();
    generateNames(true);
  });

  // Generator Reset
  elements.genBtnReset.addEventListener('click', () => {
    genState.config = { ...DEFAULT_GENERATOR_CONFIG };
    syncGenUIFromConfig();
    generateNames(true);
  });

  // Generator Filter & Sort
  elements.genSearchFilter.addEventListener('input', () => applyGenFilter());
  elements.genSelectSort.addEventListener('change', () => {
    genState.sortBy = elements.genSelectSort.value;
    applyGenFilter();
  });

  // Generator Copy All & Export TXT
  elements.genBtnCopyAll.addEventListener('click', () => {
    if (genState.filteredResults.length === 0) return;
    const allText = genState.filteredResults.map(r => r.text).join('\n');
    navigator.clipboard.writeText(allText).then(() => {
      showToast(`Copied ${genState.filteredResults.length} names to clipboard!`);
    });
  });

  elements.genBtnExportTxt.addEventListener('click', () => {
    if (genState.filteredResults.length === 0) return;
    const allText = genState.filteredResults.map(r => r.text).join('\r\n');
    const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `namemorph-generated-${genState.config.mode}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded generated names file!`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Tweaker Event Listeners
  // ───────────────────────────────────────────────────────────────────────────
  elements.inputWord.addEventListener('input', () => generate());

  elements.btnClearInput.addEventListener('click', () => {
    elements.inputWord.value = '';
    elements.inputWord.focus();
    generate();
  });

  elements.btnGenerate.addEventListener('click', () => generate({ isUserAction: true }));

  elements.btnShuffle.addEventListener('click', () => {
    const current = elements.inputWord.value.trim().toLowerCase();
    const candidates = SAMPLE_WORDS.filter(w => w !== current);
    const next = candidates[Math.floor(Math.random() * candidates.length)] || 'nexus';
    elements.inputWord.value = next;
    generate({ isUserAction: true });
  });

  elements.selectSort.addEventListener('change', () => {
    tweakerState.sortBy = elements.selectSort.value;
    if (tweakerState.sortBy === 'random') {
      generate();
    } else {
      applyFilter();
    }
  });

  elements.qtyPills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.qtyPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const qty = parseInt(pill.dataset.qty, 10);
      tweakerState.targetCount = qty;
      elements.inputCustomQty.value = qty;
      generate();
    });
  });

  elements.inputCustomQty.addEventListener('change', () => {
    let val = parseInt(elements.inputCustomQty.value, 10);
    if (isNaN(val) || val < 5) val = 5;
    if (val > 999) val = 999;
    elements.inputCustomQty.value = val;
    tweakerState.targetCount = val;

    elements.qtyPills.forEach(p => {
      p.classList.toggle('active', parseInt(p.dataset.qty, 10) === val);
    });

    generate();
  });

  elements.searchFilter.addEventListener('input', () => applyFilter());

  elements.btnCopyAll.addEventListener('click', () => {
    if (tweakerState.filteredResults.length === 0) return;
    const allText = tweakerState.filteredResults.map(r => r.text).join('\n');
    navigator.clipboard.writeText(allText).then(() => {
      showToast(`Copied ${tweakerState.filteredResults.length} names to clipboard!`);
    });
  });

  elements.btnExportTxt.addEventListener('click', () => {
    if (tweakerState.filteredResults.length === 0) return;
    const allText = tweakerState.filteredResults.map(r => r.text).join('\r\n');
    const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `namemorph-${tweakerState.word || 'variations'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded variations text file!`);
  });

  elements.btnLoadMore.addEventListener('click', () => {
    tweakerState.pageOffset += tweakerState.targetCount;
    const { items } = generateVariations(
      tweakerState.word,
      tweakerState.config,
      tweakerState.targetCount,
      tweakerState.pageOffset
    );
    tweakerState.results = [...tweakerState.results, ...items];
    applyFilter();
  });

  elements.btnResetRules.addEventListener('click', () => applyPreset('all'));

  const allTweakerToggles = [
    elements.toggleEnableLeet, elements.checkLeetSubtle, elements.checkLeetFull, elements.checkLeetSymbols,
    elements.toggleEnableLetterSwaps, elements.checkSwapsPhonetic, elements.checkSwapsTypos,
    elements.toggleEnablePrefixes, elements.checkPrefixTech, elements.checkPrefixGaming, elements.checkPrefixSocial,
    elements.toggleEnableSuffixes, elements.checkSuffixStartup, elements.checkSuffixGaming, elements.checkSuffixSocial,
    elements.toggleEnableVowels, elements.checkVowelsDrop, elements.checkVowelsDouble, elements.checkVowelsSwap,
    elements.toggleEnableExtensions, elements.toggleEnableFraming, elements.checkAffixDelimiters,
    elements.toggleEnableCasing
  ];

  allTweakerToggles.forEach(el => {
    if (el) {
      el.addEventListener('change', () => {
        readConfigFromUI();
        document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
        generate();
      });
    }
  });

  // Favorites Drawer Handlers
  elements.btnOpenFavorites.addEventListener('click', () => {
    elements.favoritesDrawer.classList.add('open');
    elements.drawerBackdrop.classList.add('open');
    updateFavoritesUI();
  });

  const closeDrawer = () => {
    elements.favoritesDrawer.classList.remove('open');
    elements.drawerBackdrop.classList.remove('open');
  };

  elements.btnCloseDrawer.addEventListener('click', closeDrawer);
  elements.drawerBackdrop.addEventListener('click', closeDrawer);

  elements.btnCopyFavorites.addEventListener('click', () => {
    const favorites = getFavorites();
    if (favorites.length === 0) return;
    const allText = favorites.map(f => f.text).join('\n');
    navigator.clipboard.writeText(allText).then(() => {
      showToast(`Copied ${favorites.length} saved names!`);
    });
  });

  elements.btnClearFavorites.addEventListener('click', () => {
    if (confirm('Clear all saved favorites?')) {
      clearAllFavorites();
      updateFavoritesUI();
      renderResults();
      renderGenResults();
      showToast('Cleared saved favorites');
    }
  });

  // Initial tab from hash if specified
  const hash = (window.location.hash || '').replace('#', '');
  if (['generator', 'checker', 'tweaker'].includes(hash)) {
    switchSubcategory(hash);
  } else {
    switchSubcategory('generator');
  }
}

// App Initialization
function init() {
  syncGenUIFromConfig();
  renderPresetChips();
  syncUIFromConfig();
  setupEventListeners();
  updateFavoritesUI();
  generate();
  generateNames();
}

init();
