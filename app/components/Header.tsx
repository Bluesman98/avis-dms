"use client"
import Link from "next/link";
import { auth } from "../../lib/firebaseConfig";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import classes from './CSS/Header.module.css'


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

<header className={classes.header}>
      <div className={classes.imgContainer}>
        <img src="https://download.logo.wine/logo/Avis_Car_Rental/Avis_Car_Rental-Logo.wine.png" alt="Avis Logo" />
      </div>
      {user && (
        <nav className={classes.nav}>
    
      <Link href="/" legacyBehavior>
        <a className="hover:underline">Home</a>
      </Link>
    
      <Link href="/records" legacyBehavior>
        <a className="hover:underline">Records</a>
      </Link>
    
  
      <Link href="/records/upload" legacyBehavior>
        <a className="hover:underline">Upload</a>
      </Link>
    
        </nav>
      )}
      {user && (
        <div className={classes.user}>
          <h4>{user?.email}</h4>
          <button onClick={() => {
            signOut();
            localStorage.removeItem('userAttributes');
          }}>Sign Out</button>
        </div>
      )}
{!user && (
        <nav className={classes.nav}>
                <Link href="/" legacyBehavior>
        <a className="hover:underline">Home</a>
      </Link>
          <Link href="/auth/signin" legacyBehavior>
            <a className="hover:underline">Sign In</a>
          </Link>
          </nav>)}
    </header>)
}