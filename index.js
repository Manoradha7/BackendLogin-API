//import required packages

import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import bodyParser from "body-parser";
import cors from 'cors';
import { UserRouter } from "./users.js";

//create a express app and name it as app
const app = express();

dotenv.config();
//Middleware
app.use(bodyParser.urlencoded({extended: true,}));
app.use(cors());
app.use(bodyParser.json());

app.use('/users',UserRouter);

//server configuration
const PORT = process.env.PORT;
//MongoDB Url
// const MONGO_URL = `mongodb://localhost`;

const MONGO_URL =  process.env.MONGO_URL;
//create connection to the MongoDB
async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("MongoDB has Started");
  return client;
}
//Make client as globally available for connect to the DataBase
export const client = await createConnection();


//Make server listen the port
app.listen(PORT, console.log("App is running in PORT :", PORT));

//create a home route path for the app
app.get("/", (req, res) => {
  res.send(" Password change Api");
});
