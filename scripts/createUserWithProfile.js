import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' }); // Adjust path if needed

if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('FIREBASE_PRIVATE_KEY is not set in .env');
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error('FIREBASE_CLIENT_EMAIL is not set in .env');
}
if (!process.env.FIREBASE_PROJECT_ID && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  throw new Error('FIREBASE_PROJECT_ID is not set in .env');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
});

async function createUserWithProfile(email, password, roles = []) {
  try {
    // 1. Create the user in Firebase Authentication
    const userRecord = await admin.auth().createUser({ email, password });

    // 2. Create the Firestore user profile entry
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      lastPasswordChange: admin.firestore.FieldValue.serverTimestamp(),
      roles: roles
    });

    console.log(`User ${email} created with UID: ${userRecord.uid}`);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

// Example usage:
createUserWithProfile('polyxeni.bololi@avis.gr', 'AvisUser12345!', ['ltr']);