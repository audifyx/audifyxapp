// Firebase Storage service for audio files
import { storage, isFirebaseConfigured } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface UploadResult {
  downloadURL: string;
  fileName: string;
  size: number;
  uploadPath: string;
}

class FirebaseStorageService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = isFirebaseConfigured();
    if (!this.isConfigured) {
      console.warn('Firebase is not properly configured. File uploads will fail.');
    }
  }

  /**
   * Upload an audio file to Firebase Storage
   */
  async uploadAudioFile(
    fileUri: string, 
    fileName: string, 
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      throw new Error('Firebase is not configured. Please add your Firebase credentials.');
    }

    try {
      console.log('🔥 Starting Firebase upload:', { fileUri, fileName, userId });

      // Fetch the file as blob
      const response = await fetch(fileUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('File blob created:', { size: blob.size, type: blob.type });

      // Create a unique file path
      const timestamp = Date.now();
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uploadPath = `audio/${userId}/${timestamp}_${cleanFileName}`;
      
      // Create storage reference
      const storageRef = ref(storage, uploadPath);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          // Progress callback
          (snapshot) => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            };
            
            console.log(`Upload progress: ${progress.percentage.toFixed(1)}%`);
            onProgress?.(progress);
          },
          // Error callback
          (error) => {
            console.error('Upload failed:', error);
            reject(new Error(`Upload failed: ${error.message}`));
          },
          // Success callback
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              const result: UploadResult = {
                downloadURL,
                fileName: cleanFileName,
                size: blob.size,
                uploadPath
              };

              console.log('🎉 Upload successful:', result);
              resolve(result);
            } catch (error) {
              reject(new Error(`Failed to get download URL: ${error}`));
            }
          }
        );
      });

    } catch (error) {
      console.error('Firebase upload error:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload cover image to Firebase Storage
   */
  async uploadCoverImage(
    imageUri: string, 
    fileName: string, 
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      throw new Error('Firebase is not configured. Please add your Firebase credentials.');
    }

    try {
      console.log('🖼️ Starting cover image upload:', { imageUri, fileName, userId });

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const timestamp = Date.now();
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uploadPath = `covers/${userId}/${timestamp}_${cleanFileName}`;
      
      const storageRef = ref(storage, uploadPath);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            };
            onProgress?.(progress);
          },
          (error) => reject(new Error(`Cover upload failed: ${error.message}`)),
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                downloadURL,
                fileName: cleanFileName,
                size: blob.size,
                uploadPath
              });
            } catch (error) {
              reject(new Error(`Failed to get cover image URL: ${error}`));
            }
          }
        );
      });

    } catch (error) {
      console.error('Cover image upload error:', error);
      throw new Error(`Cover upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(uploadPath: string): Promise<void> {
    if (!this.isConfigured) {
      console.warn('Firebase not configured, cannot delete file');
      return;
    }

    try {
      const fileRef = ref(storage, uploadPath);
      await deleteObject(fileRef);
      console.log('File deleted successfully:', uploadPath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if Firebase is properly configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Get configuration status for debugging
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      storageAvailable: !!storage
    };
  }
}

export const firebaseStorage = new FirebaseStorageService();