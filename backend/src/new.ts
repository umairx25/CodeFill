import express from 'express';
import open from 'open';
import cors from "cors";
import { getAuthUrl, getClientFromCode, getEmails } from './main';
import { getCode } from "./format";

const app = express();
const PORT = 3000;
app.use(cors({
    origin: '*', // or '*' for all origins
    methods: ['*'],
    allowedHeaders: ['*'],
}));
// app.use(express.json())

// Step 1: Redirect user to Google's OAuth 2.0 consent screen
app.get('/auth', async (req, res) => {
    const authUrl = getAuthUrl();
    res.redirect(authUrl);
});

app.get('/get-code', async (req, res) => {
    const token = String(req.headers['token'])

    if (!token) {
        open(`http://localhost:${PORT}/auth`);
    }

    else {
        const code = token

        try {
            const client = await getClientFromCode(code);
            const emails = await getEmails(client);
            const codes = await getCode(emails)
            codes[0].Token = code
            console.log(codes);     // log the emails in the terminal
            res.send(codes[0]);     // also send them in the browser, but need to somehow signal frontend new token has been made so it can store it
        } catch (err) {
            console.error(err);
            res.status(500).send("Error retrieving emails");
        }
    }

});

// Step 2: Google redirects to this route with a `code`
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
        console.log(codes);     // log the emails in the terminal
        codes[0].Token = code
        res.send(codes[0]);     // also send them in the browser, but need to somehow signal frontend new token has been made so it can store it
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving emails");
    }
});

// Launch the app
app.listen(PORT, () => {
    console.log(`Go to http://localhost:${PORT}/auth to authenticate`);
    open(`http://localhost:${PORT}/auth`);
});
