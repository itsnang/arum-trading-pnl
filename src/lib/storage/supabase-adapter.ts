import 'server-only'
import { supabaseStorageClient } from './client'
import type { StorageAdapter } from './types'

export class SupabaseStorageAdapter implements StorageAdapter {
  constructor(private readonly bucket: string) {}

  async upload(path: string, file: File, contentType: string): Promise<{ path: string }> {
    const { data, error } = await supabaseStorageClient.storage
      .from(this.bucket)
      .upload(path, file, { contentType, upsert: false })
    if (error || !data) throw new Error(`Storage upload failed: ${error?.message ?? 'unknown error'}`)
    return { path: data.path }
  }

  async getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await supabaseStorageClient.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds)
    if (error || !data) throw new Error(`Storage signed URL failed: ${error?.message ?? 'unknown error'}`)
    return data.signedUrl
  }

  async delete(path: string): Promise<void> {
    const { error } = await supabaseStorageClient.storage.from(this.bucket).remove([path])
    if (error) throw new Error(`Storage delete failed: ${error.message}`)
  }
}
