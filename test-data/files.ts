import { UploadFile } from '../api/types';

// Smallest valid PNG (1×1 px, 70 bytes) – keeps uploads to the shared server tiny.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

export function buildPng(name: string): UploadFile {
  return { name, mimeType: 'image/png', buffer: PNG_1X1 };
}

export function buildTextFile(name: string): UploadFile {
  return { name, mimeType: 'text/plain', buffer: Buffer.from('not an image') };
}
