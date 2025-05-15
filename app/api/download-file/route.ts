import { NextRequest } from 'next/server';
import { getFile } from '../../../lib/s3';

export async function POST(request: NextRequest) {
  const { fileName } = await request.json();

  try {
    const s3Object = await getFile(fileName, process.env.AWS_S3_BUCKET_NAME!);
    const fileBuffer = s3Object.Body as Buffer;
    const contentType = s3Object.ContentType || 'application/octet-stream';

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'File retrieval failed', error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}