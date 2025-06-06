"use client"
import Link from "next/link";
import { auth } from "../../lib/firebaseConfig";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import classes from './CSS/Header.module.css'
import Image from "next/image";
import { usePathname } from "next/navigation";


function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<string[] | null>(null);

    const signOut = async () => {
      auth.signOut().then(function() {
        console.log('Signed Out');
        setUser(null)
        window.location.href = "/"
      }, function(error) {
        console.error('Sign Out Error', error);
      });
    };

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
              setUser(user);
              // Example: get roles from localStorage or your auth context
              const userAttributes = localStorage.getItem('userAttributes');
              if (userAttributes) {
                try {
                  const parsed = JSON.parse(userAttributes);
                  setRoles(parsed.roles || null);
                } catch {
                  setRoles(null);
                }
              } else {
                setRoles(null);
              }
              console.log("uid", user.uid)
            } else {
              setUser(null);
              setRoles(null);
              console.log("user is logged out")
            }
        });
    }, []);

    return(

<header className={classes.header}>
      <div className={classes.imgContainer}>
        <Image width ={150} height={100} src="/avis-vector-logo.svg" alt="Avis Logo" />
      </div>
      {user && (
        <nav className={classes.nav}>
          <Link href="/" legacyBehavior>
            <a className="hover:underline">Home</a>
          </Link>
          <Link href="/records" legacyBehavior>
            <a className="hover:underline">Search</a>
          </Link>
          {roles?.includes('admin') && (
            <Link href="/records/upload" legacyBehavior>
              <a className="hover:underline">Upload</a>
            </Link>
          )}
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
        </nav>
      )}
    </header>)
}

export default function HeaderWrapper() {
  const pathname = usePathname();
  const hideHeaderRoutes = ["/auth/force-password-reset"];
  const showHeader = !hideHeaderRoutes.includes(pathname ?? "");
  return showHeader ? <Header /> : null;
}