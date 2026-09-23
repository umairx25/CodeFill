// Self-contained: Chrome serializes this function into the active tab.
export async function fillOtp(code) {
  if (typeof code !== 'string' || !/^[a-z0-9 -]{4,12}$/i.test(code)) return false;
  const compact = /^\d{3}[- ]\d{3}$/.test(code) ? code.replace(/[- ]/g, '') : code;
  const roots = [];
  function visit(root) {
    roots.push(root);
    for (const element of root.querySelectorAll('*')) {
      if (element.shadowRoot) visit(element.shadowRoot);
      if (element.tagName === 'IFRAME') {
        try { if (element.contentDocument) visit(element.contentDocument); } catch { /* Inaccessible frame. */ }
      }
    }
  }
  visit(document);
  const usable = input => {
    const view = input.ownerDocument.defaultView;
    const style = view.getComputedStyle(input);
    return !input.disabled && !input.readOnly && !input.closest('[inert], [aria-hidden="true"]') &&
      ['text', 'tel', 'number', 'password', ''].includes(input.type) &&
      input.getClientRects().length > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
  };
  const hint = input => {
    const root = input.getRootNode();
    const labelled = (input.getAttribute('aria-labelledby') || '').split(/\s+/)
      .map(id => root.getElementById?.(id)?.textContent || '').join(' ');
    return [input.name, input.id, input.placeholder, input.getAttribute('aria-label'), labelled,
      ...Array.from(input.labels || [], label => label.textContent)].join(' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ');
  };
  const otp = /one[\s_-]*time|\botp\b|\b[2m]fa\b|(?:verification|authentication|authenticator|security|login|confirmation|verify)[\s_-]*(?:code|token|pin)|(?:code|pin)[\s_-]*(?:verification|authentication)|\b(?:sms|email)[\s_-]*code/i;
  const unrelated = /postal|zip|coupon|promo|discount|gift|credit|card|cvv|cvc|phone|username|search/i;
  const evidence = input => {
    if (unrelated.test(hint(input))) return 0;
    if (input.autocomplete === 'one-time-code') return 10;
    if (otp.test(hint(input))) return 8;
    const container = input.closest('fieldset, [role="group"], form') || input.parentElement;
    const context = container?.textContent?.slice(0, 2000) || '';
    return otp.test(context) && /code|pin|digit/i.test(hint(input)) ? 5 : 0;
  };
  const candidates = [];
  for (const root of roots) {
    const inputs = Array.from(root.querySelectorAll('input')).filter(usable);
    const grouped = new Set();
    for (const input of inputs) {
      if (input.maxLength === 1) {
        let container = input.parentElement;
        for (let depth = 0; container && depth < 5; depth++, container = container.parentElement) {
          const fields = Array.from(container.querySelectorAll('input')).filter(usable);
          if (fields.length > compact.length) break;
          if (fields.length !== compact.length || !fields.every(field => field.maxLength === 1)) continue;
          if (grouped.has(container)) break;
          grouped.add(container);
          const score = Math.max(...fields.map(evidence), otp.test(container.textContent || '') ? 5 : 0);
          if (score && fields.every(field => !unrelated.test(hint(field)))) candidates.push({ fields, value: compact, score });
          break;
        }
      } else {
        const score = evidence(input);
        let value = code;
        if (input.type === 'number' || input.inputMode === 'numeric' || input.maxLength === compact.length) value = compact;
        if (score && (input.maxLength < 1 || input.maxLength >= value.length) &&
          (input.type !== 'number' || /^\d+$/.test(value))) candidates.push({ fields: [input], value, score });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const winner = candidates[0];
  // Ambiguous forms and existing user input are safer to leave untouched.
  if (!winner || candidates[1]?.score === winner.score) return false;
  const { fields, value } = winner;
  if (fields.some(field => field.value !== '')) return false;
  const values = fields.length === 1 ? [value] : Array.from(value);
  const setValue = (field, next) => Object.getOwnPropertyDescriptor(
    field.ownerDocument.defaultView.HTMLInputElement.prototype, 'value').set.call(field, next);
  try {
    fields.forEach((field, index) => {
      setValue(field, values[index]);
      const Event = field.ownerDocument.defaultView.Event;
      field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    });
    // Allow controlled inputs to render before reporting success.
    await new Promise(resolve => setTimeout(resolve, 80));
    return fields.every((field, index) => field.isConnected && field.value === values[index]);
  } catch {
    return false;
  }
}
