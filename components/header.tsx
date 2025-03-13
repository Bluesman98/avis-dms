"use client"
import Link from "next/link";
import { auth } from "../lib/firebaseConfig";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";


export default function Header() {

    const [user, setUser] = useState<User | null>(null)

    const signOut = async () =>{auth.signOut().then(function() {
      console.log('Signed Out');
      setUser(null)
     window.location.href = "/"
    }, function(error) {
      console.error('Sign Out Error', error);
    });}

    useEffect(()=>{
        onAuthStateChanged(auth, (user) => {
            if (user) {
              // User is signed in, see docs for a list of available properties
              // https://firebase.google.com/docs/reference/js/firebase.User
              const uid = user.uid;
              // ...
              setUser(user)
              console.log("uid", uid)
            } else {
              // User is signed out
              // ...
              console.log("user is logged out")
            }
          });
    }, [])

    return(

<header className="bg-gray-800 text-white p-4">
<nav className="container mx-auto flex justify-between items-center">
  <div className="text-lg font-bold">I.I.D.</div>
  <ul className="flex space-x-4">
    <li>
      <Link href="/" legacyBehavior>
        <a className="hover:underline">Home</a>
      </Link>
    </li>
    <li>
      <Link href="/records" legacyBehavior>
        <a className="hover:underline">Records</a>
      </Link>
    </li>
    <li>
      <Link href="/records/upload" legacyBehavior>
        <a className="hover:underline">Upload</a>
      </Link>
    </li>
    <li>
      {user && <div>{user.email}</div>}
    </li>
    <li>
      {user ? (
        <button onClick={() => signOut()}>Sign Out</button>
      ) : (
        <Link href="/auth/signin" legacyBehavior>
          <a className="hover:underline">Sign In</a>
        </Link>
      )}
    </li>
  </ul>
</nav>
</header>)
}