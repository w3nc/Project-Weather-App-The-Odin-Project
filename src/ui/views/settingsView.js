import { state, setState } from "../../state/state.js";
import { saveSettings } from "../../utils/storage.js";

export function settingsView() {
  return `
    <div class="settings">
      <h1 class="settings-title">Settings</h1>
      <p class="settings-subtitle">Preferences are saved in your browser.</p>

      <form class="settings-form" id="settings-form">
        <div class="setting">
          <label for="setting-default-city">Default city</label>
          <p class="setting-hint">Loaded automatically when you open the app.</p>
          <input
            id="setting-default-city"
            name="defaultCity"
            type="text"
            value="${state.city ?? ""}"
            autocomplete="off"
          />
        </div>

        <fieldset class="setting setting-group">
          <legend>Time format</legend>
          <label class="setting-choice">
            <input type="radio" name="timeFormat" value="12h" ${state.timeFormat === "12h" ? "checked" : ""}/>
            <span>12-hour (6:00 PM)</span>
          </label>
          <label class="setting-choice">
            <input type="radio" name="timeFormat" value="24h" ${state.timeFormat === "24h" ? "checked" : ""}/>
            <span>24-hour (18:00)</span>
          </label>
        </fieldset>

        <div class="settings-actions">
          <button type="submit" class="btn btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  `;
}

export function bindSettingsForm(root, rerender, onApplied) {
  const form = root.querySelector("#settings-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const next = {
      defaultCity: (fd.get("defaultCity") || "").toString().trim() || "Madrid",
      units: state.units, // keep current
      timeFormat: fd.get("timeFormat") === "24h" ? "24h" : "12h",
      reduceMotion: state.reduceMotion, // keep current
    };

    setState({ ...next, city: next.defaultCity });
    saveSettings(next);
    onApplied?.();
    showToast("Settings saved.");
  });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}
