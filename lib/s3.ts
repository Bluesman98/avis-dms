import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const uploadFile = async (file: Buffer, fileName: string, bucketName: string) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: file,
  };

  return s3.upload(params).promise();
};

export const getFile = async (fileName: string, bucketName: string) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
  };

  return s3.getObject(params).promise();
};

export const getFileUrl = async (fileName: string, bucketName: string) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Expires: 60 * 60, // URL expires in 1 hour
  };

  return s3.getSignedUrlPromise('getObject', params);
};