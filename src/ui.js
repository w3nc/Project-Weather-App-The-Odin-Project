import { readExpandedChecklists } from "./storage.js";
import {
  format,
  isToday,
  isTomorrow,
  parseISO,
  isBefore,
  isAfter,
  endOfDay,
  addDays,
} from "date-fns";

function parseSafe(s) {
  if (!s) return null;
  try {
    const d = parseISO(s);
    return isNaN(d) ? null : d;
  } catch {
    return null;
  }
}

export default class UI {
  constructor() {
    this.projectListContainer = document.getElementById(
      "project-list-container",
    );
    this.emptyProjectsHint = document.getElementById("empty-projects-hint");
    this.mainContent = document.querySelector(".main-content .content-view");
    this.sidebarNav = document.querySelector(".sidebar-nav");
    this.sidebar = document.getElementById("sidebar");

    this.expandedChecklists = new Set(readExpandedChecklists());

    this.flashTodoId = null;
  }

 
  renderProjects(projects) {
    const visible = projects.filter((p) => !p.isInbox);
    this.projectListContainer.innerHTML = "";

    if (this.emptyProjectsHint) {
      this.emptyProjectsHint.classList.toggle("show", visible.length === 0);
    }

    visible.forEach((project) => {
      const li = document.createElement("li");
      li.className = "project-nav-item";

      const btn = document.createElement("button");
      btn.className = "nav-item";
      btn.type = "button";
      btn.setAttribute("data-project-id", project.id);
      btn.textContent = project.title;

      const del = document.createElement("button");
      del.className = "delete-project-btn";
      del.type = "button";
      del.setAttribute("data-project-id", project.id);
      del.setAttribute("aria-label", `Delete project ${project.title}`);
      del.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>';

      li.append(btn, del);
      this.projectListContainer.appendChild(li);
    });
  }

 
  updateBadges(projects) {
    const counts = { inbox: 0, all: 0, today: 0, upcoming: 0 };

    projects.forEach((p) => {
      p.todos.forEach((t) => {
        counts.all += 1;
        if (p.isInbox) counts.inbox += 1;
        if (this.isDueTodayOrPast(t)) counts.today += 1;
        if (this.isUpcoming(t)) counts.upcoming += 1;
      });
    });

    Object.entries(counts).forEach(([key, n]) => {
      const el = this.sidebarNav.querySelector(`[data-badge="${key}"]`);
      if (!el) return;
      el.textContent = String(n);
      el.hidden = n === 0;
    });
  }

  setActiveNav(view) {
    this.sidebarNav.querySelectorAll(".nav-item").forEach((i) => {
      i.classList.remove("active");
      i.removeAttribute("aria-current");
    });
    const sel =
      view.type === "project"
        ? `.nav-item[data-project-id="${view.projectId}"]`
        : `.nav-item[data-view="${view.type}"]`;
    const el = this.sidebarNav.querySelector(sel);
    if (el) {
      el.classList.add("active");
      el.setAttribute("aria-current", "page");
    }
  }

  //  Main content 
  renderTodos(projects, view) {
    this.mainContent.innerHTML = "";

    const header = document.createElement("header");
    header.className = "view-header";
    const h1 = document.createElement("h1");
    h1.className = "view-title";
    h1.textContent = this.viewTitle(view, projects);
    header.appendChild(h1);
    this.mainContent.appendChild(header);

    if (view.type === "search") {
      const bar = document.createElement("div");
      bar.className = "search-bar";
      const inp = document.createElement("input");
      inp.type = "search";
      inp.id = "search-input";
      inp.placeholder = "Search tasks…";
      inp.value = view.query || "";
      inp.setAttribute("aria-label", "Search tasks");
      bar.appendChild(inp);
      this.mainContent.appendChild(bar);

      const results = document.createElement("div");
      results.id = "search-results";
      this.mainContent.appendChild(results);
      this.renderSearchResults(projects, view.query || "");
      return;
    }

    if (view.type === "inbox") {
      const inbox = projects.find((p) => p.isInbox);
      if (!inbox || inbox.todos.length === 0) {
        const p = document.createElement("p");
        p.className = "empty-state";
        p.textContent = "Your inbox is clear. Nice work.";
        this.mainContent.appendChild(p);
        return;
      }
    }

    const groups = this.getVisibleGroups(projects, view);
    groups.forEach((g) => this.mainContent.appendChild(this.buildGroup(g)));

    if (
      groups.length === 0 &&
      (view.type === "today" || view.type === "upcoming")
    ) {
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent =
        view.type === "today"
          ? "Nothing due today. Enjoy the calm."
          : "Nothing coming up in the next 14 days.";
      this.mainContent.appendChild(p);
    }
  }

