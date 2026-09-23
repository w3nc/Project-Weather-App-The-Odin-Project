export default class Modal {
  constructor() {
    this.modal = document.getElementById("task-modal");
    this.form = document.getElementById("task-form");
    this.title = document.getElementById("modal-title");
    this.subtitle = document.getElementById("modal-subtitle");
    this.closeBtn = this.modal.querySelector(".modal-close");
    this.cancelBtn = this.modal.querySelector(".btn-cancel");

    this.chooser = document.getElementById("project-chooser");
    this.select = document.getElementById("project-select");

    this.fields = {
      id: document.getElementById("task-id"),
      projectId: document.getElementById("project-id"),
      title: document.getElementById("task-title"),
      description: document.getElementById("task-description"),
      dueDate: document.getElementById("task-due-date"),
      priority: document.getElementById("task-priority"),
      notes: document.getElementById("task-notes"),
    };

    // Checklist editor
    this.checklistEditor = document.getElementById("checklist-editor");
    this.checklistCountEl = document.getElementById("checklist-count");
    this.checklistInput = document.getElementById("checklist-input");
    this.checklistAddBtn = document.getElementById("checklist-add-btn");

    // Working copy 
    this._workingChecklist = [];

    this._chooserVisible = false;
    this.setupEventListeners();
    this.setupChecklistListeners();
  }

  setupEventListeners() {
    this.closeBtn.addEventListener("click", () => this.close());
    this.cancelBtn.addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) this.close();
    });
  }

  setupChecklistListeners() {
    this._bindDragAndDrop();

    if (!this.checklistEditor) return;

    // Add button
    this.checklistAddBtn.addEventListener("click", () =>
      this._addChecklistItem(),
    );

    this._draggingId = null;

    // Enter key in the add input
    this.checklistInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this._addChecklistItem();
      }
    });

    // Delegated
    this.checklistEditor.addEventListener("click", (e) => {
      const li = e.target.closest(".checklist-editor-item");
      if (!li) return;
      const id = li.dataset.id;
      const actionEl = e.target.closest("[data-action]");
      const action = actionEl ? actionEl.dataset.action : null;

      if (action === "toggle") {
        const item = this._workingChecklist.find((i) => i.id === id);
        if (item) item.done = !item.done;
        this._renderChecklist();
      } else if (action === "remove") {
        this._workingChecklist = this._workingChecklist.filter(
          (i) => i.id !== id,
        );
        this._renderChecklist();
      }
    });

   
    this.checklistEditor.addEventListener("input", (e) => {
      if (!e.target.classList.contains("checklist-editor-text")) return;
      const li = e.target.closest(".checklist-editor-item");
      if (!li) return;
      const item = this._workingChecklist.find((i) => i.id === li.dataset.id);
      if (item) item.text = e.target.value;
    });

    // Enter in a text field jumps to the add input for fast entry
    this.checklistEditor.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (!e.target.classList.contains("checklist-editor-text")) return;
      e.preventDefault();
      this.checklistInput.focus();
    });
  }

  _renderChecklist() {
    this.checklistEditor.innerHTML = "";

    if (this._workingChecklist.length === 0) {
      const empty = document.createElement("li");
      empty.className = "checklist-empty";
      empty.textContent = "No items yet. Add one below.";
      this.checklistEditor.appendChild(empty);
    } else {
      this._workingChecklist.forEach((item) => {
        const li = document.createElement("li");
        li.className = "checklist-editor-item";
        li.dataset.id = item.id;
        if (item.done) li.classList.add("done");

        // Drag handle
        const handle = document.createElement("span");
        handle.className = "checklist-drag-handle";
        handle.setAttribute("data-drag-handle", "");
        handle.setAttribute("draggable", "true");
        handle.setAttribute("aria-label", "Drag to reorder");
        handle.setAttribute("title", "Drag to reorder");
        handle.innerHTML =
          '<svg class="icon" aria-hidden="true"><use href="#icon-grip"></use></svg>';

        const check = document.createElement("button");
        check.className = "checklist-editor-check";
        check.type = "button";
        check.dataset.action = "toggle";
        check.setAttribute("aria-label", "Toggle item");
        if (item.done) check.classList.add("checked");

        const input = document.createElement("input");
        input.className = "checklist-editor-text";
        input.type = "text";
        input.value = item.text;
        input.placeholder = "Item…";
        input.autocomplete = "off";

        const remove = document.createElement("button");
        remove.className = "checklist-editor-remove";
        remove.type = "button";
        remove.dataset.action = "remove";
        remove.setAttribute("aria-label", "Remove item");
        remove.innerHTML =
          '<svg class="icon" aria-hidden="true"><use href="#icon-close"></use></svg>';

        li.append(handle, check, input, remove);
        this.checklistEditor.appendChild(li);
      });
    }

    this._updateChecklistCount();
  }

  _updateChecklistCount() {
    const total = this._workingChecklist.length;
    const done = this._workingChecklist.filter((i) => i.done).length;
    this.checklistCountEl.textContent = total ? `${done}/${total}` : "0";
  }

  _addChecklistItem() {
    const text = this.checklistInput.value.trim();
    if (!text) return;
    this._workingChecklist.push({
      id: crypto.randomUUID(),
      text,
      done: false,
    });
    this.checklistInput.value = "";
    this._renderChecklist();

    // Focus the newly added row's text input for fast entry
    const rows = this.checklistEditor.querySelectorAll(
      ".checklist-editor-item",
    );
    const last = rows[rows.length - 1];
    if (last) {
      const inp = last.querySelector(".checklist-editor-text");
      if (inp) {
        inp.focus();
        // Put the cursor at the end
        const len = inp.value.length;
        try {
          inp.setSelectionRange(len, len);
        } catch {}
      }
    }
  }

  populateProjectSelect(projects, selectedId) {
    this.select.innerHTML = "";
    projects.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.title;
      if (p.id === selectedId) opt.selected = true;
      this.select.appendChild(opt);
    });
    if (!selectedId && this.select.options.length)
      this.select.selectedIndex = 0;
  }

  open(mode = "add", data = null, projects = []) {
    this.form.reset();

    if (mode === "edit" && data) {
      this._chooserVisible = false;
      this.chooser.style.display = "none";
      this.title.textContent = "Edit Task";
      if (this.subtitle)
        this.subtitle.textContent = "Update the details below.";
      this.fields.id.value = data.id;
      this.fields.projectId.value = data.projectId || "";
      this.fields.title.value = data.title;
      this.fields.description.value = data.description || "";
      this.fields.dueDate.value = data.dueDate || "";
      this.fields.priority.value = data.priority || "medium";
      this.fields.notes.value = data.notes || "";

      // Load checklist into working copy
      this._workingChecklist = Array.isArray(data.checkList)
        ? data.checkList.map((i) => ({
            id: i.id || crypto.randomUUID(),
            text: i.text || "",
            done: !!i.done,
          }))
        : [];
    } else {
      this.title.textContent = "Add New Task";
      if (this.subtitle)
        this.subtitle.textContent = "Capture what needs doing.";
      this.fields.id.value = "";
      if (data?.showChooser) {
        this._chooserVisible = true;
        this.chooser.style.display = "block";
        this.fields.projectId.value = "";
        this.populateProjectSelect(projects, data.projectId || "");
      } else {
        this._chooserVisible = false;
        this.chooser.style.display = "none";
        this.fields.projectId.value = data?.projectId || "";
      }
      this._workingChecklist = [];
    }

    this.checklistInput.value = "";
    this._renderChecklist();

    this.modal.style.display = "flex";
    requestAnimationFrame(() => this.fields.title.focus());
  }

  close() {
    this.modal.style.display = "none";
    this.form.reset();
    this._workingChecklist = [];
    this.checklistInput.value = "";
  }

  isOpen() {
    return this.modal.style.display === "flex";
  }

  getFormData() {
    return {
      id: this.fields.id.value || null,
      projectId: this._chooserVisible
        ? this.select.value
        : this.fields.projectId.value,
      title: this.fields.title.value.trim(),
      description: this.fields.description.value.trim(),
      dueDate: this.fields.dueDate.value,
      priority: this.fields.priority.value,
      notes: this.fields.notes.value.trim(),
      checkList: this._workingChecklist
        .map((i) => ({
          id: i.id,
          text: (i.text || "").trim(),
          done: !!i.done,
        }))
        .filter((i) => i.text.length > 0),
    };
  }

  _bindDragAndDrop() {
    if (!this.checklistEditor) return;

    this.checklistEditor.addEventListener("dragstart", (e) => {
      const handle = e.target.closest("[data-drag-handle]");
      if (!handle) return;
      const li = handle.closest(".checklist-editor-item");
      if (!li) return;
      this._draggingId = li.dataset.id;
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", li.dataset.id);
    });

    this.checklistEditor.addEventListener("dragover", (e) => {
      if (!this._draggingId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const li = e.target.closest(".checklist-editor-item");
      if (!li || li.dataset.id === this._draggingId) return;

      // Clear previous indicators
      this.checklistEditor
        .querySelectorAll(".drop-before, .drop-after")
        .forEach((el) => el.classList.remove("drop-before", "drop-after"));

      const rect = li.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      li.classList.add(after ? "drop-after" : "drop-before");
    });

    this.checklistEditor.addEventListener("drop", (e) => {
      if (!this._draggingId) return;
      e.preventDefault();

      const targetLi = e.target.closest(".checklist-editor-item");
      if (!targetLi || targetLi.dataset.id === this._draggingId) {
        this._cleanupDrag();
        return;
      }

      const rect = targetLi.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;

      const fromIdx = this._workingChecklist.findIndex(
        (i) => i.id === this._draggingId,
      );
      if (fromIdx === -1) {
        this._cleanupDrag();
        return;
      }
      const [moved] = this._workingChecklist.splice(fromIdx, 1);

      let toIdx = this._workingChecklist.findIndex(
        (i) => i.id === targetLi.dataset.id,
      );
      if (toIdx === -1) {
        this._cleanupDrag();
        return;
      }
      if (after) toIdx += 1;
      this._workingChecklist.splice(toIdx, 0, moved);

      this._cleanupDrag();
      this._renderChecklist();
    });

    this.checklistEditor.addEventListener("dragend", () => {
      this._cleanupDrag();
    });
  }

  _cleanupDrag() {
    this._draggingId = null;
    this.checklistEditor
      .querySelectorAll(".dragging, .drop-before, .drop-after")
      .forEach((el) =>
        el.classList.remove("dragging", "drop-before", "drop-after"),
      );
  }
}

