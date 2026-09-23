import {
  VISUAL_CROSSING_API_KEY,
  VISUAL_CROSSING_BASE,
  GEOCODING_BASE,
} from "./config.js";

/**
 * Fetch full weather data for a location string (city, zip, "lat,lon", etc.)
 * @param {string} location
 * @param {"metric" | "us"} unitGroup
 * @returns {Promise<object>} raw Visual Crossing response
 */
export async function fetchWeatherByLocation(location, unitGroup = "metric") {
  if (!location || typeof location !== "string") {
    throw new Error("fetchWeatherByLocation: location is required");
  }

  if (!VISUAL_CROSSING_API_KEY) {
    throw new Error("Missing WEATHER_API_KEY. Add it to your .env file.");
  }

  const url = new URL(
    `${VISUAL_CROSSING_BASE}/${encodeURIComponent(location)}`,
  );
  url.searchParams.set("unitGroup", unitGroup);
  url.searchParams.set("include", "current,days,hours");
  url.searchParams.set("contentType", "json");
  url.searchParams.set("key", VISUAL_CROSSING_API_KEY);

  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 400) {
      throw new Error(`Couldn't find "${location}". Try another city.`);
    }
    if (res.status === 401) {
      throw new Error("Invalid API key. Check your .env file.");
    }
    if (res.status === 429) {
      throw new Error("Rate limit reached. Try again in a minute.");
    }
    throw new Error(`Weather request failed (${res.status})`);
  }

  return res.json();
}

/**
 * Fetch weather by coordinates (used later by the Map view)
 * @param {number} lat
 * @param {number} lon
 * @param {"metric" | "us"} unitGroup
 */
export async function fetchWeatherByCoords(lat, lon, unitGroup = "metric") {
  const location = `${lat},${lon}`;
  return fetchWeatherByLocation(location, unitGroup);
}

/**
 * Fetch location suggestions for the dynamic search bar.
 * Uses Open-Meteo geocoding (no key required).
 * @param {string} query
 * @param {number} count
 * @returns {Promise<Array<{name: string, country: string, admin1: string, latitude: number, longitude: number}>>}
 */
export async function fetchLocationSuggestions(query, count = 5) {
  if (!query || query.trim().length < 2) return [];

  const url = new URL(GEOCODING_BASE);
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch location suggestions");

  const data = await res.json();
  return data.results ?? [];
}
