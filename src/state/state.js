import { loadSettings } from "../utils/storage.js";

const persisted = loadSettings();

export const state = {
  route: "weather",
  city: persisted.defaultCity,
  units: persisted.units,
  timeFormat: persisted.timeFormat,
  reduceMotion: persisted.reduceMotion,
  data: null,
  loading: false,
  error: null,
};

export function setState(patch) {
  Object.assign(state, patch);
}
