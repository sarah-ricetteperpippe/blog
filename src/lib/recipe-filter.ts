/**
 * recipe-filter.ts (client) — ricerca + filtro categorie + suggerimenti.
 * Condiviso da home e blog. Markup: RecipeSearchBar, RecipeFilterBar,
 * RecipeNoMatch e card con data-rf-card / data-category / data-title /
 * data-url / data-search.
 */

type Plural = { one: string; other: string };

type RecipeFilterConfig = {
  /** Numero massimo di card senza ricerca (home: 9). null = nessun limite (blog). */
  limit: number | null;
  liveAll: string;
  labels: Record<string, string>;
  countCat: Plural;
  countSearch: Plural;
  countSearchCat: Plural;
  countPartial: string;
};

export type RecipeFilterState = {
  category: string;
  isSearching: boolean;
  /** Ricette che corrispondono a filtro + ricerca (prima del limite). */
  total: number;
};

type Options = {
  onChange?: (state: RecipeFilterState) => void;
};

const MAX_SUGGESTIONS = 6;

// Ricerca senza accenti e maiuscole: "menu" trova "Menù"
export const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const plural = (p: Plural, n: number) => (n === 1 ? p.one : p.other).replace('{n}', String(n));

export function initRecipeFilter({ onChange }: Options = {}) {
  const searchWrap = document.querySelector<HTMLElement>('[data-rf-config]');
  if (!searchWrap) return;
  const cfg = JSON.parse(searchWrap.dataset.rfConfig ?? '{}') as RecipeFilterConfig;

  const searchInput = searchWrap.querySelector<HTMLInputElement>('[data-rf-search]');
  const suggestionList = searchWrap.querySelector<HTMLUListElement>('[data-rf-suggestions]');
  const pills = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-rf-pill]'));
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-rf-card]'));
  const countEl = document.querySelector<HTMLElement>('[data-rf-count]');
  const status = document.querySelector<HTMLElement>('[data-rf-status]');
  const empty = document.querySelector<HTMLElement>('[data-rf-empty]');
  const noMatch = document.querySelector<HTMLElement>('[data-rf-nomatch]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cardText = new Map(cards.map(card => [card, normalize(card.dataset.search ?? '')]));

  let activeCategory = 'all';
  let query = '';
  let announceTimer: number | undefined;

  const termsOf = (value: string) => normalize(value).split(/\s+/).filter(Boolean);
  const matches = (card: HTMLElement, terms: string[]) =>
    (activeCategory === 'all' || card.dataset.category === activeCategory) &&
    terms.every(term => (cardText.get(card) ?? '').includes(term));

  // ---------- Filtro ----------
  function applyFilter({ announce = true, initial = false } = {}) {
    const category = activeCategory;
    const isAll = category === 'all';
    const terms = termsOf(query);
    const isSearching = terms.length > 0;
    const matching = cards.filter(card => matches(card, terms));
    // Con un limite (home): max N card senza ricerca; con una ricerca tutti i risultati
    const limited = cfg.limit !== null && !isSearching;
    const visible = new Set(limited ? matching.slice(0, cfg.limit!) : matching);

    cards.forEach(card => {
      const show = visible.has(card);
      const wasHidden = card.hidden;
      card.hidden = !show;
      if (show && wasHidden) {
        // Le card che ricompaiono non rifanno il fade-up dello scroll: comparsa rapida
        card.classList.add('is-visible');
        if (!reduceMotion) {
          card.classList.remove('rf-fade-in');
          void card.offsetWidth;
          card.classList.add('rf-fade-in');
        }
      }
    });

    pills.forEach(pill => {
      const active = pill.dataset.category === category;
      pill.classList.toggle('filter-pill--active', active);
      pill.setAttribute('aria-pressed', String(active));
    });

    // Mobile: la riga di pill scorre, porta in vista quella attiva (solo in orizzontale)
    const activePill = pills.find(p => p.dataset.category === category);
    const bar = activePill?.parentElement;
    if (activePill && bar && bar.scrollWidth > bar.clientWidth) {
      const pillRect = activePill.getBoundingClientRect();
      const barRect = bar.getBoundingClientRect();
      if (pillRect.left < barRect.left || pillRect.right > barRect.right) {
        bar.scrollTo({ left: bar.scrollLeft + pillRect.left - barRect.left - 16, behavior: reduceMotion || initial ? 'auto' : 'smooth' });
      }
    }

    if (empty) empty.hidden = matching.length > 0 || isSearching;
    if (noMatch) noMatch.hidden = matching.length > 0 || !isSearching;

    // URL condivisibile
    const url = new URL(window.location.href);
    if (isAll) url.searchParams.delete('categoria');
    else url.searchParams.set('categoria', category);
    if (isSearching) url.searchParams.set('q', query.trim());
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);

    // Contatore visibile: solo quando c'è un filtro o una ricerca
    const label = cfg.labels[category] ?? category;
    let countText = '';
    if (isSearching) {
      countText = plural(isAll ? cfg.countSearch : cfg.countSearchCat, matching.length).replace('{cat}', label);
    } else if (!isAll) {
      countText = plural(cfg.countCat, matching.length).replace('{cat}', label);
      if (limited && matching.length > cfg.limit!) countText += cfg.countPartial.replace('{shown}', String(cfg.limit));
    }
    if (countEl) countEl.textContent = matching.length > 0 ? countText : '';

    if (announce && status) {
      const message = countText || cfg.liveAll;
      // Durante la digitazione annuncia solo quando l'utente si ferma
      window.clearTimeout(announceTimer);
      announceTimer = window.setTimeout(() => { status.textContent = message; }, isSearching ? 600 : 0);
    }

    onChange?.({ category, isSearching, total: matching.length });
  }

  // ---------- Suggerimenti (combobox accessibile) ----------
  let suggestionItems: { card: HTMLElement; el: HTMLLIElement }[] = [];
  let activeIndex = -1;

  // Evidenzia il primo termine nel titolo, ignorando accenti/maiuscole
  function highlight(title: string, term: string): DocumentFragment {
    const frag = document.createDocumentFragment();
    const chars = Array.from(title);
    const normChars = chars.map(ch => normalize(ch) || ch.toLowerCase());
    const idx = normChars.every(ch => ch.length === 1) ? normChars.join('').indexOf(term) : -1;
    if (!term || idx < 0) {
      frag.append(title);
      return frag;
    }
    const mark = document.createElement('mark');
    mark.textContent = chars.slice(idx, idx + term.length).join('');
    frag.append(chars.slice(0, idx).join(''), mark, chars.slice(idx + term.length).join(''));
    return frag;
  }

  function closeSuggestions() {
    if (!suggestionList || !searchInput) return;
    suggestionList.hidden = true;
    suggestionList.replaceChildren();
    suggestionItems = [];
    activeIndex = -1;
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.removeAttribute('aria-activedescendant');
  }

  function setActive(index: number) {
    if (!searchInput) return;
    activeIndex = index;
    suggestionItems.forEach(({ el }, i) => el.setAttribute('aria-selected', String(i === index)));
    const current = suggestionItems[index];
    if (current) {
      searchInput.setAttribute('aria-activedescendant', current.el.id);
      current.el.scrollIntoView({ block: 'nearest' });
    } else {
      searchInput.removeAttribute('aria-activedescendant');
    }
  }

  function goTo(card: HTMLElement) {
    if (card.dataset.url) window.location.href = card.dataset.url;
  }

  function renderSuggestions() {
    if (!suggestionList || !searchInput) return;
    const terms = termsOf(query);
    if (terms.length === 0) return closeSuggestions();

    const scored = cards
      .filter(card => matches(card, terms))
      .map(card => {
        const title = normalize(card.dataset.title ?? '');
        // Prima i titoli che iniziano col testo, poi quelli che lo contengono, poi il resto
        const score = title.startsWith(terms[0]) ? 0 : terms.every(t => title.includes(t)) ? 1 : 2;
        return { card, score };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, MAX_SUGGESTIONS);

    if (scored.length === 0) return closeSuggestions();

    suggestionItems = scored.map(({ card }, i) => {
      const li = document.createElement('li');
      li.id = `recipe-suggestion-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.className = 'recipe-suggestion';
      const title = document.createElement('span');
      title.className = 'recipe-suggestion-title';
      title.append(highlight(card.dataset.title ?? '', terms[0]));
      const cat = document.createElement('span');
      cat.className = 'recipe-suggestion-cat';
      cat.textContent = cfg.labels[card.dataset.category ?? ''] ?? '';
      li.append(title, cat);
      // mousedown: scatta prima del blur dell'input
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        goTo(card);
      });
      return { card, el: li };
    });
    suggestionList.replaceChildren(...suggestionItems.map(item => item.el));
    suggestionList.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
    activeIndex = -1;
    searchInput.removeAttribute('aria-activedescendant');
  }

  // ---------- Eventi ----------
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      activeCategory = pill.dataset.category ?? 'all';
      applyFilter();
      closeSuggestions();
    });
  });

  searchInput?.addEventListener('input', () => {
    query = searchInput.value;
    applyFilter();
    renderSuggestions();
  });

  searchInput?.addEventListener('keydown', (e) => {
    const open = suggestionItems.length > 0 && !suggestionList?.hidden;
    if (e.key === 'ArrowDown') {
      if (!open) renderSuggestions();
      if (suggestionItems.length === 0) return;
      e.preventDefault();
      setActive((activeIndex + 1) % suggestionItems.length);
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      setActive(activeIndex <= 0 ? suggestionItems.length - 1 : activeIndex - 1);
    } else if (e.key === 'Enter') {
      if (open && activeIndex >= 0) {
        e.preventDefault();
        goTo(suggestionItems[activeIndex].card);
      } else {
        // Invio senza suggerimento scelto: chiude la tendina, i risultati sono già nella griglia
        closeSuggestions();
      }
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      closeSuggestions();
    }
  });

  searchInput?.addEventListener('blur', () => window.setTimeout(closeSuggestions, 100));
  searchInput?.addEventListener('focus', () => { if (query.trim()) renderSuggestions(); });

  // Nessun risultato: apre la ricerca del sito (header) con lo stesso testo,
  // che cerca anche dentro le ricette (es. ingredienti)
  document.querySelector('[data-rf-search-site]')?.addEventListener('click', () => {
    document.getElementById('search-trigger')?.click();
    const fill = (attempt = 0) => {
      const input = document.querySelector<HTMLInputElement>('#search-modal input[type="text"], #search-modal input[type="search"]');
      if (!input) {
        if (attempt < 20) window.setTimeout(() => fill(attempt + 1), 50);
        return;
      }
      input.value = query.trim();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    };
    window.setTimeout(fill, 100);
  });

  // ---------- Stato iniziale da URL (?categoria= & ?q=) ----------
  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get('categoria');
  const initialQuery = params.get('q') ?? '';
  if (initialCategory && pills.some(p => p.dataset.category === initialCategory)) {
    activeCategory = initialCategory;
  }
  if (initialQuery && searchInput) {
    searchInput.value = initialQuery;
    query = initialQuery;
  }
  if (activeCategory !== 'all' || query) applyFilter({ announce: false, initial: true });
}
