/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from 'react';
import { signIn, signUp, isPasswordExpired } from '../auth';
import { useRouter } from 'next/navigation'; // <-- Use Next.js router

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newEmail, setNewmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // <-- Use this instead of useNavigate

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      const userCred = await signIn(email, password);
      const expired = await isPasswordExpired(userCred.user.uid);
      console.log("Password expired:", expired);
      
      if (expired) {
        const response = await fetch('/api/set-password-expired', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expired: true }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to set password expired status');
        }
        
        router.push("/auth/force-password-reset");
      } else {
        const response = await fetch('/api/set-password-expired', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expired: false }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to set password expired status');
        }
        
        // This ensures the page fully reloads and picks up the new cookie
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  // Helper to extract error message
  function getErrorMessage(err: any) {
    if (!err) return 'Unknown error.';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    if (err.code) return `Error: ${err.code}`;
    return 'Failed to process request.';
  }

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  return (
    <div className="flex items-center justify-center mt-8">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        {error && (
          <div className="mb-4 text-red-600 text-center font-semibold">
            {error}
          </div>
        )}
        {/* Sign In Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign In</h1>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-black text-white py-2 rounded-md hover:bg-[#d4002a] transition"
          >
            Sign In
          </button>
        </div>

        <hr className="my-6 border-gray-300" />

        {/* Sign Up Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign Up</h1>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={async () => {
              setError(null);
              if (!newEmail || !newPassword) {
                setError('Please enter both email and password for sign up.');
                return;
              }
              if (!isValidEmail(newEmail)) {
                setError('Please enter a valid email address for sign up.');
                return;
              }
              if (newPassword.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
              }
              try {
                await signUp(newEmail, newPassword, 'user');
              } catch (err: any) {
                setError(getErrorMessage(err) || 'Failed to sign up.');
              }
            }}
            className="w-full bg-[#d4002a] text-white py-2 rounded-md hover:bg-black transition"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}