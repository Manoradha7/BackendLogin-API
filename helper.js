import bcrypt from "bcrypt";
import { client } from "./index.js";

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

async function createUser(name, email, hashedPassword) {
  return client.db("primestar").collection("users").insertOne({ name, email, password: hashedPassword });
}

async function getUser(email) {
  return client.db("primestar").collection("users").findOne({ email });
}

async function updateuser(data)
{
    const{email,Password}= data
    let result=await client.db('primestar').collection('users').updateOne({email},{$set:{Password:Password}})
    return result;
}

export{
    genPassword,
    passwordUpdate,
    createUser,
    getUser,
    updateuser
}