import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '../../../lib/s3';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  const { file, fileName, idToken } = await request.json();

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    if (
      !userDoc.exists ||
      !(userDoc.data() && Array.isArray(userDoc.data()?.roles) && userDoc.data()!.roles.includes('admin'))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await uploadFile(Buffer.from(file, 'base64'), fileName, process.env.AWS_S3_BUCKET_NAME!);
    return NextResponse.json({ message: 'File uploaded successfully', data: result });
  } catch (error) {
    return NextResponse.json({ message: 'File upload failed', error }, { status: 500 });
  }
}