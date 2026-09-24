import "./styles/variables.css";
import "./styles/reset.css";
import "./styles/layout.css";
import "./styles/components/searchbar.css";
import "./styles/components/unit-toggle.css";
import "./styles/components/current.css";
import "./styles/components/forecast-today.css";
import "./styles/components/air-conditions.css";
import "./styles/components/week-forecast.css";
import "./styles/components/icons.css";
import "./styles/components/status.css";
import "./styles/components/settings.css";

import { createSearchBar } from "./ui/components/searchBar.js";
import { createUnitToggle } from "./ui/components/unitToggle.js";
import { fetchWeatherByLocation } from "./api/weatherApi.js";
import { processWeather } from "./api/processWeather.js";
import { state, setState } from "./state/state.js";
import { render } from "./ui/render.js";
import { initRouter, updateActiveNav } from "./ui/router.js";
import { saveSettings } from "./utils/storage.js";

const topbar = document.querySelector(".topbar");

const searchBar = createSearchBar({ onSubmit: handleSearch });
const unitToggle = createUnitToggle({
  current: state.units,
  onChange: handleUnitChange,
});

topbar.replaceChildren(searchBar.element, unitToggle.element);

initRouter();
applyGlobalSettings();

let searchToken = 0;

async function handleSearch(payload) {
  const { name, lat, lon } = payload;
  const token = ++searchToken;

  if (state.route !== "weather") {
    setState({ route: "weather" });
    updateActiveNav();
  }

  setState({ loading: true, error: null, city: name });
  render();

  const location =
    typeof lat === "number" && typeof lon === "number" ? `${lat},${lon}` : name;

  try {
    const raw = await fetchWeatherByLocation(location, "metric");
    if (token !== searchToken) return;
    const data = processWeather(raw);
    if (name) data.location.name = name;
    setState({ data, city: name, loading: false });
  } catch (err) {
    if (token !== searchToken) return;
    setState({ error: err.message, loading: false });
  }

  render();
}

function handleUnitChange(unit) {
  if (unit === state.units) return;
  setState({ units: unit });
  persist();
  render();
}

function persist() {
  saveSettings({
    defaultCity: state.city,
    units: state.units,
    timeFormat: state.timeFormat,
    reduceMotion: state.reduceMotion,
  });
}

function applyGlobalSettings() {
  document.body.dataset.reduceMotion = String(state.reduceMotion);
}

applyGlobalSettings();
handleSearch({ name: state.city });
