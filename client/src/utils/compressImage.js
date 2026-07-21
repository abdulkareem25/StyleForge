import imageCompression from 'browser-image-compression'

const MAX_DIMENSION = 1600
const DEFAULT_QUALITY = 0.82

export default function compressImage(file, { maxDimension = MAX_DIMENSION, quality = DEFAULT_QUALITY } = {}) {
  return imageCompression(file, {
    maxWidthOrHeight: maxDimension,
    initialQuality: quality,
    fileType: 'image/jpeg',
  })
}
