import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function POST(request: NextRequest) {
  const { searchQuery } = await request.json();

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const files = data.Contents?.map(item => item.Key) || [];
    const filteredFiles = files.filter(file => file && file.toLowerCase().includes(searchQuery.toLowerCase()));
    return NextResponse.json({ files: filteredFiles });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to filter files', error }, { status: 500 });
  }
}