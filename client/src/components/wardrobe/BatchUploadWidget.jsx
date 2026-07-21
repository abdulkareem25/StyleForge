import { useState, useCallback, useRef } from 'react'
import { FileUploader } from '../ui'
import { getUploadAuth } from '../../services/wardrobeService'
import compressImage from '../../utils/compressImage'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_FILES = 20

let uploadAuthCache = null
let uploadAuthPromise = null

async function getUploadAuthCached() {
  if (uploadAuthCache) return uploadAuthCache
  if (uploadAuthPromise) return uploadAuthPromise
  uploadAuthPromise = getUploadAuth()
    .then(({ data }) => {
      if (data.success) {
        uploadAuthCache = data.data
        return uploadAuthCache
      }
      throw new Error(data.error || 'Upload auth failed')
    })
    .catch((err) => {
      uploadAuthPromise = null
      throw err
    })
  return uploadAuthPromise
}

function createObjectPreview(file) {
  return URL.createObjectURL(file)
}

async function uploadToImageKit(file, auth, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', file.name)
  formData.append('publicKey', auth.publicKey)
  formData.append('signature', auth.signature)
  formData.append('expire', auth.expire)
  formData.append('token', auth.token)
  formData.append('folder', '/wardrobe')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', auth.uploadUrl || 'https://upload.imagekit.io/api/v1/files/upload')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ imageUrl: res.url, thumbnailUrl: res.thumbnailUrl || res.url })
        } else {
          reject(new Error(res.error?.message || 'Upload failed'))
        }
      } catch {
        reject(new Error('Upload failed'))
      }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(formData)
  })
}

export default function BatchUploadWidget({ onItemsReady, onProgressChange }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [overallError, setOverallError] = useState(null)
  const abortRef = useRef(false)

  const notifyProgress = useCallback(
    (fileList) => {
      if (onProgressChange) {
        const done = fileList.filter((f) => f.status === 'done' || f.status === 'error').length
        onProgressChange({ completed: done, total: fileList.length })
      }
    },
    [onProgressChange],
  )

  const uploadBatch = useCallback(
    async (rawFiles) => {
      abortRef.current = false
      setUploading(true)
      setOverallError(null)

      const fileList = rawFiles.map((file) => ({
        name: file.name,
        rawFile: file,
        preview: createObjectPreview(file),
        status: 'queued',
        progress: 0,
        error: null,
        imageUrl: null,
        thumbnailUrl: null,
      }))

      setFiles(fileList)
      notifyProgress(fileList)

      let auth = null
      try {
        auth = await getUploadAuthCached()
      } catch {
        // Backend not ready — mark all as error with guidance
        const updated = fileList.map((f) => ({
          ...f,
          status: 'error',
          error: 'Upload service unavailable. Please try again later.',
        }))
        setFiles(updated)
        setUploading(false)
        setOverallError('Upload service is not available yet.')
        notifyProgress(updated)
        return
      }

      const successfulItems = []

      for (let i = 0; i < fileList.length; i++) {
        if (abortRef.current) break

        const item = fileList[i]

        // Compress
        setFiles((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'compressing', progress: 0 }
          notifyProgress(next)
          return next
        })

        let compressed
        try {
          compressed = await compressImage(item.rawFile)
        } catch {
          setFiles((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], status: 'error', error: 'Compression failed' }
            notifyProgress(next)
            return next
          })
          continue
        }

        if (abortRef.current) break

        // Upload
        setFiles((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], status: 'uploading', progress: 0 }
          notifyProgress(next)
          return next
        })

        try {
          const result = await uploadToImageKit(compressed, auth, (progress) => {
            setFiles((prev) => {
              const next = [...prev]
              next[i] = { ...next[i], progress }
              return next
            })
          })

          setFiles((prev) => {
            const next = [...prev]
            next[i] = {
              ...next[i],
              status: 'done',
              progress: 100,
              imageUrl: result.imageUrl,
              thumbnailUrl: result.thumbnailUrl,
            }
            notifyProgress(next)
            return next
          })

          successfulItems.push({
            imageUrl: result.imageUrl,
            thumbnailUrl: result.thumbnailUrl,
            fileName: item.name,
          })
        } catch (err) {
          setFiles((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], status: 'error', error: err.message || 'Upload failed' }
            notifyProgress(next)
            return next
          })
        }
      }

      setUploading(false)

      if (successfulItems.length > 0 && onItemsReady) {
        onItemsReady(successfulItems)
      }
    },
    [onItemsReady, notifyProgress],
  )

  const handleFilesSelected = useCallback(
    (rawFiles) => {
      uploadBatch(rawFiles)
    },
    [uploadBatch],
  )

  const handleFileRemove = useCallback(
    (index) => {
      if (uploading) return
      setFiles((prev) => prev.filter((_, i) => i !== index))
    },
    [uploading],
  )

  return (
    <div className="flex flex-col gap-4">
      <FileUploader
        accept={ACCEPT}
        multiple
        maxFiles={MAX_FILES}
        files={files}
        uploading={uploading}
        error={overallError}
        onFilesSelected={handleFilesSelected}
        onFileRemove={handleFileRemove}
      />
    </div>
  )
}