  renderSearchResults(projects, query) {
    const c = document.getElementById("search-results");
    if (!c) return;
    c.innerHTML = "";
    const groups = this.getVisibleGroups(projects, { type: "search", query });
    if (groups.length === 0) {
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent = query
        ? `No tasks match “${query}”.`
        : "Type to search your tasks.";
      c.appendChild(p);
      return;
    }
    groups.forEach((g) => c.appendChild(this.buildGroup(g)));
  }

  viewTitle(view, projects) {
    switch (view.type) {
      case "all":
        return "All Tasks";
      case "inbox":
        return "Inbox";
      case "today":
        return "Today";
      case "upcoming":
        return "Upcoming";
      case "search":
        return "Search";
      case "project":
        return (
          projects.find((p) => p.id === view.projectId)?.title || "Project"
        );
      default:
        return "Tasks";
    }
  }

  getVisibleGroups(projects, view) {
    switch (view.type) {
      case "all":
        return projects.map((p) => ({
          projectId: p.id,
          title: p.title,
          todos: p.todos,
        }));

      case "inbox": {
        const inbox = projects.find((p) => p.isInbox);
        return inbox
          ? [
              {
                projectId: inbox.id,
                title: "Inbox",
                todos: this.sortByDate(inbox.todos),
              },
            ]
          : [];
      }

      case "project": {
        const p = projects.find((x) => x.id === view.projectId);
        return p ? [{ projectId: p.id, title: p.title, todos: p.todos }] : [];
      }

      case "today":
        return projects
          .map((p) => ({
            projectId: p.id,
            title: p.title,
            todos: this.sortByDate(
              p.todos.filter((t) => this.isDueTodayOrPast(t)),
            ),
          }))
          .filter((g) => g.todos.length);

      case "upcoming":
        return projects
          .map((p) => ({
            projectId: p.id,
            title: p.title,
            todos: this.sortByDate(p.todos.filter((t) => this.isUpcoming(t))),
          }))
          .filter((g) => g.todos.length);

      case "search": {
        const q = (view.query || "").toLowerCase().trim();
        if (!q) return [];
        return projects
          .map((p) => ({
            projectId: p.id,
            title: p.title,
            todos: this.sortByDate(p.todos.filter((t) => this.matches(t, q))),
          }))
          .filter((g) => g.todos.length);
      }

      default:
        return [];
    }
  }

  buildGroup(g) {
    const group = document.createElement("div");
    group.className = "project-group";
    group.setAttribute("data-project-id", g.projectId);

    const h2 = document.createElement("h2");
    h2.className = "project-group-title";
    h2.textContent = g.title;
    group.appendChild(h2);

    const ul = document.createElement("ul");
    ul.className = "task-list";
    g.todos.forEach((t) => ul.appendChild(this.createTodoElement(t)));
    group.appendChild(ul);

    const addBtn = document.createElement("button");
    addBtn.className = "add-task-inline";
    addBtn.type = "button";
    addBtn.setAttribute("data-project-id", g.projectId);
    addBtn.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#icon-plus"></use></svg><span>Add task</span>`;
    group.appendChild(addBtn);

    return group;
  }

