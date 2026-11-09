const STORAGE_KEY = "little-things-tasks";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const filterButtons = document.querySelectorAll(".filter-button");
const todayLabel = document.querySelector("#today-label");
const toast = document.querySelector("#toast");

let tasks = loadTasks();
let activeFilter = "all";
let toastTimeout;

todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(savedTasks)) return [];

    return savedTasks.filter(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean",
    );
  } catch (error) {
    console.error("Could not load saved tasks.", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Could not save tasks.", error);
    showToast("Your changes couldn’t be saved on this device.");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function getVisibleTasks() {
  if (activeFilter === "active") return tasks.filter((task) => !task.completed);
  if (activeFilter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
}

function render() {
  const visibleTasks = getVisibleTasks();
  const remaining = tasks.filter((task) => !task.completed).length;
  const completed = tasks.length - remaining;

  taskList.replaceChildren();
  for (const task of visibleTasks) {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " is-completed" : ""}`;

    const toggle = document.createElement("button");
    toggle.className = "task-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", task.completed ? `Mark ${task.text} as to do` : `Complete ${task.text}`);
    toggle.setAttribute("aria-pressed", String(task.completed));
    const check = document.createElement("span");
    check.setAttribute("aria-hidden", "true");
    check.textContent = "✓";
    toggle.append(check);
    toggle.addEventListener("click", () => toggleTask(task.id));

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete ${task.text}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => deleteTask(task.id));

    item.append(toggle, text, remove);
    taskList.append(item);
  }

  emptyState.hidden = visibleTasks.length > 0;
  if (tasks.length === 0) {
    emptyState.querySelector(".empty-title").textContent = "A little space to breathe.";
    emptyState.querySelector(".empty-copy").textContent = "Add a task above and take it one thing at a time.";
  } else if (visibleTasks.length === 0) {
    emptyState.querySelector(".empty-title").textContent =
      activeFilter === "active" ? "Nothing left on your list." : "No finished tasks just yet.";
    emptyState.querySelector(".empty-copy").textContent =
      activeFilter === "active" ? "You’re all caught up. Enjoy the breathing room." : "Complete a task and it’ll show up here.";
  }

  taskCount.textContent = `${remaining} ${remaining === 1 ? "thing" : "things"} left`;
  clearCompletedButton.hidden = completed === 0;
  clearCompletedButton.textContent = `Clear completed (${completed})`;
}

function addTask(text) {
  tasks.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    text,
    completed: false,
  });
  saveTasks();
  render();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task,
  );
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  addTask(text);
  input.value = "";
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

render();