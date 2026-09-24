const cache = new Map();

/**
 * @param {string} name
 * @returns {Promise<string>}
 */
export async function loadIcon(name) {
  if (cache.has(name)) return cache.get(name);

  const promise = import(`../../assets/icons/${name}.svg`)
    .then((mod) => mod.default)
    .catch((err) => {
      console.warn(`Icon "${name}" not found, using fallback.`, err);
      if (name === "cloudy") return "";
      return "";
    });

  cache.set(name, promise);
  return promise;
}

/**
 * @param {HTMLElement} root
 */
export async function hydrateIcons(root) {
  const nodes = root.querySelectorAll("[data-icon]");
  if (!nodes.length) return;

  await Promise.all(
    [...nodes].map(async (node) => {
      const name = node.dataset.icon;
      if (!name) return;
      const svg = await loadIcon(name);
      if (svg) {
        node.innerHTML = svg;
        node.classList.add("is-loaded");
      } else {
        node.classList.add("is-missing");
      }
    }),
  );
}
