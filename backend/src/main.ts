/**
 * This file authenticates the user using their gmail, and retrieves the necessary emails from their inbox
 */

import fs from "fs/promises";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import quotedPrintable from "quoted-printable";
import { error } from "console";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";

interface Email {
  From: string;
  To: string;
  Time: string;
  Subject: string;
  Body: string;
  Code?: string;
}

interface DayDate {
    days: number;
    hours: number;
    minutes: number;
}

const emails: Array<Email> = [];

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(String(content));
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
async function saveCredentials(client: OAuth2Client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(String(content));
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
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
async function authorize(): Promise<JSONClient | OAuth2Client> {
  let client = await loadSavedCredentialsIfExist();

  if (client) {
    return client;
  }

  var client1 = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
    // port: 3001,
  });
  if (client1.credentials) {
    await saveCredentials(client1);
  }

  return client1;
}

/**
 * Gets the email's information.
 *
 * @param String {info_type} The type of information required. Could be one of three types of requests:
 * "From" (email from), "To" (email to), "Date" (email received at), "Subject" (email's subject)
 * @param payload Contains the payload information obtained from the http response
 */

function get_email_info( payload: gmail_v1.Schema$MessagePartHeader[],info_type: string,) {
  
  const header = payload.find((h) => h.name === info_type);
  return header?.value || "";
}

/**
 * Gets the last ten emails from the user's account. A request is made to authenticate
 * the user, and on success, the user's last ten emails are scanned. The function extracts
 * and returns key info such as the subject, sender, receiver, body, and subject as an Email 
 * interface object.
 */
async function getEmails(auth: any): Promise<Email[]> {
  const email_data: Email[] = [];
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10
  });

  const emails = res.data.messages;
  if (!emails || emails.length === 0) {
    throw new Error("No emails returned from Gmail API.");
  }

  for (const email of emails) {
    if (!email.id) {
      console.warn("Skipping message with missing ID.");
      continue;
    }

    const msg = await gmail.users.messages.get({
      userId: "me",
      id: email.id,
    });

    const payload = msg.data.payload;
    if (!payload) {
      console.warn(
        `Skipping email with ID ${email.id} due to missing payload.`,
      );
      continue;
    }

    const headers = payload.headers || [];
    const parts = payload.parts || [];

    const from_email = get_email_info(headers, "From");
    const to_email = get_email_info(headers, "To");
    const time = get_email_info(headers, "Date");
    const subject = get_email_info(headers, "Subject");

    for (const part of parts) {
      if (part.mimeType === "text/plain") {
        const plainData = part.body?.data;
        if (!plainData) continue;

        const buffer = Buffer.from(plainData, "base64");
        const email_body = quotedPrintable.decode(buffer.toString("utf-8"));

        const curr_email_info: Email = {
          From: from_email,
          To: to_email,
          Time: time,
          Subject: subject,
          Body: email_body,
        };

        email_data.push(curr_email_info);
      }
    }
  }

  return email_data;
}

function signOut(){
    fs.unlink("token.json");
}

export { Email, authorize, getEmails, signOut, DayDate };