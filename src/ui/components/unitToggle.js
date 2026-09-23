export function createUnitToggle({ current = "metric", onChange }) {
  const wrapper = document.createElement("div");
  wrapper.className = "unit-toggle";
  wrapper.setAttribute("role", "group");
  wrapper.setAttribute("aria-label", "Temperature units");

  wrapper.innerHTML = `
    <button type="button" class="unit-btn" data-unit="metric">°C</button>
    <button type="button" class="unit-btn" data-unit="us">°F</button>
  `;

  function setActive(unit) {
    wrapper.querySelectorAll(".unit-btn").forEach((btn) => {
      const isActive = btn.dataset.unit === unit;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  wrapper.addEventListener("click", (e) => {
    const btn = e.target.closest(".unit-btn");
    if (!btn) return;
    const unit = btn.dataset.unit;
    setActive(unit);
    onChange(unit);
  });

  setActive(current);

  return {
    element: wrapper,
    setUnit: setActive,
  };
}
