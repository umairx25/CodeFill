<template>
  <div class="popup-wrapper">
    <header class="popup-header">
      <h1 class="logo">CodeFill</h1>
      <div class="icons">
        <button class="icon-logoutbutton" @click="logOut" title="Logout">
          <i class="fas fa-user-circle"></i>
          <span class="label">Logout</span>
        </button>
      </div>
    </header>

    <div class="content">
      <div class="meta">
        <span class="from"> <strong>From: {{ from }}</strong></span>
        <span class="time">{{ time }}</span>
      </div>

      <div class="code">{{ code }}</div>

      <button class="copy-button" @click="copyCode">
        {{ copied ? 'Copied!' : 'Copy Code' }}
      </button>
    </div>

    <footer class="popup-footer">
      <div class="icons">
        <button class="refresh-button" @click="fetchCode()" title="Refresh">
          Refresh
        </button>
      </div>

    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const GOOGLE_CLIENT_ID = "628428485156-am6gqacvr5p1dm8nmhdioebdr2llid91.apps.googleusercontent.com"
const EXTENSION_ID = chrome.runtime.id;
const code = ref("Loading...");
const time = ref(" ")
const from = ref(" ")
const copied = ref(false)

/**
 * Copies the code received from the user's inbox directly to their clipboard 
 */
function copyCode() {
  navigator.clipboard.writeText(code.value);   
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}

/**
 * Logs user out of current session
 */
async function logOut() {
  hello('google').logout().then(function() {
    alert('Signed out');
  }, function(e) {
    alert('Signed out error: ' + e.error.message);
  });
}

/**
 * Based on the token retrieved from local storage, fetch appropriately formatted data
 * from the backend. 
 */
async function fetchCode() {
  window.hello.init({ google: GOOGLE_CLIENT_ID }, {
    redirect_uri: `https://${EXTENSION_ID}.chromiumapp.org/`,
    scope: 'email profile https://www.googleapis.com/auth/gmail.readonly'
  });

  let token = await getToken();

  if (!token) {
    // First-time login: show Google account picker
    await hello('google').login({
      scope: 'email profile https://www.googleapis.com/auth/gmail.readonly',
      prompt: 'select_account'  // allow user to choose a specific account
    });
    token = await getToken();
  }

  if (!token) {
    console.warn("Still no token after login.");
    return;
  }

  const res = await fetch("https://codefill.onrender.com/get-code", {
    headers: {
      'token': JSON.stringify(token)
    }
  });

  const data = await res.json();
  code.value = data.Code ?? "No verification code found";
  time.value = data.Time ?? " ";
  from.value = data.From.split("<")[0].trim() ?? " ";
  copyCode();
}


/**
 * Retrieves token from chrome local storage. Returns null if not found, and creates a
 * new token and returns if expired. Returns the existing token otherwise.
 */
async function getToken() {
  const obj = await chrome.storage.local.get("hello");

  const googleToken = obj.hello?.google;

  if (!googleToken) {
    console.warn("Token not found (first sign in)", googleToken);
    return null;
  }
  
  // Verification code has expired
  else if (Date.now() / 1000 >= googleToken.expires){
    await hello('google').login({ display: "none" }); 
    console.warn("Token expired:", googleToken);
    return await chrome.storage.local.get("hello").hello?.google;
  }

  console.log("Retrieved token:", googleToken);
  return googleToken;
}


onMounted(fetchCode());
</script>

<style scoped>

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

.icon-logoutbutton {
  display: inline-flex;       
  align-items: center;          
  gap: 0.5rem;                  
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
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
