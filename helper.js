import bcrypt from "bcrypt";
import { client } from "./index.js";
//generate hashpassword 
 async function genPassword(password){
    const no_of_rounds =10;
    const salt = await bcrypt.genSalt(no_of_rounds);
    const hashedPassword = await bcrypt.hash(password,salt);
    return hashedPassword;
  }

  // After forgot password,here the token will update the existing password
async function passwordUpdate(data)
{
    let {email,token}=data
    let result=await client.db('primestar').collection('users').updateOne({email},{$set:{password:token}})
    return result
}
//inserting userb details in Database
async function createUser(name, email, hashedPassword) {
  return client.db("primestar").collection("users").insertOne({ name, email, password: hashedPassword });
}
// finduser user data using email 
async function getUser(email) {
  return client.db("primestar").collection("users").findOne({ email:email });
  console.log(email);
}
//find user data 
async function getuser(values) {
  return client.db("primestar").collection("users").findOne(values);
}
// updating user data password
async function updateuser(values)
{
    const{email,Password}=values
    let result=await client.db('primestar').collection('users').updateOne({email},{$set:{Password:Password}})
    return result;
}
//exporting the components
export{
    genPassword,
    passwordUpdate,
    createUser,
    getUser,
    getuser,
    updateuser
}