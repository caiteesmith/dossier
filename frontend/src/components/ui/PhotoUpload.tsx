import { useRef, useState } from 'react'

interface PhotoUploadProps {
  currentUrl?: string | null
  onUpload: (file: File) => Promise<unknown>
  onRemove?: () => Promise<unknown>
  label?: string
  aspectRatio?: string   // e.g. '16/9', '1/1'
}

export function PhotoUpload({
  currentUrl,
  onUpload,
  onRemove,
  label = 'Engagement photo',
  aspectRatio = '16/9',
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Please choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > 10_000_000) {
      setError('Image must be under 10MB.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)
    try {
      await onUpload(file)
    } catch (e) {
      console.error(e)
      setError('Upload failed. Try again.')
      setPreview(null)
    } finally {
      setUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  async function handleRemove() {
    if (!onRemove) return
    setUploading(true)
    try {
      await onRemove()
      setPreview(null)
    } catch (e) {
      console.error(e)
      setError('Could not remove photo.')
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = preview ?? currentUrl

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width: '100%',
          aspectRatio,
          borderRadius: '10px',
          overflow: 'hidden',
          background: '#e8ecf4',
          border: '1px solid var(--color-navy-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: uploading ? 'default' : 'pointer',
          position: 'relative',
        }}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: uploading ? 0.5 : 1 }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#8b9ab0', fontFamily: 'inherit' }}>
            <div style={{ fontSize: '28px', marginBottom: '6px', opacity: 0.5 }}>📷</div>
            <div style={{ fontSize: '12px' }}>{label}</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Click to upload</div>
          </div>
        )}
        {uploading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.4)', fontSize: '12px', color: '#1a1a2e', fontWeight: 500,
          }}>
            Uploading...
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        {error && <p style={{ fontSize: '11px', color: '#b91c1c' }}>{error}</p>}
        {!error && displayUrl && onRemove && (
          <button
            onClick={handleRemove}
            disabled={uploading}
            style={{
              fontSize: '11px', color: 'var(--color-navy-400)', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginLeft: 'auto',
            }}
          >
            Remove photo
          </button>
        )}
      </div>
    </div>
  )
}