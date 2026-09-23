import { createSearchBar } from "./ui/components/searchBar.js";
import { createUnitToggle } from "./ui/components/unitToggle.js";
import { fetchWeatherByLocation } from "./api/weatherApi.js";
import { processWeather } from "./api/processWeather.js";
import { state, setState } from "./state/state.js";
import { render } from "./ui/render.js";

const topbar = document.querySelector(".topbar");

const searchBar = createSearchBar({ onSubmit: handleSearch });
const unitToggle = createUnitToggle({
  current: state.units,
  onChange: handleUnitChange,
});

topbar.replaceChildren(searchBar.element, unitToggle.element);

let searchToken = 0;

async function handleSearch(location) {
  const token = ++searchToken;
  setState({ loading: true, error: null });
  render();

  try {
    // Always fetch in metric — conversion happens at render time
    const raw = await fetchWeatherByLocation(location, "metric");
    if (token !== searchToken) return;
    const data = processWeather(raw);
    setState({ data, city: location, loading: false });
  } catch (err) {
    if (token !== searchToken) return;
    setState({ error: err.message, loading: false });
  }

  render();
}

function handleUnitChange(unit) {
  if (unit === state.units) return;
  setState({ units: unit });
  render(); // no refetch — temps convert client-side
}

handleSearch(state.city);
