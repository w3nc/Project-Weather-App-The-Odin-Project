export default class ToDo {
  constructor({
    title,
    description = "",
    dueDate = new Date().toISOString().split("T")[0],
    priority = "medium",
    notes = "",
    checkList = [],
  }) {
    if (!title) {
      throw new Error("Please input a title!");
    }

    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.priority = priority;
    this.notes = notes;

   
    this.checkList = Array.isArray(checkList)
      ? checkList.map((i) => ({
          id: i.id || crypto.randomUUID(),
          text: String(i.text ?? "").trim(),
          done: !!i.done,
        }))
      : [];

    this._id = crypto.randomUUID();
    this._checked = false;
  }

  get id() {
    return this._id;
  }

  get checked() {
    return this._checked;
  }

  get checklistProgress() {
    const total = this.checkList.length;
    const done = this.checkList.filter((i) => i.done).length;
    return { done, total };
  }

  toggleChecked() {
    this._checked = !this._checked;
  }

  addChecklistItem(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return null;
    const item = { id: crypto.randomUUID(), text: trimmed, done: false };
    this.checkList.push(item);
    return item;
  }

  removeChecklistItem(id) {
    this.checkList = this.checkList.filter((i) => i.id !== id);
  }

  toggleChecklistItem(id) {
    const item = this.checkList.find((i) => i.id === id);
    if (item) item.done = !item.done;
  }
}
