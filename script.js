// Simple anonymous wall using browser localStorage only.
// Feedback is stored locally in the browser and shown only after admin login.
const STORAGE_KEY = "acfw.messages.v1";

const form = document.getElementById("feedback-form");
const messageEl = document.getElementById("message");
const charCount = document.getElementById("char-count");
const wall = document.getElementById("wall");
const itemTpl = document.getElementById("item-template");
const searchEl = document.getElementById("search");
const sortEl = document.getElementById("sort");
const clearAllBtn = document.getElementById("clear-all");
const adminForm = document.getElementById("admin-form");
const adminCode = document.getElementById("admin-code");
const adminStatus = document.getElementById("admin-status");
const adminPanel = document.getElementById("admin-panel");
const adminRefreshBtn = document.getElementById("admin-refresh");
const adminLogoutBtn = document.getElementById("admin-logout");

const ADMIN_PASSWORD = "PLSP2026";
let adminLoggedIn = false;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function nowISO() {
  return new Date().toISOString();
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

let state = load();

function setAdminMode(loggedIn) {
  adminLoggedIn = loggedIn;
  adminPanel.classList.toggle("admin-hidden", !loggedIn);
  adminStatus.textContent = loggedIn
    ? "Admin access granted. Showing shared feedback."
    : "Admin can log in to review feedback.";
  if (!loggedIn) {
    adminCode.value = "";
  }
  render();
}

function render() {
  const q = (searchEl.value || "").trim().toLowerCase();
  const sorted = [...state].sort((a, b) => {
    return sortEl.value === "oldest"
      ? a.createdAt.localeCompare(b.createdAt)
      : b.createdAt.localeCompare(a.createdAt);
  });

  const filtered = q
    ? sorted.filter(x => x.text.toLowerCase().includes(q))
    : sorted;

  wall.innerHTML = "";
  if (!adminLoggedIn) {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `<p class="text" style="margin:0">Feedback is private until an admin logs in.</p>`;
    wall.appendChild(li);
    return;
  }

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `<p class="text" style="margin:0">No feedback yet. Be the first to share something constructive.</p>`;
    wall.appendChild(li);
    return;
  }

  for (const item of filtered) {
    const li = itemTpl.content.cloneNode(true);
    li.querySelector(".time").textContent = formatTime(item.createdAt);
    li.querySelector(".text").textContent = item.text;
    li.querySelector(".like-count").textContent = String(item.likes || 0);

    const likeBtn = li.querySelector(".like");
    likeBtn.addEventListener("click", () => {
      item.likes = (item.likes || 0) + 1;
      save(state);
      render();
    });

    const delBtn = li.querySelector(".delete");
    delBtn.addEventListener("click", () => {
      state = state.filter(x => x.id !== item.id);
      save(state);
      render();
    });

    wall.appendChild(li);
  }
}

adminForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const code = adminCode.value.trim();
  if (code !== ADMIN_PASSWORD) {
    adminStatus.textContent = "Incorrect admin passcode.";
    return;
  }

  setAdminMode(true);
});

adminRefreshBtn.addEventListener("click", render);
adminLogoutBtn.addEventListener("click", () => setAdminMode(false));

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = messageEl.value.trim();
  if (!text) return;

  const inserted = {
    id: uid(),
    text,
    likes: 0,
    createdAt: nowISO(),
  };

  state.unshift(inserted);
  save(state);
  render();

  messageEl.value = "";
  charCount.textContent = "0 / 500";
  adminStatus.textContent = adminLoggedIn
    ? `Admin view: ${state.length} feedback items loaded.`
    : "Feedback submitted. Admin can log in to view it.";
});

clearAllBtn.addEventListener("click", () => {
  state = [];
  save(state);
  render();
});

// Initial paint
render();
