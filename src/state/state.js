export const state = {
  city: "Madrid",
  units: "metric", // "metric" | "us"
  data: null, // processed weather object
  loading: false,
  error: null,
  suggestions: [],
  suggestionsLoading: false,
};

export function setState(patch) {
  Object.assign(state, patch);
}
