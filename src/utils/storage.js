const KEY = "weather-app:settings";

const DEFAULTS = {
  defaultCity: "Madrid",
  units: "metric",
  timeFormat: "12h",
  reduceMotion: false,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("Could not save settings", err);
  }
}

export function clearSettings() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
