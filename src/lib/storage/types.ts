import 'server-only'

export interface StorageAdapter {
  /** Uploads `file` to `path`. Throws on failure. */
  upload(path: string, file: File, contentType: string): Promise<{ path: string }>
  /** Returns a time-limited signed URL for reading a private file. Throws on failure. */
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<string>
  /** Deletes the file at `path`. Does not throw if the path doesn't exist. */
  delete(path: string): Promise<void>
}
