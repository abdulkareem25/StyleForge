import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateImageFile } from './fileValidation.js'

describe('validateImageFile', () => {
  it('rejects files larger than 10MB with the shared validation message', async () => {
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1).fill(0)], 'oversized.jpg', {
      type: 'image/jpeg',
    })

    const result = await validateImageFile(oversized)

    assert.equal(result.valid, false)
    assert.match(result.error, /Maximum allowed size is 10MB/)
  })

  it('rejects SVG files with the specific security message', async () => {
    const svg = new File([Uint8Array.from([0x3c, 0x73, 0x76, 0x67])], 'icon.svg', {
      type: 'image/svg+xml',
    })

    const result = await validateImageFile(svg)

    assert.equal(result.valid, false)
    assert.match(result.error, /SVG files are not allowed/)
  })

  it('rejects unsupported formats with the shared error message', async () => {
    const unsupported = new File([Uint8Array.from([0x00, 0x01, 0x02, 0x03])], 'note.bin', {
      type: 'application/octet-stream',
    })

    const result = await validateImageFile(unsupported)

    assert.equal(result.valid, false)
    assert.match(result.error, /Unsupported file format/)
  })

  it('accepts a valid JPEG signature', async () => {
    const jpeg = new File([Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 0x01])], 'photo.jpg', {
      type: 'image/jpeg',
    })

    const result = await validateImageFile(jpeg)

    assert.equal(result.valid, true)
    assert.equal(result.detectedMime, 'image/jpeg')
  })
})
