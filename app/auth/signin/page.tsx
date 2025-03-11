'use client'
import { useState } from "react";
import { signIn, signUp } from "./auth";


export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newEmail, setNewmail] = useState("");
  const [newPassword, setNewPassword] = useState("");


  return (
    <div>
      <div>
          <h1>Sign In</h1>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button onClick={()=>signIn(email, password)}>Sign In</button>
      </div>
      <div>
          <h1>Sign Up</h1>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewmail(e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Password"
          />
          <button onClick={()=>signUp(email, password)}>Sign Up</button>
      </div>
    </div>
    
  );
}