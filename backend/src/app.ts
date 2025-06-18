/**
 * This file sets up the express.js server, creating an API the front end can
 * call to access user information
 */

import express from "express";
import open from 'open';
import cors from "cors";
import { getCode } from "./format";
import { getAuthUrl, getClientFromCode, getEmails } from './main';


const app = express();  // Creates the app
app.use(cors({
  origin: '*', // or '*' for all origins
  methods: ['*'],
  allowedHeaders: ['*'], 
}));
app.use(express.json())

const port = process.env.PORT || 3001;


app.get('/auth', async (req, res) => {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
});


/**
 * Default landing page when user is not signed in
 */
app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).send("Missing auth code");
    return;
  }

  try {
    const client = await getClientFromCode(code);
    const emails = await getEmails(client);
    const codes = await getCode(emails)
    console.log(codes); // log the emails in the terminal
    res.send(codes);    // also send them in the browser
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving emails");
  }
});

/**
 * The path calls the getCode function, fetching the user's list
 * of recent emails and returning the most recent email's information
 */
// app.get("/get-code", async (req, res) => {
//   const token = req.headers['token']
//   console.log("[In app.ts] Received headers from frontend with value", req.headers)
//   console.log("[In app.ts] Received token from frontend with value", token)
//   const auth = await authorize(token);
//   // console.log("[In app.ts] Received auth, with authentication: ", auth[0])
//   console.log("[In app.ts] Received auth, with new token: ", auth[1])
//   const emails = await getEmails(auth[0]);
//   var codes = await getCode(emails);
//   codes[0].Token = auth[1];
//   console.log("[In app.ts] Codes[0] is: ", codes[0])

//   res.json(codes[0]);

// });


// app.listen(port, () => {
//   console.log(`Listening on port ${port}`);
// });

app.listen(port, () => {
  console.log(`Go to http://localhost:${port}/auth to authenticate`);
  open(`http://localhost:${port}/auth`);
});
