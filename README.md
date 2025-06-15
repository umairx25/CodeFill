# CodeFill

**CodeFill** is a one-click Chrome extension that fetches and auto-copies verification codes (like OTPs, 2FA codes, login tokens) directly from your **Gmail inbox**. No tab switching, no email hunting — just click, copy, done.

⏱️ **Saves ~6–7 seconds per login** by eliminating inbox digging  
🔒 **Runs only on click** — no background scanning or polling  
🧩 Built with **Vue 3** (popup UI) and **Node.js/Express** backend (Gmail OAuth + email parsing)

---

## 📦 [→ Chrome Web Store (mock)](https://chrome.google.com/webstore/detail/codefill/your-extension-id-here)

---

## ⚙️ How It Works

1. Click the CodeFill icon in your browser toolbar  
2. On first use, you'll be prompted to sign in with your Gmail account (OAuth 2.0)  
3. After login, clicking the icon will:
   - Trigger the backend to fetch your 5 most recent messages via the **Gmail API**
   - Parse email subjects + HTML bodies using pattern-matched code extractors (regex-based, customizable)
   - Display the most recent code in a popup
   - Auto-copy the code to your clipboard
   - Update the button text to “Copied!” (then back)

---

## 🧠 Tech Stack

| Component      | Tech Used                          |
|----------------|------------------------------------|
| Frontend       | `Vue 3 + Vite` (popup UI)  
| Backend        | `Express.js` w/ OAuth 2.0 flow  
| Email API      | `Google Gmail API` (`messages.list`, `messages.get`)  
| Auth Flow      | Secure OAuth redirect w/ refresh token handling  
| Clipboard      | Native `navigator.clipboard.writeText()`  
| Storage        | `chrome.storage.local` for token caching  

---

## 🔐 Privacy & Security

CodeFill is designed with privacy-first architecture:

- ✅ No background listeners — **runs only when clicked**
- ✅ No third-party libraries for tracking or analytics
- ✅ All email parsing happens **on the backend**, token-scoped per user
- ✅ You can revoke access anytime at [Google Account Permissions](https://myaccount.google.com/permissions)

---

## ❗ Troubleshooting

If you experience issues (e.g., code not showing or login failing):

1. Visit [Google Account Permissions](https://myaccount.google.com/permissions)
2. Revoke access for **CodeFill**
3. Click the extension icon again to reauthorize your Gmail account

---

## 🚧 Coming Soon

- 📨 **Outlook inbox support** (via Microsoft Graph API)  
- 👥 **Support for multiple email accounts**  

---

## 🧪 Development Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/codefill.git

# Install dependencies
cd vue-extension
npm install

# Run dev server for extension
npm run dev

# Test out on your browser (any Chromium browser is supported)
npm run build # to build the extension

#Go to chrome://extensions -> load unpacked -> vue-extension/dist

# Running the Backend (optional, if running locally)
cd backend/src
npm install
npx ts-node app.ts
```

---

## 💬 Feedback or Questions?

Open an issue or message me on [LinkedIn](https://linkedin.com/in/yourname) — happy to help.