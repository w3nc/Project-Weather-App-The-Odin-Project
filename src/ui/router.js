import { state, setState } from "../state/state.js";
import { render } from "./render.js";

const navLinks = document.querySelectorAll("[data-route]");

export function initRouter() {
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const route = link.dataset.route;
      if (!route) return;
      navigate(route);
    });
  });
}

export function navigate(route) {
  setState({ route });
  updateActiveNav();
  render();
}

export function updateActiveNav() {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.route === state.route);
  });
}
