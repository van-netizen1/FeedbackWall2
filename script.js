// Simple anonymous wall using browser localStorage (no server).
// To make messages shared across all visitors, connect this to a real backend later.
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { create } from 'zustand'
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
const adminForm = document.getElementById("admin-form");
const adminCode = document.getElementById("admin-code");
const adminStatus = document.getElementById("admin-status");
const adminPanel = document.getElementById("admin-panel");
const adminWall = document.getElementById("admin-wall");
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
    ? "Admin access granted. Showing shared feedback from the database."
    : "Admin can log in to view all shared feedback from the database.";
  if (!loggedIn) {
    adminCode.value = "";
    adminWall.innerHTML = "";
  }
}

async function loadAdminFeedback() {
  if (!adminLoggedIn) return;

  adminStatus.textContent = "Loading admin feedback…";
  const { data, error } = await supabase
    .from("feedback")
    .select("id, text, likes, createdAt")
    .order("createdAt", { ascending: false });

  if (error) {
    adminStatus.textContent = `Unable to fetch admin feedback: ${error.message}`;
    adminWall.innerHTML = "";
    return;
  }

  adminStatus.textContent = `Admin view: ${data.length} feedback items loaded.`;
  adminWall.innerHTML = "";

  if (data.length === 0) {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `<p class="text" style="margin:0">No feedback found in the shared database.</p>`;
    adminWall.appendChild(li);
    return;
  }

  for (const item of data) {
    const li = itemTpl.content.cloneNode(true);
    li.querySelector(".time").textContent = formatTime(item.createdAt);
    li.querySelector(".text").textContent = item.text;
    li.querySelector(".like-count").textContent = String(item.likes || 0);
    li.querySelector(".delete").remove();
    li.querySelector(".like").remove();
    adminWall.appendChild(li);
  }
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = messageEl.value.trim();
  if (!text) return;

  const { data, error } = await supabase
    .from("feedback")
    .insert([
      {
        text: text,
        likes: 0,
        createdAt: new Date().toISOString()
      }
    ]);

  if (error) {
    console.error("Insert error:", error);
    alert(error.message);
    return;
  }

  messageEl.value = "";
  charCount.textContent = "0 / 500";

  console.log("Inserted:", data);
  alert("Feedback submitted!");
});

// Initial paint
render();
testConnection();