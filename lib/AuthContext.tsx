/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useTwoFA } from './TwoFAContext';

interface AuthContextType {
  user: any;
  roles: string[] | null;
  permissions: Record<string, string[]> | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTO_LOGOUT_MINUTES = 30; // Set auto logout time in minutes

export function useAutoLogout() {
  const { setIsVerified } = useTwoFA(); // <-- Move inside the hook

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

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        signOut();
      }, AUTO_LOGOUT_MINUTES * 60 * 1000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, []);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  useAutoLogout();

  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<string[] | null>(null);
  const [permissions, setPermissions] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        try {
          const firestore = getFirestore();
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userRoles = userDoc.data().roles || [];
            setRoles(userRoles);

            // Fetch permissions for each role
            const rolesCollection = collection(firestore, 'roles');
            const rolesSnapshot = await getDocs(rolesCollection);
            const rolesData = rolesSnapshot.docs.reduce((acc: any, doc: any) => {
              acc[doc.id] = doc.data().permissions;
              return acc;
            }, {});

            const userPermissions = userRoles.reduce((acc: Record<string, string[]>, role: string) => {
              if (rolesData[role]) {
                for (const category in rolesData[role]) {
                  if (!acc[category]) {
                    acc[category] = [];
                  }
                  acc[category].push(...rolesData[role][category]);
                }
              }
              return acc;
            }, {});

            // Remove duplicate permissions
            for (const category in userPermissions) {
              userPermissions[category] = [...new Set(userPermissions[category])];
            }

            setPermissions(userPermissions);
          } else {
            setRoles(null);
            setPermissions(null);
          }
        } catch {
          setRoles(null);
          setPermissions(null);
        }
      } else {
        setUser(null);
        setRoles(null);
        setPermissions(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, roles, permissions, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

