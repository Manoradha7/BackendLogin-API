import express from "express";
const router = express.Router();
import {
  genPassword,
  Mail,
  getUser,
  createUser,
  updateUser,
  getUserByEmail,
} from "./helper.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { client } from "./index.js";



// create user by signup
router.route("/signup").post(async (req, res) => {
  //get user input values from body
  const { name, email, password, passwordConfirmation } =
    req.body;

  //check the feild or empty or not
  if (
    name === null ||
    email === null ||
    password === null ||
    passwordConfirmation === null
  ) {
    return res.status(400).send({ Message: "This feild must be required" });
  }

  //check the password contain eight character or not
  if (password < 8) {
    return res.status(400).send({ Message: "Password must have 8 chactres" });
  }
  //check data aldready exists in database or not
  const userData = {
    $or: [{ name: { $eq: name } }, { email: { $eq: email } }],
  };
  const data = await getUser(userData);
  //if user data aldready exists return an error
  if (data) {
    return res.status(400).send({ Message: "User data aldready exists in DB" });
  }
  // generate hashedpassword
  const hashedPassword = await genPassword(password);
  //store the datas into the Database
  const createuser = await createUser(
    name,
    email,
    hashedPassword,
    passwordConfirmation
  );
  //get the data
  const getData = await getUserByEmail(email);
  //create token for the user
  const token = jwt.sign({ id: getData._id }, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });
  //update the token in userdata
  const storetoken = await updateUser(email, token);

  //crate a link for twostep verification
  const link = `http://localhost:8000/users/twostepverification/${token}`;
  const message = `<h3>Greetings ${name} !!!</h3>
<p>Welcome to the world of Shasha Player</p>
<p>Using our services you can Enjoy free Music</p>
<a href=${link}>Click the link to complete two step verification</a>
<p>Two step verification is mandatory to Signin</p>
`;
  //sent mail for activate the account
  const mail = Mail(email, res, message);
});

router.route("/twostepverification/:id").get(async (req, res) => {
  const { id } = req.params;
  try {
    //verify token
    const tokenverify = jwt.verify(id, process.env.SECRET_KEY);
    //get the user data using token
    const getData = await client
      .db("primestar")
      .collection("users")
      .findOne({ token: id });
    const { _id, Status, token } = await getData;
    //update the status of the user
    const statusUpdate = await client
      .db("primestar")
      .collection("users")
      .updateOne({ _id }, { $set: { Status: "Active", token: "" } });
    res.redirect(`http://localhost:3000/signin`);
  } catch (err) {
    return res.status(400).send({ Message: "Link Expired" });
  }
});

router.route("/signin").post(async (req, res) => {
  //get data from the body
  const { email, password } = req.body;
  //check data exists or not
  const data = await getUserByEmail(email);
  if (!data) {
    return res.status(400).send({ Message: "Invalid credentials-Email" });
  }
  //check status is active or not
  const { _id, password: hashedPassword, Status } = await data;
  if (Status == "InActive") {
    return res.status(400).send({ Message: "Need to Active your Account" });
  }

  // compare the password
  const passwordCheck = await bcrypt.compare(password, hashedPassword);

  //if password matched
  if (passwordCheck) {
    const token = jwt.sign({ id: data._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });
    const tokenupdate = await client
      .db("primestar")
      .collection("users")
      .updateOne({ email }, { $set: { token: token } });
    return res.status(200).send({ Message: "Signin Succesfully" });
  } else {
    return res.status(400).send({ Message: "Invalid credentials - password" });
  }
});

router.route("/forgetpassword").post(async (req, res) => {
  //get the email from body
  const { email } = req.body;

  //check the data present are not
  const data = await getUserByEmail(email);

  //if the there is no data return an error message
  if (!data) {
    return res.status(400).send({ Message: "Invalid Credentials" });
  }

  const { _id, Status, password, fname } = await data;
  //check the data if stautus is active or not
  if (Status === "InActive") {
    return res.status(400).send({ Message: "Your Account is InActive" });
  }
  //create the token
  const token = jwt.sign({ id: data._id }, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });
  //change the password to token
  const tokenchange = await client
    .db("primestar")
    .collection("users")
    .updateOne({ _id: _id }, { $set: { password: token } });
  // console.log(tokenchange);
  const link = `http://localhost:8000/users/forgetpassword/verify/${token}`;

  const message = `<h3>Greetings ${fname} !!!</h3>
    <p>Welcome to the world of Shasha Player</p>
    <p>Using our services you can Enjoy free Music</p>
    <a href=${link}>Click the link to Reset Your Password</a>
    <p>Regards,</p>
    <p>Shasha Player Team</p>`;
  //sent the mail for verification
  Mail(email, res, message);
});

//verification

router.route("/forgetpassword/verify/:id").get(async (req, res) => {
  // get the id
  const { id } = req.params;
  // console.log(id);

  //check the data
  const datacheck = await client
    .db("primestar")
    .collection("users")
    .findOne({ password: id });
  // console.log(datacheck);

  //if there no data return an error message
  if (!datacheck) {
    return res.status(400).send({ Message: "Link Expired" });
  }
  return res.redirect(`http://localhost:3000/resetpassword/${id}`);
});

//Resetpassword
router.route("/resetpassword").post(async (req, res) => {
  //get require data from the body
  const { password, passwordConfirmation, token } = req.body;

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
  const updatepassword = await client
    .db("primestar")
    .collection("users")
    .updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          passwordConfirmation: passwordConfirmation,
        },
      }
    );

  //check the data
  const checkdata = await getUserByEmail(email);
  // console.log(checkdata)

  //if password updated then return success message
  if (updatepassword) {
    return res.status(200).send({ Message: "Password Successfully Changed" });
  } else {
    return res.status(400).send({ Message: "Something Went Wrong" });
  }
});

export const UserRouter = router;
