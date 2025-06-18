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

export interface Email {
  From: string;
  To: string;
  Time: string;
  Subject: string;
  Body: string;
  Code?: string;
  Token?: any; //new
}

export interface DayDate {
  days: number;
  hours: number;
  minutes: number;
}

export interface Token {
  type: any;
  client_id: any;
  client_secret: any;
  refresh_token?: any;
};

const emails: Array<Email> = [];


// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
// const TOKEN_PATH = "token.json";
export const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist(content: string) {
  try {
    // const content = await fs.readFile(TOKEN_PATH, "utf8");
    console.log("[main.ts] Received content @loadsavedcred: ",content);
    const token = JSON.parse(content);
    console.log("Final return value is: ", google.auth.fromJSON(token));
    return google.auth.fromJSON(token);
  } catch (err) {
    console.log("Error at loadSavedCred (main.ts)")
    console.log(err);
    return null;
  }
}


/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
// async function saveCredentials(client: OAuth2Client) {
//   const content = await fs.readFile(CREDENTIALS_PATH);
//   const keys = JSON.parse(String(content));
//   const key = keys.installed || keys.web;
//   const payload = JSON.stringify({
//     type: "authorized_user",
//     client_id: key.client_id,
//     client_secret: key.client_secret,
//     refresh_token: client.credentials.refresh_token,
//   });

//   return payload;

//   // await fs.writeFile(TOKEN_PATH, payload);
// }

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

  // content.type = "authorized_user"
  // content.client_id= key.client_id,
  // content.client_secret= key.client_secret,
  // content.refresh_token= client.credentials.refresh_token

  // const payload = JSON.stringify({
  //   type: "authorized_user",
  //   client_id: key.client_id,
  //   client_secret: key.client_secret,
  //   refresh_token: client.credentials.refresh_token,
  // });

  return payload;

  // await fs.writeFile(TOKEN_PATH, payload);
}


/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize(content: any): Promise<any> {
  let client = await loadSavedCredentialsIfExist(content);
  console.log("[main.ts] Value of client in authorize is: ", client)

  if (client) {
    console.log("Client exists at authorize, client's value is: ", client);
    return [client, JSON.stringify(content)];
  }

  var client1 = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
    // port: 3001,
  });
  var token;
  if (client1.credentials) {
    token = await saveCredentials(client1);
    // console.log("Client1 created, with value:", client1);
    // console.log("Client1 created, token saved with value:", token);
  }

  return [client1, token];
}

// export async function authorize(content: any): Promise<[any, string]> {
//   const existing = await loadSavedCredentialsIfExist(content);

//   console.log("Existing Token is (main.ts)", existing)
//   if (existing) {
//     return [existing, content]; // token already exists
//   }

//   const client = await authenticate({
//     scopes: SCOPES,
//     keyfilePath: path.join(process.cwd(), "credentials.json"), // optional if already handled elsewhere
//   });

//   const token = await saveCredentials(content, client);

//   return [client, JSON.stringify(token)];
// }



/**
 * Gets the email's information.
 *
 * @param String {info_type} The type of information required. Could be one of three types of requests:
 * "From" (email from), "To" (email to), "Date" (email received at), "Subject" (email's subject)
 * @param payload Contains the payload information obtained from the http response
 */

function get_email_info(payload: gmail_v1.Schema$MessagePartHeader[], info_type: string,) {

  const header = payload.find((h) => h.name === info_type);
  return header?.value || "";
}

/**
 * Gets the last ten emails from the user's account. A request is made to authenticate
 * the user, and on success, the user's last ten emails are scanned. The function extracts
 * and returns key info such as the subject, sender, receiver, body, and subject as an Email 
 * interface object.
 */
export async function getEmails(auth: any): Promise<Email[]> {
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

export function signOut() {
  fs.unlink("token.json");
}
