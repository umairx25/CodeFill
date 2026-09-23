import { fillOtp } from './autofill.js';
import { chooseWinner } from './experiment.js';
import { fetchUnreadEmails } from './gmail.js';

const views = Object.fromEntries(['loading', 'result', 'empty'].map(id => [id, document.querySelector(`#${id}`)]));
const scanButton = document.querySelector('#scan');
const copyButton = document.querySelector('#copy');
const status = document.querySelector('#status');
let currentCode = '';
let mode = 'copy';
let targetTab;
let applying = false;
const settingsButton = document.querySelector('#settings');
const settingsPanel = document.querySelector('#settings-panel');
const modeInputs = document.querySelectorAll('input[name=mode]');

function show(name) {
  for (const [key, element] of Object.entries(views)) element.hidden = key !== name;
}

async function copyCode() {
  if (!currentCode) return;
  try {
    await navigator.clipboard.writeText(currentCode);
    const message = document.querySelector('#copied');
    message.textContent = 'Copied to clipboard';
    message.classList.remove('fade');
    clearTimeout(copyCode.timer);
    copyCode.timer = setTimeout(() => message.classList.add('fade'), 1800);
  } catch {
    clearTimeout(copyCode.timer);
    const message = document.querySelector('#copied');
    message.textContent = 'Couldn’t copy. Try again';
    message.classList.remove('fade');
  }
}

async function displayWinner(winner) {
  currentCode = winner.candidate;
  document.querySelector('#code').textContent = currentCode;
  document.querySelector('#sender').textContent = winner.email.senderName || winner.email.senderEmail || 'Unknown sender';
  show('result');
  return applyCode();
}

async function readVisibleGmail() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith('https://mail.google.com/')) return null;
    const message = await chrome.tabs.sendMessage(tab.id, { type: 'CODEFILL_READ_VISIBLE' });
    if (!message?.body) return null;
    return { ...message, body: `${message.subject}\n${message.body}`, source: 'visible message' };
  } catch {
    return null;
  }
}

async function collectEmails() {
  const [visible, feed] = await Promise.allSettled([readVisibleGmail(), fetchUnreadEmails()]);
  const emails = [];
  if (visible.status === 'fulfilled' && visible.value) emails.push(visible.value);
  if (feed.status === 'fulfilled') {
    for (const email of feed.value.slice(0, 5)) {
      const body = `${email.subject}\n${email.summary}`;
      if (!emails.some(existing => existing.body === body)) emails.push({ ...email, body, source: 'Atom feed' });
    }
  }
  if (!emails.length && feed.status === 'rejected') throw feed.reason;
  return emails;
}

async function scan() {
  show('loading');
  clearTimeout(copyCode.timer);
  document.querySelector('#copied').textContent = '';
  scanButton.disabled = true;
  currentCode = '';
  status.textContent = 'Checking Gmail…';
  document.querySelector('#empty-title').textContent = 'No code found';
  document.querySelector('#empty-message').textContent = 'Open the message in Gmail or check your latest unread emails.';
  try {
    const emails = await collectEmails();
    const winners = emails.map((email, emailIndex) => {
      const result = chooseWinner(email.body);
      return result ? { ...result, email, emailIndex } : null;
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.emailIndex - b.emailIndex);
    if (!winners.length) return show('empty');
    await displayWinner(winners[0]);
  } catch (error) {
    document.querySelector('#empty-title').textContent = 'Couldn’t scan Gmail';
    document.querySelector('#empty-message').textContent = error.message || 'Open Gmail, then try again.';
    show('empty');
  } finally {
    scanButton.disabled = false;
  }
}

scanButton.addEventListener('click', scan);
copyButton.addEventListener('click', applyCode);

function renderMode() {
  for (const input of modeInputs) input.checked = input.value === mode;
  const label = mode === 'autofill' ? 'Autofill' : 'Copy';
  copyButton.querySelector('span').textContent = label;
  copyButton.setAttribute('aria-label', `${label} verification code`);
  copyButton.title = `${label} verification code`;
  document.querySelector('#copy-icon').hidden = mode !== 'copy';
  document.querySelector('#fill-icon').hidden = mode !== 'autofill';
}

async function applyCode() {
  if (!currentCode || applying) return;
  applying = true;
  copyButton.disabled = true;
  scanButton.disabled = true;
  for (const input of modeInputs) input.disabled = true;
  try {
    let filled = false;
    if (mode === 'autofill' && targetTab?.id) {
      try {
        const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (active?.id === targetTab.id && active.url === targetTab.url && /^https?:/.test(active.url)) {
          const results = await chrome.scripting.executeScript({
            target: { tabId: targetTab.id }, func: fillOtp, args: [currentCode],
          });
          filled = results.some(result => result.result === true);
        }
      } catch { /* Restricted pages and missing access fall back to copying. */ }
    }
    if (filled) {
      clearTimeout(copyCode.timer);
      const message = document.querySelector('#copied');
      message.textContent = 'Code filled — review before continuing';
      message.classList.remove('fade');
    } else {
      await copyCode();
    }
  } finally {
    applying = false;
    copyButton.disabled = false;
    scanButton.disabled = false;
    for (const input of modeInputs) input.disabled = false;
  }
}

function closeSettings() {
  settingsPanel.hidden = true;
  settingsButton.setAttribute('aria-expanded', 'false');
}
settingsButton.addEventListener('click', () => {
  settingsPanel.hidden = !settingsPanel.hidden;
  settingsButton.setAttribute('aria-expanded', String(!settingsPanel.hidden));
  if (!settingsPanel.hidden) settingsPanel.querySelector('input:checked').focus();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !settingsPanel.hidden) {
    event.preventDefault();
    closeSettings();
    settingsButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.settings-wrap')) closeSettings();
});
for (const input of modeInputs) input.addEventListener('change', async () => {
  mode = input.value;
  renderMode();
  try {
    await chrome.storage.local.set({ mode });
    document.querySelector('#settings-status').textContent = '';
  } catch {
    document.querySelector('#settings-status').textContent = 'Couldn’t save. This choice applies until the popup closes.';
  }
  await applyCode();
});

async function initialize() {
  scanButton.disabled = true;
  for (const input of modeInputs) input.disabled = true;
  const [saved, tabs] = await Promise.allSettled([
    chrome.storage.local.get('mode'),
    chrome.tabs.query({ active: true, currentWindow: true }),
  ]);
  if (saved.status === 'fulfilled' && saved.value.mode === 'autofill') mode = 'autofill';
  if (tabs.status === 'fulfilled') targetTab = tabs.value[0];
  renderMode();
  for (const input of modeInputs) input.disabled = false;
  await scan();
}
initialize();