  createTodoElement(todo) {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.setAttribute("data-id", todo.id);
    if (todo.checked) li.classList.add("completed");

    const checkbox = document.createElement("button");
    checkbox.className = "todo-checkbox";
    checkbox.type = "button";
    checkbox.setAttribute("aria-label", "Mark complete");
    if (todo.checked) checkbox.classList.add("checked");

    const priorityDot = document.createElement("span");
    priorityDot.className = `priority-dot priority-${todo.priority}`;

    const titleSpan = document.createElement("span");
    titleSpan.className = "todo-title";
    titleSpan.textContent = todo.title;

    const timeEl = document.createElement("time");
    timeEl.className = "todo-due";
    timeEl.textContent = this.formatTodoDate(todo.dueDate);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.type = "button";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.innerHTML =
      '<svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>';

    const hasChecklist = todo.checkList && todo.checkList.length > 0;

    const rowChildren = [checkbox, priorityDot, titleSpan];

    if (hasChecklist) {
      const { done, total } = todo.checklistProgress;
      const pct = total ? Math.round((done / total) * 100) : 0;

      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "todo-checklist-toggle";
      if (done === total && total > 0) pill.classList.add("complete");

      if (todo.id === this.flashTodoId) {
        pill.classList.add("flash");
        this.flashTodoId = null;
      }

      pill.setAttribute("data-checklist-toggle", "");
      pill.setAttribute(
        "aria-label",
        `Checklist progress ${done} of ${total}. Click to expand.`,
      );
      pill.setAttribute("aria-expanded", "false");

      // Ring replaces the old icon
      const ring = document.createElement("span");
      ring.className = "checklist-ring";
      ring.style.setProperty("--progress", `${pct}%`);

      const count = document.createElement("span");
      count.className = "checklist-count";
      count.textContent = `${done}/${total}`;

      pill.append(ring, count);
      rowChildren.push(pill);
    }

    rowChildren.push(timeEl, deleteBtn);
    li.append(...rowChildren);

    // Inline checklist below the row
    if (hasChecklist) {
      const cl = document.createElement("ul");
      cl.className = "todo-checklist";
      if (this.expandedChecklists.has(todo.id)) {
        cl.classList.add("open");
        const pill = li.querySelector("[data-checklist-toggle]");
        if (pill) pill.setAttribute("aria-expanded", "true");
      }

      todo.checkList.forEach((item) => {
        const ci = document.createElement("li");
        ci.className = "todo-checklist-item";
        ci.setAttribute("data-id", item.id);
        if (item.done) ci.classList.add("done");

        const chk = document.createElement("button");
        chk.className = "todo-checklist-check";
        chk.type = "button";
        chk.setAttribute("aria-label", "Toggle checklist item");
        if (item.done) chk.classList.add("checked");

        const txt = document.createElement("span");
        txt.className = "todo-checklist-text";
        txt.textContent = item.text;

        ci.append(chk, txt);
        cl.appendChild(ci);
      });

      // Inline "Add item" row
      const addRow = document.createElement("li");
      addRow.className = "todo-checklist-add-row";

      const plus = document.createElement("span");
      plus.className = "todo-checklist-plus";
      plus.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#icon-plus"></use></svg>';

      const input = document.createElement("input");
      input.type = "text";
      input.className = "todo-checklist-add-input";
      input.placeholder = "Add item…";
      input.autocomplete = "off";
      input.setAttribute("aria-label", "Add checklist item");

      const btn = document.createElement("button");
      btn.className = "todo-checklist-add-btn";
      btn.type = "button";
      btn.setAttribute("data-checklist-add-btn", "");
      btn.setAttribute("aria-label", "Add item");
      btn.innerHTML =
        '<svg class="icon" aria-hidden="true"><use href="#icon-plus"></use></svg>';

      addRow.append(plus, input, btn);
      cl.appendChild(addRow);

      li.appendChild(cl);
    }

    return li;
  }

  //  date predicates 
  isDueTodayOrPast(t) {
    const d = parseSafe(t.dueDate);
    return d ? isBefore(d, endOfDay(new Date())) : false;
  }
  isUpcoming(t) {
    const d = parseSafe(t.dueDate);
    if (!d) return false;
    const now = new Date();
    return isAfter(d, endOfDay(now)) && !isAfter(d, endOfDay(addDays(now, 13)));
  }
  matches(t, q) {
    return [t.title, t.description, t.notes].some((s) =>
      (s || "").toLowerCase().includes(q),
    );
  }
  sortByDate(arr) {
    return arr.slice().sort((a, b) => {
      const da = parseSafe(a.dueDate),
        db = parseSafe(b.dueDate);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });
  }

  formatTodoDate(dueDate) {
    if (!dueDate) return "";
    try {
      const date = parseISO(dueDate);
      if (isToday(date)) return "Today";
      if (isTomorrow(date)) return "Tomorrow";
      return dueDate.includes("T")
        ? format(date, "MMM d, h:mm a")
        : format(date, "MMM d");
    } catch {
      return dueDate;
    }
  }
}
