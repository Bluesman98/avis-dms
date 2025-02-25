import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '../../../lib/s3';

export async function POST(request: NextRequest) {
  const { file, fileName } = await request.json();

  try {
    const result = await uploadFile(Buffer.from(file, 'base64'), fileName, process.env.AWS_S3_BUCKET_NAME!);
    return NextResponse.json({ message: 'File uploaded successfully', data: result });
  } catch (error) {
    return NextResponse.json({ message: 'File upload failed', error }, { status: 500 });
  }
}