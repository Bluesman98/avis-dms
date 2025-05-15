'use client';
import { useState } from 'react';
import { signIn, signUp } from './auth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newEmail, setNewmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  return (
    <div className="flex items-center justify-center mt-8">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
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
            onClick={() => {
              signIn(email, password);
            }}
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
            onClick={() => {
              signUp(newEmail, newPassword, 'user');
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