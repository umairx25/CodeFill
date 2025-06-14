/**
 * This file sets up the express.js server, creating an API the front end can
 * call to access user information
 */

import express from "express";
import cors from "cors";
import { getCode } from "./otp";


const app = express();  // Creates the app
app.use(cors());        // Allows cors policy
const port = 3001;

/**
 * Default landing page
 */
app.get("/", (req, res) => {
  res.send("Hello World!");
});


/**
 * The path calls the getCode function, fetching the user's list
 * of recent emails and returning the most recent email's information
 */
app.get("/get-code", async (req, res) => {
  const info = await getCode();
  console.log(info);
  res.send(info[0]);
});

//Print statement for dev
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});


//fetch("https://localhost/get-code")
// -> Hello world  {"a": auhiqwei}
// var name = the return of api call.name