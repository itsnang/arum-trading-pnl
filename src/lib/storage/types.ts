import 'server-only'

export interface StorageAdapter {
  /** Uploads `file` to `path`. Throws on failure. */
  upload(path: string, file: File, contentType: string, options?: { upsert?: boolean }): Promise<{ path: string }>
  /** Returns a time-limited signed URL for reading a private file. Throws on failure. */
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<string>
  /** Returns a permanent public URL. Requires the bucket to have public read enabled. */
  getPublicUrl(path: string): string
  /** Deletes the file at `path`. Throws on failure — callers that want
   *  best-effort cleanup (e.g. deleting an owning record) should catch. */
  delete(path: string): Promise<void>
}
