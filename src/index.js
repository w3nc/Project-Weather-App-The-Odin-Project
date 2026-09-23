import "./style.css";

import Project from "./project.js";
import ToDo from "./todo.js";
import UI from "./ui.js";
import Modal, { ConfirmDialog, ProjectModal } from "./modal.js";
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  writeView,
  readView,
  ensureInbox,
  writeExpandedChecklists,
} from "./storage.js";


const THEME_KEY = "odin-todo-app-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {}
}

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") || "light";
}

document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
  });
});


let projects = [];
const savedProjects = loadFromLocalStorage();

if (savedProjects) {
  projects = ensureInbox(savedProjects);
} else {
  const inbox = new Project({
    title: "Inbox",
    description: "Tasks without a project",
    isInbox: true,
  });
  inbox.addTodo(
    new ToDo({
      title: "Welcome! Try adding a task or creating a project.",
      dueDate: new Date().toISOString().split("T")[0],
      priority: "medium",
    }),
  );
  projects = [inbox];
}
saveToLocalStorage(projects);

const getInbox = () => projects.find((p) => p.isInbox);
const realProjects = () => projects.filter((p) => !p.isInbox);


function resolveSavedView(raw, list) {
  const fallback = { type: "inbox", projectId: null, query: "" };
  if (!raw || typeof raw !== "object") return fallback;
  const valid = ["all", "inbox", "today", "upcoming", "search", "project"];
  if (!valid.includes(raw.type)) return fallback;
  const query = typeof raw.query === "string" ? raw.query : "";
  if (raw.type === "project") {
    const pid = raw.projectId;
    if (!pid || !list.some((p) => p.id === pid)) return fallback;
    return { type: "project", projectId: pid, query: "" };
  }
  return { type: raw.type, projectId: null, query };
}

let currentView = resolveSavedView(readView(), projects);
function persistView() {
  writeView(currentView);
}

const ui = new UI();
const modal = new Modal();
const confirmDialog = new ConfirmDialog();
const projectModal = new ProjectModal();

function refreshUI() {
  ui.renderProjects(projects);
  ui.updateBadges(projects);
  ui.renderTodos(projects, currentView);
  ui.setActiveNav(currentView);
  persistView();
}
function saveAndRefresh() {
  saveToLocalStorage(projects);
  refreshUI();
}
refreshUI();

const sidebar = document.getElementById("sidebar");
const scrim = document.getElementById("sidebar-scrim");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");

function openDrawer() {
  sidebar.classList.add("open");
  scrim.classList.add("show");
}
function closeDrawer() {
  sidebar.classList.remove("open");
  scrim.classList.remove("show");
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.contains("open") ? closeDrawer() : openDrawer();
  });
}
if (scrim) scrim.addEventListener("click", closeDrawer);


