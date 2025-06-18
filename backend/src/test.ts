import express from 'express';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs/promises';

const app = express();
const port = process.env.PORT || 3000;

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

(async () => {
  // ✅ 1. Load credentials from file
  const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;

  // ✅ 2. Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    key.redirect_uris[0]
  );

  // ✅ 3. Redirect to Google's consent screen
  app.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
    });
    res.redirect(authUrl);
  });

  // ✅ 4. Handle redirect and token exchange
  app.get('/oauth2callback', async (req, res) => {
    try {
      const code = req.query.code as string;
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });

      res.send(`
        ✅ Authenticated as: ${profile.data.emailAddress}<br/>
        <pre>${JSON.stringify(tokens, null, 2)}</pre>
      `);
    } catch (err) {
      console.error('OAuth error:', err);
      res.status(500).send('OAuth failed.');
    }
  });

  // ✅ 5. Start server
  app.listen(port, () => {
    console.log(`🚀 OAuth server running at http://localhost:${port}`);
  });
})();
