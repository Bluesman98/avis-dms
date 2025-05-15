import { doc, setDoc } from "firebase/firestore";
import {  createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../../../lib/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in successfully");
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

export const signUp  = async(email: string, password: string, roles: string)=>{
  createUserWithEmailAndPassword(auth, email, password)
  .then(async (userCredential) => {
    // Signed up 
    const user = userCredential.user;
    await setDoc(doc(firestore, "users", user.uid), {
      email: user.email,
      roles: [roles],

    });
    console.log("Signed up successfully");
    console.log("User:", user); 
    await signIn(email, password);
     window.location.href = "/"
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log("Error signing up:", errorMessage);
    console.log("Error code:", errorCode);
    // ..
  })};

