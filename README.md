
# CodeFill

**CodeFill** is a one-click Chrome extension that fetches and auto-copies verification codes (like **OTPs** or **2FA** codes) directly from your **Gmail inbox**. Simply click on the extension, and your code is **automatically** copied to your clipboard. ``Coming soon to the Chrome Web Store!``

- ⏱️ **Saves ~6–7 seconds per login** by eliminating inbox digging
- 🔒 **Runs only on click**, no background scanning or polling


<!-- ## 🧠 Tech Stack

1. Click the CodeFill icon in your browser toolbar
2. On first use, you'll be prompted to sign in with your Gmail account (OAuth 2.0)
3. After login, clicking the icon will:
   - Trigger the backend to fetch your 5 most recent messages via the **Gmail API**
   - Parse email subjects + HTML bodies using pattern-matched code extractors (regex-based, customizable)
   - Display the most recent code in a popup
   - Auto-copy the code to your clipboard
   - Update the button text to “Copied!” (then back) -->

<!-- --- -->

## How it works



| Component      | Tech Used                          |
|----------------|------------------------------------|
| Frontend       | `HTML + CSS + JSS` is used to build the popup UI
| Gmail Access   | `https://mail.google.com/mail/u/0/feed/atom` to fetch email contents (must be signed in to Gmail on your browser)
| Code Extraction| Combination of `regex` and using neighbouring words to reduce false positives
| Clipboard      | Native `navigator.clipboard.writeText()`

<!-- --- -->

## Important Notes

- Please check [privacy.md](privacy.md) for privacy details.
- To reproduce locally, navigate to [extensions](chrome://extensions/) -> turn on developer mode -> click on `Load unpacked` -> select the `extension` directory.
- Contributions are welcome, especially the code extraction logic. Feel free to make a pull request!
- Feel free to reach out on [contact@uarham.me](mailto:contact@uarham.me) or open an issue for any questions or concerns.

---

## What's next

- Publish to the Chrome Web Store
- **Outlook inbox support** (via Microsoft Graph API)

