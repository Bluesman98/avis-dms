import { doc, getDoc, setDoc } from "firebase/firestore";
import {  createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../../lib/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export const signIn = async (email: string, password: string) => {
    try {
       const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in successfully");
      //window.location.href = "/"
      return userCredential;
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
      lastPasswordChange: Date.now()
    }, { merge: true });
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

export async function isPasswordExpired(uid: string): Promise<boolean> {
  const userDoc = await getDoc(doc(firestore, "users", uid));
  const lastChange = userDoc.data()?.lastPasswordChange;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  console.log("Last password change:", lastChange);
  if (!lastChange || (Date.now() - lastChange > THIRTY_DAYS)) {
    return true;
  }
  return false;
}

export async function changeUserPassword(newPassword: string, uid: string) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    await updatePassword(user, newPassword);
    await setDoc(doc(firestore, "users", uid), {
      lastPasswordChange: Date.now()
    }, { merge: true });
  }
}

// Call this before changing password or other sensitive actions
export async function reauthenticateUser(email: string, password: string) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("No user is signed in.");
  const credential = EmailAuthProvider.credential(email, password);
  await reauthenticateWithCredential(user, credential);
}

