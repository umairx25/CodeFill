import { google} from "googleapis";
require('dotenv').config()
import { OAuth2Client } from "google-auth-library";
import quotedPrintable from "quoted-printable";

// OAuth scopes
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export interface Email {
  From: string;
  To: string;
  Time: string;
  Subject: string;
  Body: string;
  Code?: string;
  Token?: any;
}

export interface DayDate {
  days: number;
  hours: number;
  minutes: number;
}

// Replace with your values from Google Console
export const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
export const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URIS!;

// OAuth2 client
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// 🔐 Step 1: Generate auth URL
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

// 🔁 Step 2: Exchange `code` for tokens
export async function getClientFromCode(code: string): Promise<OAuth2Client> {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

// 📬 Get latest emails using authorized client
export async function getEmails(auth: OAuth2Client): Promise<Email[]> {
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.list({ userId: "me", maxResults: 10 });
  const messages = res.data.messages || [];

  const emailData: Email[] = [];

  for (const message of messages) {
    if (!message.id) continue;

    const msg = await gmail.users.messages.get({ userId: "me", id: message.id });
    const payload = msg.data.payload;

    if (!payload) continue;

    const headers = payload.headers || [];
    const parts = payload.parts || [];

    const from = headers.find((h) => h.name === "From")?.value || "";
    const to = headers.find((h) => h.name === "To")?.value || "";
    const date = headers.find((h) => h.name === "Date")?.value || "";
    const subject = headers.find((h) => h.name === "Subject")?.value || "";

    for (const part of parts) {
      if (part.mimeType === "text/plain") {
        const plainData = part.body?.data;
        if (!plainData) continue;

        const buffer = Buffer.from(plainData, "base64");
        const body = quotedPrintable.decode(buffer.toString("utf-8"));

        emailData.push({
          From: from,
          To: to,
          Time: date,
          Subject: subject,
          Body: body,
        });
      }
    }
  }

  return emailData;
}

