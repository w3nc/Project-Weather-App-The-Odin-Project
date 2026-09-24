/**
 * Turn raw Visual Crossing JSON into a stable, app-friendly shape.
 * @param {object} raw
 * @returns {object}
 */
export function processWeather(raw) {
  const { resolvedAddress, currentConditions, days } = raw;

  return {
    location: {
      name: resolvedAddress,
      timezone: raw.timezone,
    },
    current: mapCurrent(currentConditions),
    todayHours: pickTodayHours(days[0]),
    daily: days.slice(0, 7).map(mapDay),
  };
}

/**
 * Build the "Today's Forecast" strip — 6 slots spread across the day.
 * Visual Crossing returns 24 hours; we pick indices for a 6-slot UI.
 */
function pickTodayHours(today) {
  if (!today?.hours?.length) return [];

  // 6, 9, 12, 15, 18, 21 (i.e. every 3 hours, matching the reference design)
  const wantedHours = [6, 9, 12, 15, 18, 21];

  return wantedHours
    .map((h) => today.hours[h])
    .filter(Boolean)
    .map((hour) => ({
      time: hour.datetime, // "06:00:00"
      temp: hour.temp,
      icon: hour.icon, // "clear-day" etc.
      condition: hour.conditions,
      precipProb: hour.precipprob ?? 0,
    }));
}

function mapCurrent(c) {
  return {
    temp: c.temp,
    feelsLike: c.feelslike,
    humidity: c.humidity,
    windSpeed: Math.round(c.windspeed),
    windDir: c.winddir,
    uvIndex: c.uvindex,
    precipProb: c.precipprob ?? 0,
    pressure: c.pressure,
    cloudCover: c.cloudcover,
    condition: c.conditions,
    icon: c.icon,
    datetime: c.datetime,
  };
}

function mapDay(day) {
  return {
    date: day.datetime, // "2024-05-28"
    epoch: day.datetimeEpoch,
    tempMax: day.tempmax,
    tempMin: day.tempmin,
    condition: day.conditions,
    icon: day.icon,
    precipProb: day.precipprob ?? 0,
    uvIndex: day.uvindex,
    windSpeed: Math.round(day.windspeed),
  };
}
