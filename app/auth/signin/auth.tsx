import {  createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in successfully");
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };



export  const signUp  = async(email: string, password: string)=>{
  createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed up 
    const user = userCredential.user;
    console.log("Signed up successfully");
    console.log("User:", user); 
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log("Error signing up:", errorMessage);
    console.log("Error code:", errorCode);
    // ..
  })};