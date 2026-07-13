import 'server-only'
import { SupabaseStorageAdapter } from './supabase-adapter'
import { STORAGE_BUCKET } from './constants'
import type { StorageAdapter } from './types'

export type { StorageAdapter } from './types'

// Swap point: change this one line to point at a different StorageAdapter
// implementation (S3, Cloudinary, ...). Every consumer imports `storageAdapter`
// from here, never the concrete class, so no call-site changes are needed.
export const storageAdapter: StorageAdapter = new SupabaseStorageAdapter(STORAGE_BUCKET)
