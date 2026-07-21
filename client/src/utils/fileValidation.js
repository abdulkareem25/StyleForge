const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
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
]

function getExtension(fileName) {
  return fileName.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
}

function detectMimeType(file) {
  return new Promise((resolve) => {
    const readFile = async () => {
      try {
        const buffer = file.arrayBuffer ? await file.arrayBuffer() : await file.slice(0, 16).arrayBuffer()
        const bytes = new Uint8Array(buffer)
        if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
          resolve('image/jpeg')
          return
        }
        if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
          resolve('image/png')
          return
        }
        if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
          resolve('image/webp')
          return
        }
        resolve(null)
      } catch {
        resolve(null)
      }
    }

    readFile()
  })
}

export async function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select an image file.' }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File is too large (${sizeMB}MB). Maximum allowed size is 10MB.`,
    }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' }
  }

  const ext = getExtension(file.name)
  for (const rejected of REJECTED_TYPES) {
    if (rejected.extensions.includes(ext)) {
      return { valid: false, error: rejected.reason }
    }
  }

  if (file.type && REJECTED_TYPES.some((rejected) => rejected.mime === file.type)) {
    return {
      valid: false,
      error: REJECTED_TYPES.find((rejected) => rejected.mime === file.type).reason,
    }
  }

  const detectedMime = await detectMimeType(file)
  if (!detectedMime) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a JPEG, PNG, or WebP image.',
    }
  }

  if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a JPEG, PNG, or WebP image.',
    }
  }

  if (file.type && file.type !== detectedMime && !['image/jpg', 'image/jpeg'].includes(file.type)) {
    return {
      valid: false,
      error: `File content does not match its extension. The file appears to be ${detectedMime} but has a ${ext || 'unknown'} extension.`,
    }
  }

  return { valid: true, detectedMime }
}

export default validateImageFile
