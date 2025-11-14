const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { config } = require('./index');

/**
 * Backblaze B2 Storage Configuration
 * This file manages all cloud storage operations using B2-compatible S3 API
 */

// Initialize S3-compatible client for Backblaze B2
const storageClient = new S3Client({
  endpoint: `https://${config.b2.endpoint}`,
  region: config.b2.region,
  credentials: {
    accessKeyId: config.b2.keyId,
    secretAccessKey: config.b2.applicationKey,
  },
});

/**
 * Upload a file to B2 bucket
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - The name to save the file as
 * @param {Object} metadata - Additional metadata to store with the file
 * @param {string} contentType - MIME type of the file (default: application/pdf)
 * @returns {Promise<Object>} - Upload result with fileUrl and fileId
 */
async function uploadToB2(fileBuffer, fileName, metadata = {}, contentType = 'application/pdf') {
  try {
    const command = new PutObjectCommand({
      Bucket: config.b2.bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        originalName: metadata.originalName || '',
        uploadedAt: metadata.uploadedAt || new Date().toISOString(),
        size: String(metadata.size || 0),
        userId: metadata.userId || '',
      },
    });

    const result = await storageClient.send(command);

    // Don't return public URL - we'll generate presigned URLs when needed
    // Store just the bucket and key information
    const fileUrl = fileName; // Store only the key/filename

    return {
      success: true,
      fileUrl: fileUrl,
      fileName: fileName,
      fileId: result.ETag, // ETag can be used as a file identifier
      uploadedAt: metadata.uploadedAt,
    };
  } catch (error) {
    throw new Error(`B2 upload failed: ${error.message}`);
  }
}

/**
 * Generate a presigned URL for secure file access
 * @param {string} fileName - The name/key of the file in the bucket
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} - Presigned URL
 */
async function generatePresignedUrl(fileName, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: config.b2.bucketName,
      Key: fileName,
    });

    // Generate presigned URL that expires in specified time
    const presignedUrl = await getSignedUrl(storageClient, command, { expiresIn });

    return presignedUrl;
  } catch (error) {
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}

/**
 * Delete a file from B2 storage
 * @param {string} fileName - The name/key of the file to delete
 * @returns {Promise<Object>} - Delete result
 */
async function deleteFromB2(fileName) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.b2.bucketName,
      Key: fileName,
    });

    const result = await storageClient.send(command);

    return {
      success: true,
      fileName: fileName,
      deleted: true,
    };
  } catch (error) {
    throw new Error(`B2 deletion failed: ${error.message}`);
  }
}

module.exports = { 
  storageClient, 
  uploadToB2, 
  generatePresignedUrl,
  deleteFromB2
};
