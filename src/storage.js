import Project from "./project.js";
import ToDo from "./todo.js";

const STORAGE_KEY = "odin-todo-app-data";

export function saveToLocalStorage(projects) {
  const dataToSave = projects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    isInbox: !!project.isInbox,
    todos: project.todos.map((todo) => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      dueDate: todo.dueDate,
      priority: todo.priority,
      notes: todo.notes,
      checkList: todo.checkList,
      checked: todo.checked,
    })),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

export function loadFromLocalStorage() {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) return null;

  try {
    const parsedData = JSON.parse(storedData);
    return parsedData.map((projectData) => {
      const project = new Project({
        title: projectData.title,
        description: projectData.description,
        isInbox: projectData.isInbox || false,
        id: projectData.id,
      });

      projectData.todos.forEach((todoData) => {
        const todo = new ToDo({
          title: todoData.title,
          description: todoData.description,
          dueDate: todoData.dueDate,
          priority: todoData.priority,
          notes: todoData.notes,
          checkList: todoData.checkList,
        });
        todo._id = todoData.id;
        todo._checked = todoData.checked;
        project.addTodo(todo);
      });

      return project;
    });
  } catch (error) {
    console.error("Failed to load data from localStorage:", error);
    return null;
  }
}

// handles migration from older data that had no inbox
export function ensureInbox(projects) {
  const existing = projects.find((p) => p.isInbox);
  if (existing) {
    return [existing, ...projects.filter((p) => p !== existing)];
  }
  const inbox = new Project({
    title: "Inbox",
    description: "Tasks without a project",
    isInbox: true,
  });
  return [inbox, ...projects];
}

const VIEW_KEY = "odin-todo-app-view";

export function writeView(view) {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify(view));
  } catch (e) {
    console.error("Failed to save view:", e);
  }
}

export function readView() {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to read view:", e);
    return null;
  }
}

/*  Expanded checklists persistence  */
const EXPANDED_KEY = "odin-todo-app-expanded-checklists";

export function readExpandedChecklists() {
  try {
    const raw = localStorage.getItem(EXPANDED_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeExpandedChecklists(ids) {
  try {
    const arr = Array.isArray(ids) ? ids : [...ids];
    localStorage.setItem(EXPANDED_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error("Failed to save expanded checklists:", e);
  }
}
