import { state } from "../../state/state.js";
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
        <div class="current-icon">
          <div class="weather-icon-big" data-icon="${current.icon}"></div>
        </div>
      </section>

      <section class="today-forecast">
        <h3 class="card-label">Today's forecast</h3>
        <div class="forecast-list">
         ${todayHours
           .map(
             (h) => `
    <div class="forecast-item">
      <span class="forecast-time">${formatHour(h.time, state.timeFormat)}</span>
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
    <div class="condition">
      <svg class="condition-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 14V3a2 2 0 1 1 4 0v11a4 4 0 1 1-4 0z"/>
        <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
      <div class="condition-text">
        <span class="condition-label">Real Feel</span>
        <span class="condition-value">${displayTemp(current.feelsLike, units)}°</span>
      </div>
    </div>

    <div class="condition">
      <svg class="condition-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 7h10a2 2 0 1 0-2-2"/>
        <path d="M2 12h13a2 2 0 1 1-2 2"/>
        <path d="M2 17h8"/>
      </svg>
      <div class="condition-text">
        <span class="condition-label">Wind</span>
        <span class="condition-value">${current.windSpeed} km/h</span>
      </div>
    </div>

    <div class="condition">
      <svg class="condition-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 2s5 6.5 5 10.5a5 5 0 1 1-10 0C5 8.5 10 2 10 2z"/>
      </svg>
      <div class="condition-text">
        <span class="condition-label">Chance of rain</span>
        <span class="condition-value">${current.precipProb}%</span>
      </div>
    </div>

    <div class="condition">
      <svg class="condition-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="10" cy="10" r="3.5"/>
        <line x1="10" y1="2" x2="10" y2="4"/>
        <line x1="10" y1="16" x2="10" y2="18"/>
        <line x1="2" y1="10" x2="4" y2="10"/>
        <line x1="16" y1="10" x2="18" y2="10"/>
        <line x1="4.5" y1="4.5" x2="6" y2="6"/>
        <line x1="14" y1="14" x2="15.5" y2="15.5"/>
        <line x1="4.5" y1="15.5" x2="6" y2="14"/>
        <line x1="14" y1="6" x2="15.5" y2="4.5"/>
      </svg>
      <div class="condition-text">
        <span class="condition-label">UV Index</span>
        <span class="condition-value">${current.uvIndex}</span>
      </div>
    </div>
  </div>
</section>
    </div>

    <section class="week-forecast">
      <h3 class="card-label">7-day forecast</h3>
      <ul class="week-list">
        ${daily
          .map(
            (d, i) => `
    <li class="week-item">
      <span class="week-day">${i === 0 ? "Today" : formatDayName(d.date)}</span>
      <div class="weather-icon" data-icon="${d.icon}"></div>
      <span class="week-condition">${d.condition}</span>
      <span class="week-temps">${displayTemp(d.tempMax, units)}° / ${displayTemp(d.tempMin, units)}°</span>
    </li>
  `,
          )
          .join("")}
      </ul>
    </section>
  `;
}
