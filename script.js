// Simple anonymous wall using browser localStorage (no server).
// To make messages shared across all visitors, connect this to a real backend later.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ckzcugyesnrnifkpixaq.supabase.co'
const supabaseKey = 'sb_publishable_-jpXC38JuoUTnL5b8BbxHg_HsdIPzq6'

const supabase = createClient(supabaseUrl, supabaseKey)
const STORAGE_KEY = "acfw.messages.v1";

// Test Supabase connection
async function testConnection() {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .limit(1)

  console.log('Supabase connection test:', { data, error })
}

const form = document.getElementById("feedback-form");
const messageEl = document.getElementById("message");
const charCount = document.getElementById("char-count");
const wall = document.getElementById("wall");
const itemTpl = document.getElementById("item-template");
const searchEl = document.getElementById("search");
const sortEl = document.getElementById("sort");
const clearAllBtn = document.getElementById("clear-all");

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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageEl.value.trim();
  if (!text) return;

  state.push({
    id: uid(),
    text,
    likes: 0,
    createdAt: nowISO()
  });

  save(state);
  messageEl.value = "";
  charCount.textContent = "0 / 500";
  render();
});

messageEl.addEventListener("input", () => {
  charCount.textContent = `${messageEl.value.length} / 500`;
});

searchEl.addEventListener("input", render);
sortEl.addEventListener("change", render);

clearAllBtn.addEventListener("click", () => {
  if (confirm("This clears messages stored in your browser only. Continue?")) {
    state = [];
    save(state);
    render();
  }
});

// Initial paint
render();
testConnection();