/**
 * This file sets up the express.js server, creating an API the front end can
 * call to access user information
 */

import express from "express";
import cors from "cors";
import { getCode } from "./format";
import { authorize, getEmails, Token } from "./main";


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
  const token = req.headers['token']
  console.log("[In app.ts] Received headers from frontend with value", req.headers)
  console.log("[In app.ts] Received token from frontend with value", token)
  const auth = await authorize(token);
  // console.log("[In app.ts] Received auth, with authentication: ", auth[0])
  console.log("[In app.ts] Received auth, with new token: ", auth[1])
  const emails = await getEmails(auth[0]);
  var codes = await getCode(emails);
  codes[0].Token = auth[1];
  console.log("[In app.ts] Codes[0] is: ", codes[0])

  res.json(codes[0]) //
  res.sendStatus(200);

});


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
