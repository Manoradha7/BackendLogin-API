// importing required packages
import express, { response } from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import {
  genPassword,
  passwordUpdate,
  createUser,
  getUser,
  updateuser,
} from "./helper.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
  
// creating new express app and save it as app
const app = express();

// Middleware
dotenv.config();
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// server configuration
const PORT = process.env.PORT;

const MONGO_URL = process.env.MONGO_URL;

async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("Mongodb is Started");
  return client;
}
export const client = await createConnection();

// Make the server listen to the port
app.listen(PORT, console.log("App is Running in Port Number : "+ PORT));

// creating Home route path for the app
app.get("/", async (req, res) => {
  res.send("Passwod reset flow");
});

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const data = await getUser(email);

  if (data) {
    return res.status(400).send({ Message: "Email id is aldready exist" });
  }

  if (password.length < 8) {
    return res.status(400).send({ Message: "Password must be longer" });
  }
  const hashedPassword = await genPassword(password);

  const createUserData = await createUser(name, email, hashedPassword);
  console.log(createUserData);
  const userData = await getUser(email);
  res.send(userData);
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  const data = await getUser(email);

  if (!data) {
    return res.status(400).send({ Message: "Invalid credentials" });
  }
  const dbPassword = data.password;
  const isPwdMatch = await bcrypt.compare(password, dbPassword);

  if (isPwdMatch) {
    const token = jwt.sign({ id: data._id }, process.env.SECRET_KEY);
    res.status(200).send({ Message: "Signin Succesfully" });
  } else {
    res.status(400).send({ Message: "Invalid credentials" });
  }

  console.log(data);
});

app.post("/forgetpassword", async (req, res) => {
  const { email } = req.body;

  const data = await getUser(email);
  console.log(data);
  if (!data) {
    res.status(400).send({ Message: "Invalid credentials" });
  }
  // If the email is present in the database,token  is  generated for the user
  const token = jwt.sign({ id: data._id }, process.env.SECRET_KEY);
  //  The generated token will replace the old password
  const replacePassword = await passwordUpdate({ email, token });
  // console.log(replacePassword);
  let updatedResult = await getUser({email});
  // console.log(updatedResult);

  // mail for reset the password
  Mail(token, email);
  // Using nodemailer the token will be sent to the registered email
  return res.send({ updatedResult, token });
});

app.get("/forgetpassword/verify", async (req, res) => {
  const token = await req.header("x-auth-token");

  const tokenVerify = await getUser({ password: token });

  if (!tokenVerify) {
    return res.status(400).send({ Message: "Invalid Credentials" });
  } else {
    return res.status(200).send({ Message: "token matched" });
  }
});

app.post("/resetpassword", async (req, res) => {
  const { password, token } = req.body;

  if (password.length < 8) {
    return res.status(400).send({ Message: "password must be longer" });
  }

  const data = await getUser({ password: token });

  if (!data) {
    return res.status(401).send({ Message: "Invalid credentials" });
  }
  const { email } = data;

  const hashedPassword = await genPassword(password);

  const passwordUpdate = await updateuser({ email, password: hashedPassword });

  const result = await getUser({ email });

  return res.send(result);
});

function Mail(token, email) {
  console.log(process.env.email,process.env.password)
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.email,
      pass: process.env.password,
    },
  });

  const link = `http://localhost:8000/forgetpassword/verify/${token}`;
  const mailOptions = {
    from: process.env.email,
    to: email,
    subject: "Mail from the Server",
    html: `<a href=${link}>Click the link to reset the password</a>`,
  };

  transport.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err); 
    } else {
      console.log("status", info.response);
    }
  });
}
