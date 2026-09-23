import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { fillOtp } from '../extension/autofill.js';

const require = createRequire(join(process.env.CODEFILL_TEST_MODULES || '/tmp/codefill-validation', 'package.json'));
const { chromium } = require('playwright');
const root = fileURLToPath(new URL('../extension/', import.meta.url));
const server = createServer(async (req, res) => {
  try {
    const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'popup.html';
    if (name.includes('..')) throw new Error('Invalid path');
    const content = await readFile(join(root, name));
    res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(content);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
let passed = 0;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.CODEFILL_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const page = await browser.newPage();
  async function fill(code) {
    const session = await page.context().newCDPSession(page);
    try {
      const { frameTree } = await session.send('Page.getFrameTree');
      const { executionContextId } = await session.send('Page.createIsolatedWorld', { frameId: frameTree.frame.id, worldName: 'codefill-test' });
      const { result, exceptionDetails } = await session.send('Runtime.evaluate', {
        expression: `(${fillOtp.toString()})(${JSON.stringify(code)})`, contextId: executionContextId, awaitPromise: true, returnByValue: true,
      });
      if (exceptionDetails) throw new Error(exceptionDetails.text);
      return result.value;
    } finally { await session.detach(); }
  }
  async function check(name, html, expected, code = '012345') {
    await page.setContent(html);
    await page.evaluate(() => {
      window.submissions = 0;
      document.addEventListener('submit', event => { event.preventDefault(); window.submissions++; });
      document.addEventListener('click', () => { window.submissions++; });
      document.addEventListener('keydown', () => { window.submissions++; });
    });
    assert.equal(await fill(code), expected, name);
    assert.equal(await page.evaluate(() => window.submissions), 0, `${name}: no submit/click/key events`);
    passed++;
  }
  await check('autocomplete', '<form><input autocomplete="one-time-code"><button>Submit</button></form>', true);
  assert.equal(await page.locator('input').inputValue(), '012345');
  await check('camelCase name', '<input name="otpCode">', true);
  await check('label', '<label for="verify">Verification code</label><input id="verify">', true);
  await check('aria label', '<input aria-label="Security code" type="tel">', true);
  await check('numeric formatted code', '<input name="otp" inputmode="numeric" maxlength="6">', true, '123-456');
  assert.equal(await page.locator('input').inputValue(), '123456');
  await check('alphanumeric', '<input name="verificationCode">', true, 'A1B2C3');
  await check('split digits', '<fieldset><legend>Verification code</legend>' + '<input maxlength="1" inputmode="numeric">'.repeat(6) + '</fieldset>', true);
  assert.deepEqual(await page.locator('input').evaluateAll(nodes => nodes.map(node => node.value)), [...'012345']);
  await check('unrelated fields', '<input name="zip"><input name="couponCode"><input name="password" type="password">', false);
  await check('ambiguous', '<input name="otp"><input name="verificationCode">', false);
  await check('hidden', '<input name="otp" style="display:none">', false);
  await check('readonly', '<input name="otp" readonly>', false);
  await check('disabled', '<input name="otp" disabled>', false);
  await check('existing input', '<input name="otp" value="123">', false);
  assert.equal(await page.locator('input').inputValue(), '123');
  await check('wrong split length', '<fieldset><legend>Verification code</legend>' + '<input maxlength="1">'.repeat(4) + '</fieldset>', false);
  await check('numeric field rejects letters', '<input name="otp" type="number">', false, 'A1B2C3');
  await check('max length', '<input name="otp" maxlength="4">', false);
  await check('empty page', '<p>No verification form</p>', false);
  await check('reject unsafe argument', '<input name="otp">', false, '<script>');

  await page.setContent('<div id="host"></div>');
  await page.evaluate(() => document.querySelector('#host').attachShadow({ mode: 'open' }).innerHTML = '<input autocomplete="one-time-code">');
  assert.equal(await fill('123456'), true); passed++;
  await page.setContent('<iframe srcdoc="<input name=otp>"></iframe>');
  await page.frameLocator('iframe').locator('input').waitFor();
  assert.equal(await fill('123456'), true); passed++;

  // Actual React controlled input: native setter must bypass React's value tracker.
  await page.setContent('<div id="app"></div>');
  const modules = {};
  for (const [name, file] of Object.entries({ react: 'react/cjs/react.development.js', 'react-dom': 'react-dom/cjs/react-dom.development.js', 'react-dom/client': 'react-dom/cjs/react-dom-client.development.js', scheduler: 'scheduler/cjs/scheduler.development.js' })) {
    const [pkg, ...parts] = file.split('/');
    modules[name] = await readFile(join(dirname(require.resolve(`${pkg}/package.json`)), ...parts), 'utf8');
  }
  await page.evaluate(sources => {
    const cache = {};
    const load = name => {
      if (cache[name]) return cache[name].exports;
      const module = cache[name] = { exports: {} };
      new Function('require', 'module', 'exports', 'process', sources[name])(load, module, module.exports, { env: { NODE_ENV: 'development' } });
      return module.exports;
    };
    window.testLoad = load;
    const React = load('react');
    function App() {
      const [value, setValue] = React.useState('');
      return React.createElement('div', null,
        React.createElement('input', { autoComplete: 'one-time-code', value, onChange: event => setValue(event.target.value) }),
        React.createElement('output', null, value));
    }
    load('react-dom/client').createRoot(document.querySelector('#app')).render(React.createElement(App));
  }, modules);
  await page.locator('input').waitFor();
  assert.equal(await fill('012345'), true);
  assert.equal(await page.locator('output').textContent(), '012345'); passed++;

  await page.evaluate(() => {
    const React = window.testLoad('react');
    document.body.innerHTML = '<div id="split"></div>';
    function Split() {
      const [digits, setDigits] = React.useState(Array(6).fill(''));
      return React.createElement('fieldset', null,
        React.createElement('legend', null, 'Verification code'),
        ...digits.map((digit, index) => React.createElement('input', { key: index, maxLength: 1, value: digit,
          onChange: event => { const next = event.target.value; setDigits(previous => previous.map((value, i) => i === index ? next : value)); } })),
        React.createElement('output', null, digits.join('')));
    }
    window.testLoad('react-dom/client').createRoot(document.querySelector('#split')).render(React.createElement(Split));
  });
  await page.locator('input').first().waitFor();
  assert.equal(await fill('012345'), true);
  assert.equal(await page.locator('output').textContent(), '012345'); passed++;

  for (const binding of ['v-model', 'v-model.lazy']) {
    await page.setContent(`<div id="app"><input autocomplete="one-time-code" ${binding}="code"><output>{{code}}</output></div>`);
    await page.addScriptTag({ path: require.resolve('vue/dist/vue.global.js') });
    await page.evaluate(() => Vue.createApp({ data: () => ({ code: '' }) }).mount('#app'));
    assert.equal(await fill('012345'), true);
    assert.equal(await page.locator('output').textContent(), '012345'); passed++;
  }

  // Exercise the real popup with Chrome/Gmail boundaries mocked.
  const url = `http://127.0.0.1:${server.address().port}/popup.html`;
  async function popup(mode, filled, restricted = false) {
    const context = await browser.newContext();
    await context.addInitScript(({ mode, filled, restricted }) => {
      window.calls = { copied: [], injected: 0, saved: [] };
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => window.calls.copied.push(text) } });
      window.chrome = {
        tabs: { query: async () => [{ id: 1, url: 'https://example.com/verify' }] },
        storage: { local: { get: async () => ({ mode }), set: async value => window.calls.saved.push(value) } },
        scripting: { executeScript: async () => { window.calls.injected++; if (restricted) throw new Error('Restricted'); return [{ result: filled }]; } },
      };
    }, { mode, filled, restricted });
    await context.route('https://mail.google.com/**', route => route.fulfill({ contentType: 'application/xml', body: '<feed><entry><title>Your verification code is 012345</title><summary>Use this code to sign in. Expires in 5 minutes.</summary><author><name>Example</name></author></entry></feed>' }));
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 356, height: 360 });
    await popup.goto(url);
    await popup.waitForFunction(() => !document.querySelector('#result').hidden && !document.querySelector('#copy').disabled);
    return { context, popup };
  }
  for (const [mode, filled, restricted, copies, injections] of [['copy', true, false, 1, 0], ['autofill', true, false, 0, 1], ['autofill', false, false, 1, 1], ['autofill', false, true, 1, 1]]) {
    const { context, popup: ui } = await popup(mode, filled, restricted);
    const calls = await ui.evaluate(() => window.calls);
    assert.equal(calls.copied.length, copies);
    assert.equal(calls.injected, injections);
    assert.equal(await ui.locator('#copied').textContent(), copies ? 'Copied to clipboard' : 'Code filled — review before continuing');
    await ui.locator('#settings').click();
    assert.equal(await ui.evaluate(() => document.documentElement.scrollWidth <= 356), true);
    if (mode === 'autofill' && filled) await ui.screenshot({ path: '/tmp/codefill-settings.png' });
    await ui.locator('input[value=copy]').check();
    assert.equal(await ui.locator('input[name=mode]:checked').count(), 1);
    assert.equal(await ui.locator('input[value=autofill]').isChecked(), false);
    if (mode === 'autofill') {
      await ui.waitForFunction(() => window.calls.saved.length === 1);
      assert.deepEqual(await ui.evaluate(() => window.calls.saved), [{ mode: 'copy' }]);
    }
    await ui.keyboard.press('Escape');
    assert.equal(await ui.locator('#settings-panel').isVisible(), false);
    await context.close(); passed++;
  }
  process.stdout.write(`Passed ${passed} browser checks, including React, Vue, split fields, fallback, and settings.\n`);
} finally {
  await browser?.close();
  server.close();
}
