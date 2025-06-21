/**
 * This file sets up the express.js server, creating an API the front end can
 * call to access user information
 */

import express from "express";
import { google } from "googleapis";
import cors from "cors";
import { getCode } from "./format";
import { getEmails, REDIRECT_URI, CLIENT_SECRET, CLIENT_ID } from './main';


const app = express();  // Creates the app
app.use(cors({
  origin: '*', // or '*' for all origins
  methods: ['*'],
  allowedHeaders: ['*'],
}));
app.use(express.json())

const port = process.env.PORT || 3001;


/**
 * Default landing page when user is not signed in
 */
app.get("/", (req, res) => {
  res.send("Hello World!");
});


/**
 * The path calls the getCode function, fetching the user's list
 * of recent emails and returning the most recent email's information
 */
app.get("/get-code", async (req, res) => {
  const token = req.headers["token"];

  if (typeof token !== "string") {
    res.status(400).send("Invalid or missing token header");
    return;
  }

  const tokenObj = JSON.parse(token); 

  const authClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  authClient.setCredentials(tokenObj); // Directly set access_token, etc.

  const emails = await getEmails(authClient);
  const codes = await getCode(emails);

  res.json(codes[0]); // Send latest email w/code 
});


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
