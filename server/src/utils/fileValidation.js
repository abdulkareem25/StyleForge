// ─────────────────────────────────────────────────────────────────────
// WARD-01 — File Upload Validation Utilities
//
// Magic-byte signatures for allowed image types. Validates actual file
// content, not just claimed MIME type or extension (Security doc §5, §10).
//
// Note: Since uploads go directly from client → ImageKit, these checks
// run client-side before upload. They are also available server-side for
// any future server-proxied upload paths.
// ─────────────────────────────────────────────────────────────────────

/**
 * Magic-byte signatures for supported image formats.
 * Each entry: { mime, extensions, magicBytes (hex prefix), mask (optional) }
 *
 * Sources:
 *  - JPEG: FF D8 FF
 *  - PNG:  89 50 4E 47 0D 0A 1A 0A
 *  - WebP: RIFF....WEBP (RIFF at offset 0, WEBP at offset 8)
 */
const SIGNATURES = [
  {
    mime: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    magicBytes: Buffer.from([0xff, 0xd8, 0xff]),
  },
  {
    mime: 'image/png',
    extensions: ['.png'],
    magicBytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    mime: 'image/webp',
    extensions: ['.webp'],
    // WebP = RIFF header (4 bytes) + file size (4 bytes) + "WEBP"
    magicBytes: Buffer.from([0x52, 0x49, 0x46, 0x46]),
    // Additional check: bytes 8-12 must be "WEBP"
    extendedMagic: Buffer.from([0x57, 0x45, 0x42, 0x50]),
    extendedMagicOffset: 8,
  },
];

// Explicitly rejected types — even if someone claims this MIME or
// uploads with this extension, reject with a specific message.
const REJECTED_TYPES = [
  {
    mime: 'image/svg+xml',
    extensions: ['.svg'],
    reason: 'SVG files are not allowed for security reasons — they can contain embedded scripts.',
  },
  {
    mime: 'image/heic',
    extensions: ['.heic', '.heif'],
    reason: 'HEIC/HEIF files are not currently supported. Please convert to JPEG, PNG, or WebP before uploading.',
  },
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Reads the first 12 bytes from a Buffer and identifies the file type
 * by its magic-byte signature.
 * @param {Buffer} buffer - First bytes of the file (at least 12 bytes)
 * @returns {{ mime: string, extensions: string[] } | null}
 */
function detectFileType(buffer) {
  if (!buffer || buffer.length < 4) return null;

  for (const sig of SIGNATURES) {
    // Check primary magic bytes
    if (!sig.magicBytes.equals(buffer.subarray(0, sig.magicBytes.length))) {
      continue;
    }

    // For WebP, also verify "WEBP" marker at offset 8
    if (sig.extendedMagic) {
      if (buffer.length < sig.extendedMagicOffset + sig.extendedMagic.length) {
        continue;
      }
      if (!sig.extendedMagic.equals(
        buffer.subarray(sig.extendedMagicOffset, sig.extendedMagicOffset + sig.extendedMagic.length),
      )) {
        continue;
      }
    }

    return { mime: sig.mime, extensions: sig.extensions };
  }

  return null;
}

/**
 * Validates a file's actual content against its claimed MIME type and extension.
 * Catches renamed files with spoofed extensions (Security doc §10 test case).
 *
 * @param {object} params
 * @param {Buffer} params.fileBuffer - The raw file bytes (or first 12+ bytes)
 * @param {string} params.claimedMime - The MIME type claimed by the client
 * @param {string} params.fileName - Original file name (for extension check)
 * @param {number} params.fileSize - File size in bytes
 * @returns {{ valid: boolean, error?: string, detectedMime?: string }}
 */
function validateFileContent({ fileBuffer, claimedMime, fileName, fileSize }) {
  // 1. Size check
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMB}MB). Maximum allowed size is 10MB.`,
    };
  }

  if (fileSize === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  // 2. Extension-based rejection (catches HEIC and SVG early)
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  for (const rejected of REJECTED_TYPES) {
    if (rejected.extensions.includes(ext)) {
      return { valid: false, error: rejected.reason };
    }
  }

  // 3. MIME-based rejection
  for (const rejected of REJECTED_TYPES) {
    if (claimedMime === rejected.mime) {
      return { valid: false, error: rejected.reason };
    }
  }

  // 4. Magic-byte detection
  const detected = detectFileType(fileBuffer);
  if (!detected) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a JPEG, PNG, or WebP image.',
    };
  }

  // 5. Spoofed extension check — detected type must match claimed type
  // (allows flexibility: some browsers send "image/jpg" instead of "image/jpeg")
  const normalizeMime = (m) => m.toLowerCase().replace('image/jpg', 'image/jpeg');
  if (normalizeMime(detected.mime) !== normalizeMime(claimedMime)) {
    return {
      valid: false,
      error: `File content does not match its extension. The file appears to be ${detected.mime} but has a ${ext || 'unknown'} extension.`,
      detectedMime: detected.mime,
    };
  }

  return { valid: true, detectedMime: detected.mime };
}

module.exports = {
  SIGNATURES,
  REJECTED_TYPES,
  MAX_FILE_SIZE_BYTES,
  detectFileType,
  validateFileContent,
};
