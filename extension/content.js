chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'CODEFILL_READ_VISIBLE') return;
  const visible = element => element && element.getClientRects().length > 0;
  const bodies = [...document.querySelectorAll('.a3s.aiL, [data-message-id] .a3s')].filter(visible);
  const body = bodies.at(-1)?.innerText?.trim() ?? '';
  const senders = [...document.querySelectorAll('.gD[email], [email].gD')].filter(visible);
  const sender = senders.at(-1);
  sendResponse({
    subject: document.querySelector('h2.hP')?.textContent?.trim() ?? '',
    body,
    senderName: sender?.getAttribute('name') || sender?.textContent?.trim() || '',
    senderEmail: sender?.getAttribute('email') || '',
  });
});
