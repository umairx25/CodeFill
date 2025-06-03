const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const quotedPrintable = require('quoted-printable');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}


/**
 * Gets the email's information. 
 *
 * @param String {info_type} The type of information required. Could be one of three types of requests: 
 * "From" (email from), "To" (email to), "Date" (email received at), "Subject" (email's subject)
 * @param payload Contains the payload information obtained from the http response
 */

function get_email_info(payload, info_type){
    const data = payload.headers.find(h => h.name === info_type).value;

    return data
}



/**
 * Gets the last ten emails from the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function getEmails(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 3
  });
  const emails = res.data.messages;

  for (const email of emails) {
    // Use msg to find other relevant info and structures
    
     const msg = await gmail.users.messages.get({
       userId: 'me',
       id: email.id
     });

    const payload = msg.data.payload;
    const parts = msg.data.payload.parts;
    // const parts = payload.parts || [];

    const from_email = get_email_info(payload, "From")
    const to_email = get_email_info(payload, "To")
    const time = get_email_info(payload, "Date")
    console.log(`From: ${from_email}\nInbox: ${to_email}\nTime: ${time}\n`)

    for (part of parts){
        if (part.mimeType === 'text/plain'){
            plainData = part.body.data
            const buffer = Buffer.from(plainData, 'base64');
            const decoded = quotedPrintable.decode(buffer.toString('utf-8'));
            console.log("Email body:\n",decoded);
            console.log("-------------------------------------------------------------------------------\n")
        }
    }

   }
}

authorize().then(getEmails).catch(console.error);