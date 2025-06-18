// Key to look for the user's email in chrome local storage
const EMAIL_KEY = "userEmail";

/** Save the address */
async function saveEmail(email) {
  await chrome.storage.local.set({ [EMAIL_KEY]: email });
}

/** Fetch it later (undefined if never stored) */
async function loadEmail() {
  const obj = await chrome.storage.local.get(EMAIL_KEY);
  console.log(obj[EMAIL_KEY]);
  return obj[EMAIL_KEY];
}
