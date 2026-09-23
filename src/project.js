import ToDo from "./todo.js";

export default class Project {
  constructor({ title, description = "", isInbox = false, id = null } = {}) {
    this._id = id || crypto.randomUUID();
    this.title = title;
    this.description = description;
    this.isInbox = !!isInbox;
    this.todos = [];
  }

  get id() {
    return this._id;
  }

  addTodo(todo) {
    this.todos.push(todo);
  }

  removeTodo(todoId) {
    this.todos = this.todos.filter((todo) => todo.id !== todoId);
  }
}
