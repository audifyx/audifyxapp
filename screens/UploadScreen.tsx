import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useMusicStore } from '../state/music';
import { useAuthStore } from '../state/auth';
import { platformService, detectPlatform } from '../api/platforms';
import { supabaseStorage, UploadProgress } from '../services/supabaseStorage';
import { aiImageGenerator } from '../api/aiImageGenerator';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function UploadScreen() {
  const [selectedMethod, setSelectedMethod] = useState<'link' | 'file' | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  const [coverImageUri, setCoverImageUri] = useState('');
  const [initialStreamCount, setInitialStreamCount] = useState('');
  const [genre, setGenre] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete'>('idle');
  const [platformPreview, setPlatformPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  const { addTrack } = useMusicStore();
  const { user } = useAuthStore();
  
  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      
      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        console.log('=== FILE PICKER RESULT ===');
        console.log('File URI:', file.uri);
        console.log('File name:', file.name);
        console.log('File type:', file.mimeType);
        console.log('File size:', file.size);
        console.log('=== END FILE INFO ===');
        
        // Validate file
        if (file.size && file.size > 50 * 1024 * 1024) { // 50MB limit
          Alert.alert('File Too Large', 'Please select an audio file smaller than 50MB');
          return;
        }
        
        // Validate file type
        const supportedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/x-m4a'];
        if (file.mimeType && !supportedTypes.some(type => file.mimeType?.includes(type))) {
          Alert.alert(
            'Unsupported Format', 
            `This file type (${file.mimeType}) may not be supported. Please try MP3, WAV, or M4A files.`
          );
        }
        
        setTrackUrl(file.uri);
        
        // Extract filename without extension for title
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        setTrackTitle(fileName);
        
        // Try to extract artist from filename if it contains " - "
        if (fileName.includes(' - ')) {
          const parts = fileName.split(' - ');
          if (parts.length >= 2) {
            setArtistName(parts[0].trim());
            setTrackTitle(parts[1].trim());
          }
        }
        
        // Show success message
        Alert.alert('File Selected', `Successfully selected: ${file.name}`);
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to select audio file. Please try again.');
    }
  };
  
  const detectSourceFromUrl = (url: string): 'soundcloud' | 'youtube' | 'spotify' | 'file' => {
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('spotify.com')) return 'spotify';
    return 'file';
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Cover Image',
      'Choose how you want to add a cover image',
      [
        { text: '🎨 Generate with AI', onPress: generateAICover },
        { text: '📷 Camera', onPress: takeCoverPhoto },
        { text: '📱 Photo Library', onPress: pickCoverImage },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const takeCoverPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take a photo');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for album covers
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking cover photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickCoverImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to select a cover image');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for album covers
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking cover image:', error);
      Alert.alert('Error', 'Failed to select cover image');
    }
  };

  const generateAICover = async () => {
    if (!trackTitle || !artistName) {
      Alert.alert('Missing Info', 'Please enter track title and artist name first');
      return;
    }

    setGeneratingAI(true);
    try {
      console.log('🎨 Generating AI cover art...');
      
      const result = await aiImageGenerator.generateCoverArt(trackTitle, artistName, genre);
      
      if (result.success && result.imageUrl) {
        setCoverImageUri(result.imageUrl);
        Alert.alert(
          '🎨 AI Cover Generated!',
          'Your AI-generated cover art has been created. You can still change it if needed.',
          [{ text: 'Great!' }]
        );
      } else {
        throw new Error(result.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      Alert.alert(
        '❌ AI Generation Failed', 
        (error as any)?.message || String(error) || 'Could not generate cover art. Please try again or select an image manually.'
      );
    } finally {
      setGeneratingAI(false);
    }
  };
  
  const handleUpload = async () => {
    if (!trackTitle || !artistName || !trackUrl) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    
    setUploading(true);
    
    try {
      console.log('=== UPLOAD PROCESS START ===');
      console.log('Track URL:', trackUrl);
      console.log('Selected method:', selectedMethod);
      
      let finalTrack;
      
      // Check if it's a platform URL
      if (selectedMethod === 'link' && platformService.isValidPlatformUrl(trackUrl)) {
        console.log('Platform URL detected, fetching metadata...');
        
        try {
          // Get track info from platform API
          const platformTrack = await platformService.getTrackFromUrl(trackUrl);
          console.log('Platform track retrieved:', platformTrack);
          
          finalTrack = {
            title: trackTitle || platformTrack.title,
            artist: artistName || platformTrack.artist,
            url: platformTrack.streamUrl || trackUrl, // Use stream URL if available
            imageUrl: coverImageUri || platformTrack.thumbnailUrl || `https://picsum.photos/300/300?random=${Math.random()}`,
            duration: platformTrack.duration || 180,
            streamCount: parseInt(initialStreamCount) || 0,
            uploadedBy: user?.id || 'anonymous',
            source: platformTrack.platform
          };
          
          // Show preview info if it's preview-only
          if (platformTrack.isPreviewOnly) {
            Alert.alert(
              'Preview Only',
              `This ${platformService.getPlatformName(trackUrl)} track will only play a 30-second preview due to platform restrictions.`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => { setUploading(false); return; } },
                { text: 'Upload Preview', onPress: () => {} }
              ]
            );
          }
          
        } catch (platformError) {
          console.error('Platform API failed:', platformError);
          Alert.alert(
            'Platform Error',
            `Could not fetch track from ${platformService.getPlatformName(trackUrl)}. Using URL directly.`
          );
          
          // Fallback to direct URL
          finalTrack = {
            title: trackTitle,
            artist: artistName,
            url: trackUrl,
            imageUrl: coverImageUri || `https://picsum.photos/300/300?random=${Math.random()}`,
            duration: 180,
            streamCount: parseInt(initialStreamCount) || 0,
            uploadedBy: user?.id || 'anonymous',
            source: detectSourceFromUrl(trackUrl)
          };
        }
      } else if (selectedMethod === 'file') {
        // File upload - use cloud storage
        console.log('File upload detected, uploading to cloud storage...');
        
        if (!trackUrl) {
          throw new Error('No file selected');
        }

        setUploadStatus('uploading');
        
        // Upload file to Supabase Storage
        const fileName = trackUrl.split('/').pop() || `audio_${Date.now()}.mp3`;
        console.log('Uploading file to Supabase Storage:', fileName);
        
        if (!supabaseStorage.isConfigured()) {
          throw new Error('Supabase Storage is not configured. Please add your Supabase credentials.');
        }

        const uploadResult = await supabaseStorage.uploadAudioFile(
          trackUrl,
          fileName,
          user?.id || 'anonymous',
          (progress) => {
            setUploadProgress(progress.percentage);
            console.log(`Supabase upload progress: ${progress.percentage.toFixed(1)}%`);
          }
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        console.log('File uploaded to Supabase successfully:', uploadResult.downloadURL);

        // Also upload cover image to Supabase if provided
        let supabaseCoverUrl = coverImageUri;
        if (coverImageUri && !coverImageUri.startsWith('http')) {
          try {
            const coverFileName = `cover_${Date.now()}.jpg`;
            const coverResult = await supabaseStorage.uploadCoverImage(
              coverImageUri,
              coverFileName,
              user?.id || 'anonymous'
            );
            if (coverResult.success) {
              supabaseCoverUrl = coverResult.downloadURL;
              console.log('Cover image uploaded to Supabase:', coverResult.downloadURL);
            }
          } catch (coverError) {
            console.warn('Cover image upload failed, using original:', coverError);
          }
        }

        finalTrack = {
          title: trackTitle,
          artist: artistName,
          url: uploadResult.downloadURL, // Use Supabase Storage URL
          imageUrl: supabaseCoverUrl || `https://picsum.photos/300/300?random=${Math.random()}`,
          duration: 180,
          streamCount: parseInt(initialStreamCount) || 0,
          uploadedBy: user?.id || 'anonymous',
          source: 'file' as const
        };
      } else {
        // Direct URL
        finalTrack = {
          title: trackTitle,
          artist: artistName,
          url: trackUrl,
          imageUrl: coverImageUri || `https://picsum.photos/300/300?random=${Math.random()}`,
          duration: 180,
          streamCount: parseInt(initialStreamCount) || 0,
          uploadedBy: user?.id || 'anonymous',
          source: detectSourceFromUrl(trackUrl) as 'soundcloud' | 'youtube' | 'spotify' | 'file'
        };
      }
      
      console.log('Final track to upload:', finalTrack);
      
      await addTrack(finalTrack);
      
      // Reset form and progress
      setTrackTitle('');
      setArtistName('');
      setTrackUrl('');
      setCoverImageUri('');
      setInitialStreamCount('');
      setGenre('');
      setSelectedMethod(null);
      setUploadProgress(0);
      setUploadStatus('idle');
      
      // Show success message
      if (selectedMethod === 'file') {
        Alert.alert(
          'Uploaded to Supabase! 🚀🎵',
          `"${finalTrack.title}" has been uploaded to Supabase Storage and will play on all your devices!\n\n✓ Cross-device playback enabled\n✓ Secure cloud storage\n✓ Fast global delivery`,
          [{ text: 'Awesome!' }]
        );
      } else {
        Alert.alert('Success', 'Track uploaded successfully and will sync across all devices!');
      }
      console.log('=== UPLOAD PROCESS COMPLETE ===');
      
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload track');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('idle');
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-800">
          <Text className="text-2xl font-bold text-white">Upload Track</Text>
          <Text className="text-gray-400 mt-1">Share your music with the world</Text>
        </View>
        
        <View className="p-4">
          {!selectedMethod ? (
            // Upload method selection
            <View className="space-y-4">
              <Text className="text-white text-lg font-semibold mb-2">Choose upload method</Text>
              <Text className="text-gray-400 text-sm mb-4">
                For the best experience, we recommend uploading audio files directly from your device
              </Text>
              
              <AnimatedPressable
                entering={FadeInUp.delay(100)}
                onPress={() => {
                  Alert.alert(
                    'Coming Soon! 🚀',
                    'Platform link support (SoundCloud, YouTube, Spotify) is coming in a future update.\n\nFor now, please use the "Upload File" option for the best audio quality and reliability!',
                    [{ text: 'Got it!' }]
                  );
                }}
                className="bg-gray-900 rounded-2xl p-6 border border-gray-700 relative"
              >
                {/* Coming Soon Badge */}
                <View className="absolute top-3 right-3 bg-purple-600 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">Coming Soon</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-gray-600 rounded-xl items-center justify-center mr-4">
                    <Ionicons name="link" size={24} color="#9CA3AF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-lg font-semibold">From Link</Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      SoundCloud, YouTube, Spotify URLs (in development)
                    </Text>
                  </View>
                  <Ionicons name="information-circle" size={20} color="#6B7280" />
                </View>
              </AnimatedPressable>
              
              <AnimatedPressable
                entering={FadeInUp.delay(200)}
                onPress={() => {
                  setSelectedMethod('file');
                  handleFilePicker();
                }}
                className="bg-purple-600/20 border-2 border-purple-500 rounded-2xl p-6 relative"
              >
                {/* Recommended Badge */}
                <View className="absolute top-3 right-3 bg-green-600 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">Recommended</Text>
                </View>
                
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-purple-600 rounded-xl items-center justify-center mr-4">
                    <MaterialIcons name="upload-file" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-lg font-semibold">Upload File</Text>
                    <Text className="text-purple-200 text-sm mt-1">
                      ☁️ Cloud storage • Plays on all devices • MP3, WAV, M4A
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </View>
              </AnimatedPressable>
              

            </View>
          ) : (
            // Upload form
            <Animated.View entering={FadeInDown} className="space-y-6">
              <View className="flex-row items-center mb-4">
                <Pressable onPress={() => setSelectedMethod(null)} className="mr-3">
                  <Ionicons name="chevron-back" size={24} color="white" />
                </Pressable>
                <Text className="text-white text-lg font-semibold">
                  {selectedMethod === 'link' ? 'Add from Link' : 'Upload File'}
                </Text>
              </View>
              
              {selectedMethod === 'link' && (
                <View>
                  <Text className="text-white text-sm font-medium mb-2">Track URL *</Text>
                  <TextInput
                    value={trackUrl}
                    onChangeText={async (text) => {
                      setTrackUrl(text);
                      
                      // Auto-preview platform URLs
                      if (text && platformService.isValidPlatformUrl(text)) {
                        setLoadingPreview(true);
                        try {
                          const preview = await platformService.getTrackFromUrl(text);
                          setPlatformPreview(preview);
                          
                          // Auto-fill title and artist if not already filled
                          if (!trackTitle) setTrackTitle(preview.title);
                          if (!artistName) setArtistName(preview.artist);
                        } catch (error) {
                          console.error('Preview failed:', error);
                          setPlatformPreview(null);
                        }
                        setLoadingPreview(false);
                      } else {
                        setPlatformPreview(null);
                      }
                    }}
                    placeholder="Paste SoundCloud, YouTube, or Spotify URL"
                    placeholderTextColor="#6B7280"
                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                    autoCapitalize="none"
                  />
                  
                  {/* Platform Preview */}
                  {loadingPreview && (
                    <View className="bg-gray-800 rounded-xl p-4 mt-3 border border-gray-600">
                      <View className="flex-row items-center">
                        <Ionicons name="hourglass" size={20} color="#A855F7" />
                        <Text className="text-gray-300 ml-2">Loading track info...</Text>
                      </View>
                    </View>
                  )}
                  
                  {platformPreview && (
                    <Animated.View 
                      entering={FadeInUp.delay(100)}
                      className="bg-gray-800 rounded-xl p-4 mt-3 border border-purple-500/30"
                    >
                      <View className="flex-row items-center mb-2">
                        <Ionicons 
                          name={platformPreview.platform === 'soundcloud' ? 'cloud' : 
                                platformPreview.platform === 'youtube' ? 'play' : 'musical-notes'} 
                          size={20} 
                          color="#A855F7" 
                        />
                        <Text className="text-purple-400 ml-2 font-medium capitalize">
                          {platformService.getPlatformName(platformPreview.originalUrl)}
                        </Text>
                        {platformPreview.isPreviewOnly && (
                          <View className="bg-orange-600 px-2 py-1 rounded ml-2">
                            <Text className="text-white text-xs">30s Preview</Text>
                          </View>
                        )}
                      </View>
                      
                      <View className="flex-row">
                        {platformPreview.thumbnailUrl && (
                          <Image
                            source={{ uri: platformPreview.thumbnailUrl }}
                            className="w-16 h-16 rounded-lg mr-3"
                          />
                        )}
                        <View className="flex-1">
                          <Text className="text-white font-semibold" numberOfLines={1}>
                            {platformPreview.title}
                          </Text>
                          <Text className="text-gray-400 text-sm" numberOfLines={1}>
                            {platformPreview.artist}
                          </Text>
                          <Text className="text-gray-500 text-xs mt-1">
                            Duration: {Math.floor(platformPreview.duration / 60)}:{(platformPreview.duration % 60).toString().padStart(2, '0')}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  )}
                </View>
              )}
              
              {selectedMethod === 'file' && trackUrl && (
                <View className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <View className="flex-row items-center">
                    <Ionicons name="musical-note" size={24} color="#A855F7" />
                    <Text className="text-white ml-3 flex-1" numberOfLines={1}>
                      {trackUrl.split('/').pop()}
                    </Text>
                  </View>
                </View>
              )}
              
              <View>
                <Text className="text-white text-sm font-medium mb-2">Track Title *</Text>
                <TextInput
                  value={trackTitle}
                  onChangeText={setTrackTitle}
                  placeholder="Enter track title"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                />
              </View>
              
              <View>
                <Text className="text-white text-sm font-medium mb-2">Artist Name *</Text>
                <TextInput
                  value={artistName}
                  onChangeText={setArtistName}
                  placeholder="Enter artist name"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                />
              </View>
              
              <View>
                <Text className="text-white text-sm font-medium mb-2">Genre</Text>
                <TextInput
                  value={genre}
                  onChangeText={setGenre}
                  placeholder="e.g. Hip-Hop, Pop, Rock, R&B"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                />
                <Text className="text-gray-500 text-xs mt-1">
                  Genre helps AI generate better cover art
                </Text>
              </View>
              
              {/* Cover Image Section */}
              <View>
                <Text className="text-white text-sm font-medium mb-3">Cover Image</Text>
                
                {coverImageUri ? (
                  <View className="items-center">
                    <Image
                      source={{ uri: coverImageUri }}
                      className="w-40 h-40 rounded-xl mb-3"
                      resizeMode="cover"
                    />
                    <View className="flex-row space-x-3">
                      <Pressable
                        onPress={generateAICover}
                        disabled={generatingAI || !trackTitle || !artistName}
                        className={`bg-purple-600 rounded-lg px-4 py-2 flex-row items-center ${generatingAI || !trackTitle || !artistName ? 'opacity-50' : ''}`}
                      >
                        <Ionicons name="sparkles" size={16} color="white" />
                        <Text className="text-white text-sm font-medium ml-1">
                          {generatingAI ? 'Generating...' : 'AI Regenerate'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={showImagePickerOptions}
                        className="bg-gray-600 rounded-lg px-4 py-2 flex-row items-center"
                      >
                        <Ionicons name="image" size={16} color="white" />
                        <Text className="text-white text-sm font-medium ml-1">Change</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="space-y-3">
                    <Pressable
                      onPress={generateAICover}
                      disabled={generatingAI || !trackTitle || !artistName}
                      className={`bg-purple-600 rounded-xl p-4 items-center ${generatingAI || !trackTitle || !artistName ? 'opacity-50' : ''}`}
                    >
                      <View className="w-16 h-16 bg-purple-700 rounded-xl items-center justify-center mb-3">
                        <Ionicons name={generatingAI ? "hourglass" : "sparkles"} size={32} color="white" />
                      </View>
                      <Text className="text-white font-medium mb-1">
                        {generatingAI ? 'Generating AI Cover...' : '🎨 Generate with AI'}
                      </Text>
                      <Text className="text-purple-200 text-sm text-center">
                        {!trackTitle || !artistName ? 'Enter title & artist first' : 'Create unique cover art instantly'}
                      </Text>
                    </Pressable>
                    
                    <Text className="text-gray-400 text-center text-sm">OR</Text>
                    
                    <Pressable
                      onPress={showImagePickerOptions}
                      className="bg-gray-900 border border-gray-700 rounded-xl p-4 items-center"
                    >
                      <View className="w-16 h-16 bg-gray-700 rounded-xl items-center justify-center mb-3">
                        <Ionicons name="image-outline" size={32} color="#A855F7" />
                      </View>
                      <Text className="text-white font-medium mb-1">Choose Your Own Image</Text>
                      <Text className="text-gray-400 text-sm text-center">
                        Upload from camera or photo library
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
              
              <View>
                <Text className="text-white text-sm font-medium mb-2">Current Stream Count</Text>
                <TextInput
                  value={initialStreamCount}
                  onChangeText={setInitialStreamCount}
                  placeholder="Enter existing stream count (optional)"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                  keyboardType="numeric"
                />
                <Text className="text-gray-500 text-xs mt-1">
                  If this track already has streams on other platforms, enter the count to continue from that number
                </Text>
              </View>
              
              {/* Preview Section */}
              {trackTitle && artistName && (
                <Animated.View 
                  entering={FadeInUp.delay(200)}
                  className="bg-gray-800 rounded-xl p-4 border border-purple-500/30"
                >
                  <Text className="text-white text-sm font-medium mb-3">Preview</Text>
                  <View className="flex-row">
                    <View className="w-16 h-16 bg-gray-700 rounded-lg items-center justify-center mr-3">
                      {coverImageUri ? (
                        <Image
                          source={{ uri: coverImageUri }}
                          className="w-full h-full rounded-lg"
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="musical-notes" size={24} color="#A855F7" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base">{trackTitle}</Text>
                      <Text className="text-gray-400 text-sm">{artistName}</Text>
                      <Text className="text-purple-400 text-xs mt-1">
                        {initialStreamCount ? `Starting with ${initialStreamCount} streams` : 'New release'}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )}
              
              <AnimatedPressable
                entering={FadeInUp.delay(300)}
                onPress={handleUpload}
                disabled={uploading || !trackTitle || !artistName || !trackUrl}
                className={`bg-purple-600 rounded-xl py-4 mt-6 ${
                  uploading || !trackTitle || !artistName || !trackUrl ? 'opacity-50' : ''
                }`}
              >
                {uploading ? (
                  <View className="items-center">
                    <Text className="text-white text-center text-lg font-semibold mb-2">
                      {uploadStatus === 'uploading' ? `Uploading to Cloud... ${uploadProgress}%` :
                       uploadStatus === 'processing' ? 'Processing...' :
                       uploadStatus === 'complete' ? 'Saving to Database...' : 'Uploading...'}
                    </Text>
                    
                    {/* Progress Bar */}
                    <View className="w-full bg-gray-700 rounded-full h-2">
                      <View 
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </View>
                  </View>
                ) : (
                  <Text className="text-white text-center text-lg font-semibold">
  {selectedMethod === 'file' ? 'Upload to Supabase ☁️' : 'Upload Track'}
                  </Text>
                )}
              </AnimatedPressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}