// async function fetch_code() {
//   const url = "http://localhost:3001/get-code";

//   try {
//     const res = await fetch(url, { method: "GET" });

//     const text = await res.text(); // read as plain text

//     if (!text) {
//       console.error("Empty response from server");
//       return null;
//     }

//     let data;

//     try {
//       data = JSON.parse(text); // parse manually
//     } catch (err) {
//       console.error("Invalid JSON:", text);
//       throw err; // or return null
//     }

//     console.log(data);
//     return data;

//   } catch (error) {
//     console.log('error', error);
//   }
// }

// fetch_code(); // note: don't log a Promise, just call it


const { MongoClient } = require("mongodb");
import dotenv from 'dotenv';
dotenv.config();

const username = process.env.MONGO_USERNAME;
const pwd = process.env.MONGO_PWD;
const cluster = process.env.MONGO_CLUSTER;

// Replace the following with your Atlas connection string                                                                                                                                        
const url = `mongodb+srv://${username}:${pwd}@${cluster}.mongodb.net/?retryWrites=true&w=majority`;

// Connect to your Atlas cluster
const client = new MongoClient(url);

async function run() {
    try {
        await client.connect();
        console.log("Successfully connected to Atlas");

        const db = client.db("Codefill");
        const col = db.collection("Auth_Tokens");

        const example = { "type": "aa", "client_id": "id", "client_secret": "sec", "refresh_token": "token" };

        const ins = await col.insertOne(example);

    } catch (err) {
        console.log(err);
    }
    finally {
        await client.close();
    }
}


export async function write_token(token: any) {
    
    try {
        await client.connect();
        console.log("Successfully connected to Atlas");

        const db = client.db("Codefill");
        const col = db.collection("Auth_Tokens");
        const insert = await col.insertOne(token);

    } catch (err) {
        console.log(err);
    }
    finally {
        await client.close();
    }
}

export async function read_token(email: string) {
    try {
        await client.connect();
        console.log("Successfully connected to Atlas");

        const db = client.db("Codefill");
        const col = db.collection("Auth_Tokens");
        const filter = { "user_id": email };
        const isFound = await col.findOne(filter); //returns null if nothing is found
        return isFound

    } catch (err) {
        console.log(err);
    }
    finally {
        await client.close();
    }
}

// run().catch(console.dir);

// const example = { "user_id": "sameer@gmail.com","type": "sameer", "client_id": "saaaaa", "client_secret": "sdergregte", "refresh_token": "tkn" };
// write_token(example)

async function main(){
    const found = await read_token("sameer@gmail.com")
    console.log(found)
}

main()