document.addEventListener("click", (e) => {
  //  Delete a PROJECT
  const delProj = e.target.closest(".delete-project-btn");
  if (delProj) {
    const pid = delProj.dataset.projectId;
    const proj = projects.find((p) => p.id === pid);
    if (!proj || proj.isInbox) return;

    const n = proj.todos.length;
    const message = n
      ? `"${proj.title}" will be deleted. Its ${n} task${n !== 1 ? "s" : ""} will be moved to your Inbox.`
      : `"${proj.title}" will be deleted.`;

    confirmDialog
      .open({
        title: "Delete project?",
        message,
        confirmText: "Delete project",
        danger: true,
      })
      .then((ok) => {
        if (!ok) return;
        const inbox = getInbox();
        if (inbox) proj.todos.forEach((t) => inbox.addTodo(t));
        projects = projects.filter((p) => p.id !== pid);
        if (currentView.type === "project" && currentView.projectId === pid) {
          currentView = { type: "inbox", projectId: null, query: "" };
        }
        saveAndRefresh();
      });
    return;
  }

  // Delete a TODO
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn) {
    const todoId = deleteBtn.closest(".todo-item").dataset.id;
    projects.forEach((p) => p.removeTodo(todoId));
    ui.expandedChecklists.delete(todoId);
    writeExpandedChecklists(ui.expandedChecklists);
    saveAndRefresh();
    return;
  }

  //  Toggle main checkbox
  const checkbox = e.target.closest(".todo-checkbox");
  if (checkbox) {
    const todoId = checkbox.closest(".todo-item").dataset.id;
    projects.forEach((p) => {
      const t = p.todos.find((x) => x.id === todoId);
      if (t) t.toggleChecked();
    });
    saveAndRefresh();
    return;
  }

  
  const clToggle = e.target.closest("[data-checklist-toggle]");
  if (clToggle) {
    const todoItem = clToggle.closest(".todo-item");
    const list = todoItem.querySelector(".todo-checklist");
    const todoId = todoItem.dataset.id;
    if (!list) return;

    if (list.classList.contains("open")) {
      list.classList.remove("open");
      clToggle.setAttribute("aria-expanded", "false");
      ui.expandedChecklists.delete(todoId);
    } else {
      list.classList.add("open");
      clToggle.setAttribute("aria-expanded", "true");
      ui.expandedChecklists.add(todoId);
    }
    writeExpandedChecklists(ui.expandedChecklists);
    return;
  }

  
  const clItem = e.target.closest(".todo-checklist-item");
  if (clItem) {
    const todoId = clItem.closest(".todo-item").dataset.id;
    const itemId = clItem.dataset.id;
    projects.forEach((p) => {
      const t = p.todos.find((x) => x.id === todoId);
      if (t) t.toggleChecklistItem(itemId);
    });

    ui.flashTodoId = todoId;
    saveAndRefresh();
    return;
  }

 
  const clAddArea = e.target.closest(".todo-checklist-add-row");
  if (clAddArea) {
    const addBtn = e.target.closest("[data-checklist-add-btn]");
    if (addBtn) {
      const todoItem = clAddArea.closest(".todo-item");
      const input = clAddArea.querySelector(".todo-checklist-add-input");
      const text = input.value.trim();
      if (text) {
        const todoId = todoItem.dataset.id;
        projects.forEach((p) => {
          const t = p.todos.find((x) => x.id === todoId);
          if (t) t.addChecklistItem(text);
        });
        saveAndRefresh();
        // Refocus the freshly rendered input
        requestAnimationFrame(() => {
          const item = document.querySelector(
            `.todo-item[data-id="${todoId}"]`,
          );
          const inp = item?.querySelector(".todo-checklist-add-input");
          if (inp) inp.focus();
        });
      }
    }
    
    return;
  }

  //  Inline "Add task"
  const addInline = e.target.closest(".add-task-inline");
  if (addInline) {
    modal.open("add", { projectId: addInline.dataset.projectId }, projects);
    return;
  }

  // Global "Add task"
  const addGlobal = e.target.closest('[data-action="add-task-global"]');
  if (addGlobal) {
    const inbox = getInbox();
    const hasReal = realProjects().length > 0;
    modal.open(
      "add",
      hasReal
        ? { showChooser: true, projectId: inbox.id }
        : { projectId: inbox.id },
      projects,
    );
    closeDrawer();
    return;
  }

 
  const viewBtn = e.target.closest(".nav-item[data-view]");
  if (viewBtn) {
    const v = viewBtn.dataset.view;
    currentView =
      v === "search"
        ? { type: "search", projectId: null, query: currentView.query || "" }
        : { type: v, projectId: null, query: "" };
    refreshUI();
    if (v === "search") {
      const inp = document.getElementById("search-input");
      if (inp) inp.focus();
    }
    closeDrawer();
    return;
  }

  //  Project nav button
  const projBtn = e.target.closest(".nav-item[data-project-id]");
  if (projBtn) {
    currentView = {
      type: "project",
      projectId: projBtn.dataset.projectId,
      query: "",
    };
    refreshUI();
    closeDrawer();
    return;
  }

  //  Todo row 
  const todoItem = e.target.closest(".todo-item");
  if (todoItem) {
    const todoId = todoItem.dataset.id;
    let foundTodo = null,
      foundProject = null;
    projects.forEach((p) => {
      const t = p.todos.find((x) => x.id === todoId);
      if (t) {
        foundTodo = t;
        foundProject = p;
      }
    });
    if (foundTodo && foundProject) {
      modal.open(
        "edit",
        {
          id: foundTodo.id,
          projectId: foundProject.id,
          title: foundTodo.title,
          description: foundTodo.description,
          dueDate: foundTodo.dueDate,
          priority: foundTodo.priority,
          notes: foundTodo.notes,
          checkList: foundTodo.checkList, 
        },
        projects,
      );
    }
    return;
  }

  //  Add project
  const addProjectBtn = e.target.closest(".add-project-btn");
  if (addProjectBtn) {
    projectModal.open().then((data) => {
      if (!data) return;
      projects.push(new Project(data));
      saveAndRefresh();
    });
    return;
  }

  //  Collapse sidebar 
  if (e.target.closest("#collapse-sidebar-btn")) {
    document.querySelector(".sidebar").classList.toggle("collapsed");
    return;
  }
});


document.addEventListener("input", (e) => {
  if (e.target.id === "search-input") {
    currentView.query = e.target.value;
    persistView();
    ui.renderSearchResults(projects, currentView.query);
  }
});

document.addEventListener("keydown", (e) => {
  if (!e.target.classList.contains("todo-checklist-add-input")) return;
  if (e.key !== "Enter") return;
  e.preventDefault();

  const addRow = e.target.closest(".todo-checklist-add-row");
  const todoItem = addRow.closest(".todo-item");
  const text = e.target.value.trim();
  if (!text) return;

  const todoId = todoItem.dataset.id;
  projects.forEach((p) => {
    const t = p.todos.find((x) => x.id === todoId);
    if (t) t.addChecklistItem(text);
  });
  saveAndRefresh();
  requestAnimationFrame(() => {
    const item = document.querySelector(`.todo-item[data-id="${todoId}"]`);
    const inp = item?.querySelector(".todo-checklist-add-input");
    if (inp) inp.focus();
  });
});


modal.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = modal.getFormData();
  if (!fd.title) {
    alert("Please enter a title");
    return;
  }

  if (fd.id) {
    projects.forEach((p) => {
      const t = p.todos.find((x) => x.id === fd.id);
      if (t) {
        t.title = fd.title;
        t.description = fd.description;
        t.dueDate = fd.dueDate;
        t.priority = fd.priority;
        t.notes = fd.notes;
        t.checkList = fd.checkList; 
      }
    });
  } else {
    if (!fd.projectId) {
      alert("Error: No project selected");
      return;
    }
    const newTodo = new ToDo({
      title: fd.title,
      description: fd.description,
      dueDate: fd.dueDate,
      priority: fd.priority,
      notes: fd.notes,
      checkList: fd.checkList, // NEW
    });
    const project = projects.find((p) => p.id === fd.projectId);
    if (project) {
      project.addTodo(newTodo);
      if (["today", "upcoming", "search"].includes(currentView.type)) {
        currentView = { type: "project", projectId: project.id, query: "" };
      }
    }
  }
  modal.close();
  saveAndRefresh();
});
