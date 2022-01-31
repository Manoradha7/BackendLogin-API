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
<<<<<<< HEAD
=======

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

/Resetpassword
app.post("/resetpassword", async (req, res) => {
  //get require data from the body
  const { password ,passwordConfirmation,token} = req.body;

  //check the password length
  if (password.length < 8) {
    return res.status(400).send({ Message: "Password must be longer" });
  }

  //check the data
  const check = await client
    .db("primestar")
    .collection("users")
    .findOne({ password: token });
//the data is not there return an error
  if (!check) {
    return res.status(400).send({ Message: "Link expired" });
  }
//get the email from the data
  const { email } = await check;

  //change the password into hashed password
  const hashedPassword = await genPassword(password);

  // update the password into db
  const updatepassword = await client.db("primestar").collection("users").updateOne({email},{$set:{password:hashedPassword,passwordConfirmation:passwordConfirmation}});
 
  //check the data
  const checkdata = await client
    .db("primestar")
    .collection("users")
    .findOne({email});
  
  //if password updated then return success message
  if(updatepassword){
    return res.status(200).send({Message:"Password Successfully Changed"})
  }else{
    return res.status(400).send({Message:"Something Went Wrong"})
  }
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

  const link = `https://priceless-swartz-5ce069.netlify.app/forgetpassword/verify/${token}`;
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
>>>>>>> 8001a720761802d5cf9b3aaf2eac1ff4d0abee92
