// Supabase Storage Service for Audifyx
import { supabase, isSupabaseConfigured } from '../config/supabase';

export interface UploadProgress {
  percentage: number;
  bytesTransferred: number;
  totalBytes: number;
}

export interface UploadResult {
  success: boolean;
  downloadURL: string;
  filePath: string;
  error?: string;
}

export class SupabaseStorageService {
  private readonly AUDIO_BUCKET = 'audio-files';
  private readonly IMAGES_BUCKET = 'images';

  // Check if service is ready
  isConfigured(): boolean {
    return isSupabaseConfigured();
  }

  // Initialize storage buckets (call this once during app setup)
  async initializeBuckets(): Promise<void> {
    if (!this.isConfigured()) {
      console.log('❌ Supabase storage not configured - uploads disabled');
      return;
    }

    console.log('🪣 Setting up Supabase storage buckets...');

    try {
      // Check if buckets exist
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const audioExists = existingBuckets?.some(bucket => bucket.name === this.AUDIO_BUCKET);
      const imageExists = existingBuckets?.some(bucket => bucket.name === this.IMAGES_BUCKET);
      
      console.log(`🎵 ${this.AUDIO_BUCKET}: ${audioExists ? '✅ exists' : '🔄 creating'}`);
      console.log(`🖼️ ${this.IMAGES_BUCKET}: ${imageExists ? '✅ exists' : '🔄 creating'}`);
      
      // Create audio bucket if missing
      if (!audioExists) {
        const { error } = await supabase.storage.createBucket(this.AUDIO_BUCKET, {
          public: true,
          allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/aac'],
          fileSizeLimit: 100 * 1024 * 1024, // 100MB
        });
        
        if (error && !error.message.includes('already exists')) {
          console.warn('⚠️ Audio bucket setup issue:', error.message);
        } else {
          console.log('✅ Audio bucket ready');
        }
      }
      
      // Create images bucket if missing
      if (!imageExists) {
        const { error } = await supabase.storage.createBucket(this.IMAGES_BUCKET, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
        });
        
        if (error && !error.message.includes('already exists')) {
          console.warn('⚠️ Images bucket setup issue:', error.message);
        } else {
          console.log('✅ Images bucket ready');
        }
      }

      console.log('🪣 Storage buckets ready for uploads');
    } catch (error) {
      console.error('❌ Storage setup failed:', (error as any)?.message || String(error));
    }
  }

  // Upload audio file with progress tracking
  async uploadAudioFile(
    fileUri: string,
    fileName: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      console.log('Supabase not configured, using local file URL');
      return {
        success: true,
        downloadURL: fileUri, // Use local file URI as fallback
        filePath: fileName,
        error: 'Using local file - not uploaded to cloud'
      };
    }

    try {
      // Initialize buckets first
      await this.initializeBuckets();
      
      // Read the file as blob
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // Create unique file path
      const timestamp = Date.now();
      const filePath = `${userId}/${timestamp}_${fileName}`;

      // Simulate progress for better UX
      if (onProgress) {
        onProgress({ percentage: 25, bytesTransferred: arrayBuffer.byteLength * 0.25, totalBytes: arrayBuffer.byteLength });
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.AUDIO_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: blob.type || 'audio/mpeg',
          upsert: false
        });

      if (onProgress) {
        onProgress({ percentage: 75, bytesTransferred: arrayBuffer.byteLength * 0.75, totalBytes: arrayBuffer.byteLength });
      }

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.AUDIO_BUCKET)
        .getPublicUrl(filePath);

      if (onProgress) {
        onProgress({ percentage: 100, bytesTransferred: arrayBuffer.byteLength, totalBytes: arrayBuffer.byteLength });
      }

      console.log('✅ Audio uploaded to Supabase Storage successfully');
      return {
        success: true,
        downloadURL: publicUrlData.publicUrl,
        filePath: filePath,
      };

    } catch (error) {
      console.error('Error uploading audio to Supabase:', error);
      
      // Fallback to local file URI
      console.log('Falling back to local file storage');
      return {
        success: true,
        downloadURL: fileUri,
        filePath: fileName,
        error: 'Uploaded locally - cloud storage failed'
      };
    }
  }

  // Upload cover image
  async uploadCoverImage(
    imageUri: string,
    fileName: string,
    userId: string
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        downloadURL: '',
        filePath: '',
        error: 'Supabase not configured'
      };
    }

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      const timestamp = Date.now();
      const filePath = `covers/${userId}/${timestamp}_${fileName}`;

      const { data, error } = await supabase.storage
        .from(this.IMAGES_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: blob.type || 'image/jpeg',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(this.IMAGES_BUCKET)
        .getPublicUrl(filePath);

      return {
        success: true,
        downloadURL: publicUrlData.publicUrl,
        filePath: filePath,
      };

    } catch (error) {
      console.error('Error uploading image to Supabase:', error);
      return {
        success: false,
        downloadURL: '',
        filePath: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // Delete file from storage
  async deleteFile(bucket: string, filePath: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting file from Supabase:', error);
      return false;
    }
  }

  // Get file download URL
  async getDownloadURL(bucket: string, filePath: string): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageService();