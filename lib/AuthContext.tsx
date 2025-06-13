/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

interface AuthContextType {
  user: any;
  roles: string[] | null;
  permissions: Record<string, string[]> | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<string[] | null>(null);
  const [permissions, setPermissions] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        console.log(user)
        setUser(user);
        const firestore = getFirestore();
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userRoles = userDoc.data().roles || [];
          setRoles(userRoles);
          console.log('User roles:', userRoles);

          // Fetch permissions for each role
          const rolesCollection = collection(firestore, 'roles');
          const rolesSnapshot = await getDocs(rolesCollection);
          const rolesData = rolesSnapshot.docs.reduce((acc: any, doc: any) => {
            acc[doc.id] = doc.data().permissions;
            return acc;
          }, {});
          console.log('Roles data:', rolesData);

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
          console.log('User permissions before deduplication:', userPermissions);

          // Remove duplicate permissions
          for (const category in userPermissions) {
            userPermissions[category] = [...new Set(userPermissions[category])];
          }

          setPermissions(userPermissions);
          console.log('User permissions after deduplication:', userPermissions);
        } else {
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