//import required packages
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { client } from "./index.js";

// generate hashedpassword for the password
async function genPassword(password) {
  const rounds = 10;
  const salt = await bcrypt.genSalt(rounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

async function createUser(
  name,
  email,
  hashedPassword,
  passwordConfirmation
) {
  return await client.db("primestar").collection("users").insertOne({
    name,
    email,
    password: hashedPassword,
    passwordConfirmation,
    Status: "InActive",
    token: "",
  });
}

async function getUser(userData) {
  return await client.db("primestar").collection("users").findOne(userData);
}

async function getUserByEmail(email) {
  return await client.db("primestar").collection("users").findOne({ email });
}

async function updateUser(email, token) {
  return await client
    .db("primestar")
    .collection("users")
    .updateOne({ email }, { $set: { token: token } });
}

//Mail function for sending the Mail messages
function Mail(email, res, message) {
  const mail = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.email,
      pass: process.env.password,
    },
  });

  const mailOptions = {
    from: process.env.email,
    to: email,
    subject: "Mail From URL Shortener",
    html: message,
  };

  mail.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log("Mail", err);
      res.status(404).send("error");
    } else {
      console.log("Mailstatus :", info.response);
      res.send("Mail Sent For verification");
    }
  });
}
async function getUserpass({ password: token }) {
  return client
    .db("primestar")
    .collection("users")
    .findOne({ password: token });

}

export {
  genPassword,
  Mail,
  getUser,
  createUser,
  updateUser,
  getUserByEmail,
  getUserpass
}
