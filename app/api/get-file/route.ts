import { NextRequest } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request: NextRequest) {
  const { fileName } = await request.json();

  const s3 = new S3Client({ region: process.env.AWS_REGION });
  const bucket = process.env.AWS_S3_BUCKET_NAME!;

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileName,
    });
    const response = await s3.send(command);

    const body = response.Body as ReadableStream<Uint8Array>;

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'File retrieval failed', error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}