/*  Confirm dialog  */
export class ConfirmDialog {
  constructor() {
    this.el = document.getElementById("confirm-modal");
    this.titleEl = document.getElementById("confirm-title");
    this.msgEl = document.getElementById("confirm-message");
    this.okBtn = document.getElementById("confirm-ok");
    this.cancelBtn = document.getElementById("confirm-cancel");
    this.closeX = this.el.querySelector("[data-confirm-close]");
    this._resolve = null;
    this._bind();
  }
  _bind() {
    this.okBtn.addEventListener("click", () => this._settle(true));
    this.cancelBtn.addEventListener("click", () => this._settle(false));
    if (this.closeX)
      this.closeX.addEventListener("click", () => this._settle(false));
    this.el.addEventListener("click", (e) => {
      if (e.target === this.el) this._settle(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) this._settle(false);
    });
  }
  _settle(v) {
    if (this._resolve) {
      const r = this._resolve;
      this._resolve = null;
      r(v);
    }
    this.close();
  }
  open({
    title = "Are you sure?",
    message = "",
    confirmText = "Confirm",
    danger = true,
  } = {}) {
    this.titleEl.textContent = title;
    this.msgEl.textContent = message;
    this.okBtn.textContent = confirmText;
    this.okBtn.classList.toggle("btn-danger", danger);
    this.okBtn.classList.toggle("btn-submit", !danger);
    this.el.style.display = "flex";
    return new Promise((res) => {
      this._resolve = res;
    });
  }
  close() {
    this.el.style.display = "none";
  }
  isOpen() {
    return this.el.style.display === "flex";
  }
}

