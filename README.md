# CodeFill 📨🔑

_A Chrome Extension to Automatically Fetch and Display Verification Codes from Your Emails_

---

## 📌 Overview

**CodeFill** is a lightweight, privacy-friendly, open-source Chrome extension that connects to your email accounts (Gmail, Outlook, more coming soon) and instantly fetches verification codes sent to your inbox — then displays them in a clean, dismissible popup UI. Ideal for 2FA, account logins, and any flow that sends a verification code via email.

---

## ✅ Features

- 🔐 **OAuth-based secure login** for Gmail & Outlook
- 📬 **Real-time scanning** of inbox for verification code emails
- 🔍 **Regex-based parsing** to extract codes (e.g., 4–8 digit sequences)
- 📤 **Popup notification** when a code is found (not background clipboard overwrite)
- 🧠 **Popup UI** includes:
  - Account source (e.g., Gmail/Outlook)
  - Email address
  - The extracted code
  - Copy button (`📋`) and close (`❌`) option
- 🧩 **Supports multiple accounts** (switch between multiple connected Gmail/Outlook accounts)
- ⚙️ **Lightweight polling** (efficient checking without background drains)
- 🚀 **Future-ready**: Yahoo, Apple Mail (IMAP) support planned
- 🆓 **Completely free** and **open-source** under the MIT License

---

## 🧱 Tech Stack

- Chrome Extensions (Manifest V3)
- JavaScript (ES6+), HTML, CSS
- Gmail API (OAuth 2.0)
- Microsoft Graph API (OAuth 2.0)
- Regex for code extraction
- Chrome Identity, Alarms, Notifications, Storage APIs

---

## 🛣️ Project Roadmap & Checkpoints

### ✅ Phase 1: Base Setup

- [x] Initialize Chrome Extension structure (manifest, popup, background)
- [x] Setup OAuth2 for Gmail using Chrome Identity API
- [x] Create basic popup UI

### ✅ Phase 2: Gmail Integration

- [x] Fetch emails from Gmail using API
- [x] Parse verification codes using regex
- [x] Display popup with code and copy button

### ✅ Phase 3: Outlook Integration

- [x] Microsoft OAuth2 setup via Microsoft Graph
- [x] Fetch emails from Outlook inbox
- [x] Parse and display codes similarly to Gmail

### 🔄 Phase 4: Account Handling

- [ ] Support multiple email accounts
- [ ] Display account info in popups
- [ ] Store tokens securely via chrome.storage

### 🔄 Phase 5: Optimization

- [ ] Efficient polling with `chrome.alarms`
- [ ] Debounce duplicate emails and prevent repeat notifications
- [ ] Optionally notify only on user interaction

### 🔄 Phase 6: Future Support (IMAP & More)

- [ ] Yahoo integration (via IMAP)
- [ ] Apple Mail/iCloud IMAP support
- [ ] Optional server-side push/webhook setup

---

## 🚀 Getting Started (Dev Setup)

1. Clone the repo:
   ```bash
   git clone https://github.com/yourusername/codefill.git
   ```
2. Go to Chrome > Extensions > Load unpacked

3. Load the codefill/ directory

4. Set up OAuth credentials for Gmail and Outlook

5. Start hacking!
