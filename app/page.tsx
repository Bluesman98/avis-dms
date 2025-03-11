'use client'
import React, { useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../lib/firebaseConfig';
 
const Home = () => {
 
    useEffect(()=>{
        onAuthStateChanged(auth, (user) => {
            if (user) {
              // User is signed in, see docs for a list of available properties
              // https://firebase.google.com/docs/reference/js/firebase.User
              const uid = user.uid;
              // ...
              console.log("uid", uid)
            } else {
              // User is signed out
              // ...
              console.log("user is logged out")
            }
          });
         
    }, [])
 
  return (
    <section>        
      IID Document Management System
    </section>
  )
}
 
export default Home