/*  New-project dialog  */
export class ProjectModal {
  constructor() {
    this.el = document.getElementById("project-modal");
    this.nameInput = this.el.querySelector("#project-name");
    this.descInput = this.el.querySelector("#project-desc");
    this.errorEl = this.el.querySelector("#project-error");
    this.closeBtn = this.el.querySelector(".modal-close");
    this.cancelBtn = this.el.querySelector(".btn-cancel");
    this.okBtn = this.el.querySelector(".btn-submit");
    this._resolve = null;
    this._bind();
  }

  _bind() {
    this.okBtn.addEventListener("click", () => this._submit());
    this.cancelBtn.addEventListener("click", () => this._settle(null));
    this.closeBtn.addEventListener("click", () => this._settle(null));
    this.el.addEventListener("click", (e) => {
      if (e.target === this.el) this._settle(null);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) this._settle(null);
    });
    this.nameInput.addEventListener("input", () => this._clearError());
  }

  _clearError() {
    this.errorEl.classList.remove("show");
    this.nameInput.classList.remove("invalid");
  }

  _submit() {
    const title = this.nameInput.value.trim();
    if (!title) {
      this.errorEl.textContent = "Project name is required.";
      this.errorEl.classList.add("show");
      this.nameInput.classList.add("invalid");
      this.nameInput.focus();
      return;
    }
    this._settle({ title, description: this.descInput.value.trim() });
  }

  _settle(value) {
    if (this._resolve) {
      const r = this._resolve;
      this._resolve = null;
      r(value);
    }
    this.close();
  }

  open() {
    if (this._resolve) this._settle(null);
    this.nameInput.value = "";
    this.descInput.value = "";
    this._clearError();
    this.el.style.display = "flex";
    requestAnimationFrame(() => this.nameInput.focus());
    return new Promise((res) => {
      this._resolve = res;
    });
  }

  close() {
    this.el.style.display = "none";
  }
  isOpen() {
    return this.el.style.display === "flex";
  }
}
