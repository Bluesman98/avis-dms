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
      throw new Error("Failed to sign in");
    }
  };

export const signUp  = async(email: string, password: string, roles: string)=>{
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Signed up 
    const user = userCredential.user;
    await setDoc(doc(firestore, "users", user.uid), {
      email: user.email,
      roles: [roles],
    });
    console.log("Signed up successfully");
    console.log("User:", user); 
    await signIn(email, password);
    window.location.href = "/";
    // ...
  } catch (error) {
    console.error("Error signing up:", error);
    throw new Error("Failed to sign up");
    // ..
  }
}

