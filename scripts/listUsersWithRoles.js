import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' }); // Adjust path if needed

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
});

async function logUserEmailsAndRoles() {
  const usersSnapshot = await admin.firestore().collection('users').get();
  const uids = usersSnapshot.docs.map(doc => doc.id);

  // Fetch all users from Firebase Auth
  let allUsers = [];
  let nextPageToken;
  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    allUsers = allUsers.concat(result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  // Map UID to email
  const uidToEmail = {};
  allUsers.forEach(userRecord => {
    uidToEmail[userRecord.uid] = userRecord.email || '(no email)';
  });

  // Prepare and print table of emails and roles
  const usersTable = usersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      email: uidToEmail[doc.id] || '(not found)',
      roles: Array.isArray(data.roles) ? data.roles.join(', ') : '(none)'
    };
  });
  console.table(usersTable);
}

logUserEmailsAndRoles().catch(console.error);