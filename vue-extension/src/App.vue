<template>
  <div class="popup-wrapper">
    <header class="popup-header">
      <h1 class="logo">CodeFill</h1>
      <div class="icons">
        <button class="icon-button" @click="fetchCode" title="History">
          <i class="fas fa-clock"></i>
        </button>
        <button class="icon-button" title="Account">
          <i class="fas fa-user-circle"></i>
        </button>
      </div>
    </header>

    <div class="content">
      <div class="meta">
        <span class="from"> <strong>From: {{ from}}</strong></span>
        <span class="time">{{ time }}</span>
      </div>

      <div class="code">{{code}}</div>

      <button class="copy-button" @click="copyCode">
        {{ copied ? 'Copied!' : 'Copy Code' }}
      </button>
    </div>

    <footer class="popup-footer">
      <button class="refresh-button" @click="fetchCode" title="Refresh">
        <i class="fa-solid fa-arrow-rotate-right"></i> Refresh
      </button>

    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const copied = ref(false)
// const code = '145986'

function copyCode() {
  navigator.clipboard.writeText(code)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

const code = ref("N/A");
const time = ref(" ")
const from = ref(" ")
const loading = ref(false);
const error = ref(null);

async function fetchCode() {
  try {
    const res = await fetch("http://localhost:3001/get-code");
    const data = await res.json();
    console.log("Fetched codes:", data);

    code.value = data.Code ?? "No verification code found";
    time.value = data.Time ?? " ";
    from.value = data.From.split("<")[0].trim() ?? " ";
  } catch (err) {
    console.error("Error fetching:", err);
    code.value = "Error fetching code";
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap');

:global(html),
:global(body),
:global(#app) {
  width: 420px;
  height: 270px;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.popup-wrapper {
  font-family: 'Playfair Display', serif;
  background: #1e1e1e;
  color: #cfc6bd;
  padding: 1.5rem;
  width: 100%;
  height: 100%;
  max-width: 420px;
  max-height: 270px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
}

.icons {
  display: flex;
  gap: 0.75rem;
}

.icon-button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.2rem;
}

.content {
  text-align: center;
  margin-top: 1.5rem;
}

.meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.code {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.copy-button {
  background: linear-gradient(to right, #000, #444);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.3s;
}

.copy-button:hover {
  background: linear-gradient(to right, #111, #555);
}

.popup-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.refresh-button {
  background: none;
  border: none;
  color: inherit;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
</style>
