"use client"
import Link from "next/link";
import { auth } from "../../lib/firebaseConfig";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import classes from './CSS/Header.module.css'
import { usePathname } from "next/navigation";

function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<string[] | null>(null);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => { setHydrated(true); }, []);

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
              setUser(user);
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
            } else {
              setUser(null);
              setRoles(null);
            }
        });
    }, []);

    if (!hydrated) return null;

    const signOut = async () => {
      auth.signOut().then(function() {
        setUser(null)
        window.location.href = "/"
      }, function(error) {
        console.error('Sign Out Error', error);
      });
    };

    return(
<header className={classes.header}>
  <div className={classes.imgContainer}>
    <img
      width={150}
      height={100}
      src="/avis-vector-logo.svg"
      alt="Avis Logo"
      style={{ display: 'block' }}
    />
  </div>
  {user && (
    <nav className={classes.nav}>
      <Link href="/"><div className="hover:underline">Home</div></Link>
      <Link href="/records"><div className="hover:underline">Search</div></Link>
      {roles?.includes('admin') && (
        <Link href="/records/upload"><div className="hover:underline">Upload</div></Link>
      )}
    </nav>
  )}
  {user && (
    <div className={classes.user}>
      <h4>{user?.email}</h4>
      <button onClick={() => {
        signOut();
        localStorage.removeItem('userAttributes');
        document.cookie = "token=; Max-Age=0; path=/";
        document.cookie = "2fa_verified=; Max-Age=0; path=/";
      }}>Sign Out</button>
    </div>
  )}
  {!user && (
    <nav className={classes.nav}>
      <Link href="/"><div className="hover:underline">Home</div></Link>
      <Link href="/auth/signin"><div className="hover:underline">Sign In</div></Link>
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