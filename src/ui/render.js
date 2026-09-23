import { state } from "../state/state.js";
import { hydrateIcons } from "./components/weatherIcon.js";
import { weatherView } from "./views/weatherView.js";

const view = document.querySelector("#view");

export async function render() {
  if (state.loading) {
    view.innerHTML = `<p class="status">Loading weather…</p>`;
    return;
  }

  if (state.error) {
    view.innerHTML = `<p class="status status-error">${state.error}</p>`;
    return;
  }

  if (state.data) {
    view.innerHTML = weatherView(state.data, state.units);
    await hydrateIcons(view);
    return;
  }

  view.innerHTML = `<p class="status">Search for a city to get started.</p>`;
}
