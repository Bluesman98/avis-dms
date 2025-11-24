"use client"
import Link from "next/link";
import { auth } from "../../lib/firebaseConfig";
import { useEffect, useState } from "react";
import classes from './CSS/Header.module.css'
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTwoFA } from "../../lib/TwoFAContext";
import { useAuth } from "@/lib/AuthContext";

function Header() {
  const [hydrated, setHydrated] = useState(false);
  const { isVerified } = useTwoFA();
  const { setIsVerified } = useTwoFA();

  useEffect(() => { setHydrated(true); }, []);

  const { user, roles } = useAuth();


  if (!hydrated) return null;

  const signOut = async () => {
    // Sign out from Firebase
    await auth.signOut();
    // Clear all localStorage
    localStorage.clear();

    // Call the API route to clear httpOnly cookies
    await fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'include',
    });

    setIsVerified(false);

    // Redirect to sign-in page
    window.location.href = "/auth/signin";
  };

  return (
    <header className={classes.header}>
      <div className={classes.imgContainer}>
        <Image
          width={150}
          height={100}
          src="/avis-vector-logo.svg"
          alt="Avis Logo"
          style={{ display: 'block' }}
        />
      </div>
      {user && isVerified && (
        <>
          <nav className={classes.nav}>
            <Link href="/"><div>Home</div></Link>
            <Link href="/records"><div>Search</div></Link>
            {roles?.includes('admin') && (
              <Link href="/records/upload"><div>Upload</div></Link>
            )}
            {roles?.includes('admin') && (
              <Link href="/records/update"><div>Update</div></Link>
            )}
          </nav>
          <div className={classes.user}>
            <h4>{user?.email}</h4>
            <button onClick={signOut}>Sign Out</button>
          </div>
        </>
      )}
      {(!user || !isVerified) && (
        <nav className={classes.nav}>
          <Link href="/home"><div>Home</div></Link>
          <Link href="/auth/signin"><div>Sign In</div></Link>
        </nav>
      )}
    </header>
  );
}

export default function HeaderWrapper() {
  const pathname = usePathname();
  const hideHeaderRoutes = ["/auth/force-password-reset"];
  const showHeader = !hideHeaderRoutes.includes(pathname ?? "");
  return showHeader ? <Header /> : null;
}