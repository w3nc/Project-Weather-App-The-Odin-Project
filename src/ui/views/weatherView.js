import { formatHour, formatDayName } from "../../utils/format.js";
import { displayTemp } from "../../utils/temperature.js";

export function weatherView(data, units) {
  const { location, current, todayHours, daily } = data;

  return `
    <div class="content-left">
      <section class="current">
        <div class="current-info">
          <h1 class="city-name">${location.name}</h1>
          <p>Chance of rain: <span>${current.precipProb}%</span></p>
        </div>
        <div class="current-temp">
          <h2>${displayTemp(current.temp, units)}°</h2>
        </div>
        <div class="current-icon" data-icon="${current.icon}"></div>
      </section>

      <section class="today-forecast">
        <h3 class="card-label">Today's forecast</h3>
        <div class="forecast-list">
          ${todayHours
            .map(
              (h) => `
              <div class="forecast-item">
                <span class="forecast-item">${formatHour(h.time)}</span>
                <div class="weather-icon" data-icon="${h.icon}"></div>
                <span class="forecast-temp">${displayTemp(h.temp, units)}°</span>
              </div>
            `,
            )
            .join("")}
        </div>
      </section>

      <section class="air-conditions">
        <h3 class="card-label">Air conditions</h3>
        <div class="conditions-grid">
          <div><span>Real Feel</span><strong>${displayTemp(current.feelsLike, units)}°</strong></div>
          <div><span>Wind</span><strong>${current.windSpeed} km/h</strong></div>
          <div><span>Chance of rain</span><strong>${current.precipProb}%</strong></div>
          <div><span>UV Index</span><strong>${current.uvIndex}</strong></div>
        </div>
      </section>
    </div>

    <section class="week-forecast">
      <h3 class="card-label">7-day forecast</h3>
      <ul class="week-list">
        ${daily
          .map(
            (d) => `
    <li class="week-item">
      <span class="week-day">${formatDayName(d.date)}</span>
      <div class="weather-icon" data-icon="${d.icon}"></div>
      <span class="week-condition">${d.condition}</span>
      <span class="week-temps">
        ${displayTemp(d.tempMax, units)}° / ${displayTemp(d.tempMin, units)}°
      </span>
    </li>
  `,
          )
          .join("")}
      </ul>
    </section>
  `;
}
