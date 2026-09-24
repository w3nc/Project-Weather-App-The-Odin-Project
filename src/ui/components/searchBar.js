import { fetchLocationSuggestions } from "../../api/weatherApi.js";
import { escapeHtml } from "../../utils/escape.js";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export function createSearchBar({ onSubmit }) {
  const wrapper = document.createElement("div");
  wrapper.className = "searchbar";

  wrapper.innerHTML = `
    <input
      type="search"
      class="search-input"
      placeholder="Search for cities"
      aria-label="Search for cities"
      aria-autocomplete="list"
      aria-expanded="false"
      autocomplete="off"
      minlength="${MIN_CHARS}"
    />
    <button type="button" class="search-clear" aria-label="Clear search" hidden>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
    <ul class="suggestions" role="listbox" hidden></ul>
  `;

  const input = wrapper.querySelector(".search-input");
  const list = wrapper.querySelector(".suggestions");
  const clearBtn = wrapper.querySelector(".search-clear");

  let debounceTimer = null;
  let requestId = 0;
  let suggestions = [];
  let activeIndex = -1;

  //  helpers 
  function openList() {
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function closeList() {
    list.hidden = true;
    list.innerHTML = "";
    suggestions = [];
    activeIndex = -1;
    input.setAttribute("aria-expanded", "false");
  }

  function syncClearButton() {
    clearBtn.hidden = input.value.length === 0;
  }

  function setActiveIndex(idx) {
    const items = list.querySelectorAll(".suggestion");
    items.forEach((el) => el.classList.remove("is-active"));

    if (idx < 0 || idx >= items.length) {
      activeIndex = -1;
      return;
    }

    activeIndex = idx;
    items[idx].classList.add("is-active");
    items[idx].scrollIntoView({ block: "nearest" });
  }

  function renderMessage(text, className = "suggestions-empty") {
    list.innerHTML = `<li class="${className}">${escapeHtml(text)}</li>`;
    openList();
  }

  function renderSuggestions(items) {
    if (!items.length) {
      renderMessage("No matching cities found.");
      return;
    }

    suggestions = items;
    activeIndex = -1;

    list.innerHTML = items
      .map(
        (s, i) => `
          <li
            class="suggestion"
            role="option"
            data-index="${i}"
            data-lat="${s.latitude}"
            data-lon="${s.longitude}"
          >
            <span class="suggestion-name">${escapeHtml(s.name)}</span>
            <span class="suggestion-meta">${escapeHtml(
              [s.admin1, s.country].filter(Boolean).join(", "),
            )}</span>
          </li>
        `,
      )
      .join("");

    openList();
  }

  async function loadSuggestions(query) {
    const id = ++requestId;
    renderMessage("Searching…", "suggestions-loading");

    try {
      const items = await fetchLocationSuggestions(query);
      if (id !== requestId) return;
      renderSuggestions(items);
    } catch (err) {
      if (id !== requestId) return;
      console.error(err);
      renderMessage("Couldn't load suggestions.", "suggestions-error");
    }
  }

  //  events 
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    syncClearButton();

    const value = input.value.trim();

    if (value.length < MIN_CHARS) {
      closeList();
      return;
    }

    debounceTimer = setTimeout(() => loadSuggestions(value), DEBOUNCE_MS);
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    closeList();
    syncClearButton();
    input.focus();
  });

  input.addEventListener("keydown", (e) => {
    const items = list.querySelectorAll(".suggestion");
    const listOpen = !list.hidden && items.length > 0;

    switch (e.key) {
      case "ArrowDown":
        if (!listOpen) return;
        e.preventDefault();
        setActiveIndex((activeIndex + 1) % items.length);
        break;

      case "ArrowUp":
        if (!listOpen) return;
        e.preventDefault();
        setActiveIndex(activeIndex <= 0 ? items.length - 1 : activeIndex - 1);
        break;

      case "Enter": {
        e.preventDefault();

        const value = input.value.trim();

       
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          const s = suggestions[activeIndex];
          input.value = s.name;
          closeList();
          onSubmit({ name: s.name, lat: s.latitude, lon: s.longitude });
          return;
        }

      
        if (listOpen && suggestions[0]) {
          const s = suggestions[0];
          input.value = s.name;
          closeList();
          onSubmit({ name: s.name, lat: s.latitude, lon: s.longitude });
          return;
        }

       
        if (!value) return;
        closeList();
        onSubmit({ name: value });
        break;
      }

      case "Escape":
        closeList();
        break;

      default:
        break;
    }
  });

  list.addEventListener("click", (e) => {
    const item = e.target.closest(".suggestion");
    if (!item) return;

    const idx = Number(item.dataset.index);
    const s = suggestions[idx];
    if (!s) return;

    input.value = s.name;
    closeList();
    onSubmit({ name: s.name, lat: s.latitude, lon: s.longitude });
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) closeList();
  });

  syncClearButton();

  return {
    element: wrapper,
    getValue: () => input.value.trim(),
    clear: () => {
      input.value = "";
      closeList();
      syncClearButton();
    },
  };
}
