import { fetchLocationSuggestions } from "../../api/weatherApi.js";

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
      autocomplete="off"
      minlength="${MIN_CHARS}"
    />
    <ul class="suggestions" hidden></ul>
  `;

  const input = wrapper.querySelector(".search-input");
  const list = wrapper.querySelector(".suggestions");

  let debounceTimer = null;
  let requestId = 0;

  // ---- suggestions ----
  function closeSuggestions() {
    list.hidden = true;
    list.innerHTML = "";
  }

  function renderSuggestions(items) {
    if (!items.length) {
      closeSuggestions();
      return;
    }

    list.innerHTML = items
      .map(
        (s) => `
          <li class="suggestion" data-lat="${s.latitude}" data-lon="${s.longitude}">
            <span class="suggestion-name">${escapeHtml(s.name)}</span>
            <span class="suggestion-meta">${escapeHtml(
              [s.admin1, s.country].filter(Boolean).join(", "),
            )}</span>
          </li>
        `,
      )
      .join("");

    list.hidden = false;
  }

  async function loadSuggestions(query) {
    const id = ++requestId;
    try {
      const items = await fetchLocationSuggestions(query);
      if (id !== requestId) return; // stale response — bail
      renderSuggestions(items);
    } catch (err) {
      console.error(err);
      closeSuggestions();
    }
  }

  // ---- events ----
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const value = input.value.trim();

    if (value.length < MIN_CHARS) {
      closeSuggestions();
      return;
    }

    debounceTimer = setTimeout(() => loadSuggestions(value), DEBOUNCE_MS);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      closeSuggestions();
      onSubmit(value);
    }
    if (e.key === "Escape") {
      closeSuggestions();
    }
  });

  list.addEventListener("click", (e) => {
    const item = e.target.closest(".suggestion");
    if (!item) return;
    const name = item.querySelector(".suggestion-name").textContent;
    input.value = name;
    closeSuggestions();
    onSubmit(name);
  });

  // click outside
  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) closeSuggestions();
  });

  return {
    element: wrapper,
    getValue: () => input.value.trim(),
    clear: () => {
      input.value = "";
      closeSuggestions();
    },
  };
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}
