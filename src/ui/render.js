import { state } from "../state/state.js";
import { weatherView } from "./views/weatherView.js";
import { settingsView, bindSettingsForm } from "./views/settingsView.js";
import { hydrateIcons } from "./components/weatherIcon.js";
import { escapeHtml } from "../utils/escape.js";

const view = document.querySelector("#view");

export async function render() {
  if (state.route === "settings") {
    view.innerHTML = settingsView();
    bindSettingsForm(view, render, applyGlobalSettings);
    return;
  }

  
  if (state.loading) {
    view.innerHTML = `<p class="status status-loading">Loading weather${state.city ? ` for ${escapeHtml(state.city)}` : ""}…</p>`;
    return;
  }

  if (state.error) {
    view.innerHTML = `<p class="status status-error">${escapeHtml(state.error)}</p>`;
    return;
  }

  if (state.data) {
    view.innerHTML = weatherView(state.data, state.units);
    await hydrateIcons(view);
    return;
  }

  view.innerHTML = `<p class="status status-idle">Search for a city to get started.</p>`;
}

function applyGlobalSettings() {
  document.body.dataset.reduceMotion = String(state.reduceMotion);
}
