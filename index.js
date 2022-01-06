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
  getuser,
  updateuser,
} from "./helper.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import cors from 'cors';
  
// creating new express app and save it as app
const app = express();

// Middleware
dotenv.config();
const corsOptions ={
  origin:'https://sharp-payne-15d7d3.netlify.app', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}

app.use(cors(corsOptions))
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// server configuration
const PORT = process.env.PORT;
//MongoDb database Url
const MONGO_URL = process.env.MONGO_URL;
// connection to the MongoDB 
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

//signup for 
app.post("/signup", async (req, res) => {
  // from body the user information are ten
  const { name, email, password } = req.body;
 
  // after getting the user data checking the user are existing or not 
  const data = await getUser(email);
 
  // if user data is in DB  retturn user existing message 
  if (data) {
    return res.status(400).send({ Message: "Email id is aldready exist" });
  }
  
  // if password length lessthan eight return long password required message
  if (password.length < 8) {
    return res.status(400).send({ Message: "Password must be longer" });
  }

  // generate hashpassword for the password
  const hashedPassword = await genPassword(password);
 
  //adding user data into the DATABASE
  const createUserData = await createUser(name, email, hashedPassword);
  console.log(createUserData);
  const userData = await getUser(email);
  res.send(userData);
});

// signin
app.post("/signin", async (req, res) => {
  //from body the user infromation are taken
  const { email, password } = req.body;

  //check the mail is existing in the DB
  const data = await getUser(email);

  //if the data is not avilable in the  DB then return an error message
  if (!data) {
    return res.status(400).send({ Message: "Invalid credentials" });
  }
  // for checking the stored password and user given password 
  const dbPassword = data.password;
 
  //check both password are match are not
  const isPwdMatch = await bcrypt.compare(password, dbPassword);
  
  //if password are match return success message along with token otherwise return an error message
  if (isPwdMatch) {
    const token = jwt.sign({ id: data._id }, process.env.SECRET_KEY);
    res.status(200).send({ Message: "Signin Succesfully" });
  } else {
    res.status(400).send({ Message: "Invalid credentials" });
  }

  console.log(data);
});

// forget password
app.post("/forgetpassword", async (req, res) => {
 
  //getting the data from the body
  const { email } = req.body;
 
  // getting the data from the Db 
  const data = await getUser(email);
  console.log(data);
 
  // if there is no data throe an error message
  if (!data) {
    res.status(400).send({ Message: "Invalid credentials" });
  }
 
  // If the email is present in the database,token  is  generated for the user
  const token = jwt.sign({ id: data._id }, process.env.SECRET_KEY);
 
  //  The generated token will replace the old password
  const replacePassword = await passwordUpdate({ email, token });
  console.log(replacePassword);
  let updatedResult = await getUser(email);
  console.log(data.email,data.password);
  console.log(updatedResult);

  // mail for reset the password
  Mail(token, email);
  
  // Using nodemailer the token will be sent to the registered email
  return res.send( {updatedResult, token} );
});

//forget password
app.get("/forgetpassword/verify", async (req, res) => {
  //get the token from the header
  const token = req.header(`x-auth-token`);
  // console.log(token);

  // get the from the DB for verification both are match or not
  const tokenVerify = await getuser({password:token});
  // console.log({"vtoken :":tokenVerify})
  
  // if token is not match return an error msg otherwise matched return matched msg
  if (!tokenVerify) {
    return res.status(400).send({ Message: "Invalid Credentials" });
  } else {
    return res.status(200).send({ Message: "token matched" });
  }
});

// resetpassword
app.post("/resetpassword", async (req, res) => {
  // get the data from the body
  const { password, token } = req.body;
// If password length is less than 8 return longer password require message
  if (password.length < 8) {
    return res.status(400).send({ Message: "password must be longer" });
  }
// get the data
  const data = await getUser({ password: token });
// the data is not there in the DB return an error msg
  if (!data) {
    return res.status(401).send({ Message: "Invalid credentials" });
  }
  const { email } = data;
// generate hashpassword  for the password
  const hashedPassword = await genPassword(password);
//update the new password for the user
  const passwordUpdate = await updateuser({ email, password: hashedPassword });
// get the user data 
  const result = await getUser({ email });

  return res.send(result);
});

// For sending mail for verification
function Mail(token, email) {
  console.log(process.env.email,process.env.password)
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.email,
      pass: process.env.password,
    },
  });

  const link = `http://localhost:3000/forgetpassword/verify/${token}`;
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
