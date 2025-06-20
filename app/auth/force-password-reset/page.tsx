'use client';
import { useState } from "react";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { changeUserPassword } from "../auth";
import { useRouter } from "next/navigation";

export default function ForcePasswordReset() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const router = useRouter();

  // Helper to reauthenticate user
  const reauthenticateUser = async (email: string, password: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("No user is signed in.");
    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);
  };

  const handleReset = async () => {
    setError(null);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!currentPassword || !newPassword) {
        setError("Both current and new passwords are required");
        return;
      }

      if (user && user.email) {
        // 1. Re-authenticate
        await reauthenticateUser(user.email, currentPassword);

        // 2. Change password
        await changeUserPassword(newPassword, user.uid);

        // 3. Set cookie to false via API
        const response = await fetch('/api/set-password-expired', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expired: false, uid: user.uid }),
          credentials: 'same-origin'
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        setPasswordChanged(true);

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch (err: unknown) {
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Password reset failed"
      );
    }
  };

  return (
    <div className="flex items-center justify-center h-full mt-10">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Your password has expired</h2>
        <p className="text-center text-gray-600">Please set a new password to continue.</p>

        <div className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your current password"
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your new password"
              required
            />
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-black text-white py-2 rounded-md hover:bg-[#d4002a] transition"
          >
            Change Password
          </button>

          {error &&
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
              {error}
            </div>
          }

          {passwordChanged &&
            <div className="p-3 text-sm text-green-700 bg-green-100 border border-green-200 rounded-md">
              Password changed successfully! Redirecting...
            </div>
          }
        </div>
      </div>
    </div>
  );
}