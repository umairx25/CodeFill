/**
 * This file sets up the express.js server, creating an API the front end can
 * call to access user information
 */

import express from "express";
import cors from "cors";
import { getCode } from "./format";
import { authorize, getEmails } from "./main";


const app = express();  // Creates the app
app.use(cors());        // Allows cors policy
const port = 3001;

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
app.get("/signin", async (req, res) => {
  const auth = await authorize();
  const emails = await getEmails(auth);

  // res.send(codes)

});


/**
 * The path calls the getCode function, fetching the user's list
 * of recent emails and returning the most recent email's information
 */
app.get("/get-code", async (req, res) => {
  const auth = await authorize();
  const emails = await getEmails(auth);
  const codes = await getCode(emails);

  res.json(codes[0])

});

// app.post()

//Print statement for dev
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
