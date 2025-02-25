import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '../../../lib/s3';

export async function POST(request: NextRequest) {
  const { fileName } = await request.json();

  try {
    const fileUrl = await getFileUrl(fileName, process.env.AWS_S3_BUCKET_NAME!);
    return NextResponse.json({ message: 'File URL retrieved successfully', fileUrl });
  } catch (error) {
    return NextResponse.json({ message: 'File retrieval failed', error }, { status: 500 });
  }
}