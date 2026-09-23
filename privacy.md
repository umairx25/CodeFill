# CodeFill Privacy Policy

Last updated: September 23, 2026

This policy describes how CodeFill version 0.3.1, provided in this repository’s `extension/` directory, handles information.

## What CodeFill accesses

CodeFill finds likely verification codes in Gmail and copies the selected code to your clipboard or, if you select Autofill code, attempts to fill a verification field in your active tab. A scan runs when you open the extension popup or click “Scan again.” It does not continuously scan or poll your inbox in the background.

During a scan, CodeFill may access:

- **Unread email information:** CodeFill requests Gmail’s unread-mail Atom feed for the first signed-in Gmail account (`/mail/u/0/`). The feed may return more than five entries; CodeFill parses the returned entries and uses the first five for code analysis. The fields it processes are email subjects, summaries, sender names, and sender email addresses.
- **An open Gmail message:** If your active tab is Gmail, CodeFill reads the displayed subject, the last visible message body, and the last visible sender’s name and email address. This message does not have to be unread.
- **Active-tab information:** CodeFill checks the active tab’s URL to determine whether it is Gmail and uses the tab identifier to request visible message content. In Autofill mode, it also checks the active tab before filling. It does not collect browsing history.
- **Verification fields on the active page:** In Autofill mode, CodeFill examines input attributes, labels, and nearby text to identify likely OTP fields. It can inspect accessible same-origin frames and open shadow roots. This inspection happens locally; page contents are not stored or sent to the developer.
- **Verification codes and surrounding text:** CodeFill analyzes the retrieved text locally to identify and rank likely codes, then displays the selected code and sender in its popup.

The extension’s Gmail content script loads on Gmail pages, but reads message content only when the popup requests a scan.

## How information is used and shared

Email analysis happens in your browser using local code. CodeFill does not send email content, sender information, or verification codes to the developer, a CodeFill server, an analytics service, an advertising service, or an external AI service. The current extension has no analytics, advertising, or tracking integrations and does not sell personal information.

CodeFill communicates directly with Gmail over HTTPS to retrieve the unread-mail feed. Your browser includes the existing Gmail session credentials with that request. CodeFill does not ask for your Gmail password, create a separate CodeFill account, or obtain and store OAuth tokens. Google receives and handles the Gmail request as part of its service.

## Autofill

Copy code is the default mode. You can choose either Copy code or Autofill code in the popup settings. In Autofill mode, CodeFill attempts to enter the selected code into an empty verification field or a group of single-character fields on the active page. The code then becomes available to that website and its scripts, subject to that website’s privacy practices.

CodeFill does not click submit buttons, press Enter, or call form submission methods. It sends input and change events so page frameworks can recognize the value. A website may independently react to these events by automatically verifying or submitting the code. If no suitable field is found, access is blocked, or filling cannot be confirmed, CodeFill attempts to copy the code instead.

## Clipboard access

In Copy mode, CodeFill attempts to copy the selected code automatically to your system clipboard. You can also click the Copy button beside the code to copy it again. In Autofill mode, copying is used as a fallback when filling is unsuccessful. This replaces the clipboard’s current contents. CodeFill writes to the clipboard; it does not read clipboard contents.

CodeFill does not automatically clear copied codes. Codes can remain available through your clipboard, clipboard history, or clipboard synchronization features according to your device settings. Other software with clipboard access may be able to read them.

## Local storage and retention

CodeFill does not save emails or codes to an extension database, browser local storage, or Chrome synchronized storage. Email data and scan results are held in memory while the popup is running. Only your selected Copy or Autofill preference is saved in Chrome’s local extension storage; it is not synchronized by CodeFill. Gmail feed requests use the browser’s `no-store` cache option.

## Permissions

CodeFill requests:

- **Access to `https://mail.google.com/*`:** To retrieve the Gmail unread-mail feed and read the visible Gmail message during a scan.
- **`activeTab`:** Temporary access to the tab where you invoke CodeFill, used to identify and fill verification fields.
- **`scripting`:** To run the local autofill routine in that tab.
- **`storage`:** To remember your Copy or Autofill preference locally.
- **`clipboardWrite`:** To copy the selected verification code to your clipboard.

## Contact

For privacy questions, contact [contact@uarham.me](mailto:contact@uarham.me).
