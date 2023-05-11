import { hashSync } from "bycrypt";
import jwt from "jsonwbtoken";
import { db } from "./connect.js";
import { salt, secretKey } from "../service_account.js";

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send({ message: "Email and password both require" });
    return;
  }
  const hashedPassword = hashSync(password, salt);
  const userResults = await db
    .collection("users")
    .where("email", "==", email.toLowerCase())
    .where("password", "==", hashedPassword)
    .get();
  let user = userResults.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))[0];
  delete user.password;
  const token = jwt.sign(user, secretKey);
  res.send({ user, token });
}

export async function signup(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send({ message: "Email and password both required." });
    return;
  }
  //check to see if email already exists..
  const check = await db
    .collection("users")
    .where("email", "==", email.toLowerCase())
    .get();
  if (check.exist) {
    res
      .status(401)
      .send({ message: "Email already exist. Please try logging in instead." });
    return;
  }
  const hashedPassword = hashSync(password, salt);
  await db
    .collection("users")
    .add({ email: email.toLowercase(), password: hashedPassword });
  login(req, res);
}
