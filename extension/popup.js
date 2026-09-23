import { chooseWinner } from './experiment.js';
import { fetchUnreadEmails } from './gmail.js';

const views = Object.fromEntries(['loading', 'result', 'empty'].map(id => [id, document.querySelector(`#${id}`)]));
const scanButton = document.querySelector('#scan');
const copyButton = document.querySelector('#copy');
const status = document.querySelector('#status');
let currentCode = '';

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
    message.textContent = 'Click Copy to try again';
    message.classList.remove('fade');
  }
}

function displayWinner(winner) {
  currentCode = winner.candidate;
  document.querySelector('#code').textContent = currentCode;
  document.querySelector('#sender').textContent = winner.email.senderName || winner.email.senderEmail || 'Unknown sender';
  show('result');
  return copyCode();
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
copyButton.addEventListener('click', copyCode);
scan();
