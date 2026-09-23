/**
 * Convert a Celsius value to the display unit and round it.
 * @param {number} celsius
 * @param {"metric" | "us"} units
 * @returns {number}
 */
export function displayTemp(celsius, units) {
  if (typeof celsius !== "number" || Number.isNaN(celsius)) return 0;
  if (units === "us") return Math.round((celsius * 9) / 5 + 32);
  return Math.round(celsius);
}

export function unitSymbol(units) {
  return units === "us" ? "°F" : "°C";
}
