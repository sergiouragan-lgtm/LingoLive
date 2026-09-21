/**
 * Mock Google Cloud Storage Service
 * Used in integration tests to simulate GCS operations without real calls
 */

import { vi } from "vitest";

const mockBuckets = new Map<string, Map<string, Buffer>>();

export const createMockGCSService = () => {
  return {
    uploadFile: vi.fn(async (bucketName: string, fileName: string, content: Buffer | string) => {
      if (!mockBuckets.has(bucketName)) {
        mockBuckets.set(bucketName, new Map());
      }
      const buffer = typeof content === "string" ? Buffer.from(content) : content;
      mockBuckets.get(bucketName)!.set(fileName, buffer);
      return {
        name: fileName,
        bucket: bucketName,
        size: buffer.length,
        contentType: "application/octet-stream",
        publicUrl: `https://storage.googleapis.com/${bucketName}/${fileName}`,
      };
    }),

    downloadFile: vi.fn(async (bucketName: string, fileName: string) => {
      const bucket = mockBuckets.get(bucketName);
      if (!bucket) {
        throw new Error(`Bucket ${bucketName} not found`);
      }
      const file = bucket.get(fileName);
      if (!file) {
        throw new Error(`File ${fileName} not found`);
      }
      return file;
    }),

    deleteFile: vi.fn(async (bucketName: string, fileName: string) => {
      const bucket = mockBuckets.get(bucketName);
      if (bucket) {
        bucket.delete(fileName);
      }
      return { success: true };
    }),

    listFiles: vi.fn(async (bucketName: string, prefix?: string) => {
      const bucket = mockBuckets.get(bucketName);
      if (!bucket) {
        return { files: [] };
      }
      const files = Array.from(bucket.keys())
        .filter((name) => !prefix || name.startsWith(prefix))
        .map((name) => ({
          name,
          size: bucket.get(name)!.length,
          updated: new Date().toISOString(),
        }));
      return { files };
    }),

    fileExists: vi.fn(async (bucketName: string, fileName: string) => {
      const bucket = mockBuckets.get(bucketName);
      return bucket ? bucket.has(fileName) : false;
    }),

    getSignedUrl: vi.fn(async (bucketName: string, fileName: string, expiresIn?: number) => ({
      url: `https://storage.googleapis.com/${bucketName}/${fileName}?signed=true`,
      expiresAt: new Date(Date.now() + (expiresIn || 3600) * 1000).toISOString(),
    })),

    copyFile: vi.fn(async (sourceBucket: string, sourceFile: string, destBucket: string, destFile: string) => {
      const srcBucket = mockBuckets.get(sourceBucket);
      if (!srcBucket || !srcBucket.has(sourceFile)) {
        throw new Error("Source file not found");
      }
      const content = srcBucket.get(sourceFile)!;
      if (!mockBuckets.has(destBucket)) {
        mockBuckets.set(destBucket, new Map());
      }
      mockBuckets.get(destBucket)!.set(destFile, content);
      return { success: true };
    }),
  };
};
