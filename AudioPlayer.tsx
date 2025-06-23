import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useMusicStore } from '../state/music';
import Animated, { 
  FadeInUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AudioPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    togglePlayback, 
    setCurrentTime 
  } = useMusicStore();
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  const progressWidth = useSharedValue(0);
  const isDragging = useSharedValue(false);
  
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);
  
  useEffect(() => {
    if (currentTrack && !sound) {
      loadAndPlaySound();
    } else if (!currentTrack && sound) {
      cleanupSound();
    }
  }, [currentTrack]);
  
  useEffect(() => {
    if (sound) {
      if (isPlaying) {
        sound.playAsync().catch(console.error);
      } else {
        sound.pauseAsync().catch(console.error);
      }
    }
  }, [isPlaying, sound]);
  
  const cleanupSound = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error unloading sound:', error);
      }
      setSound(null);
      soundRef.current = null;
    }
  };
  
  const loadAndPlaySound = async () => {
    if (!currentTrack?.url) {
      console.log('No track URL provided');
      return;
    }
    
    console.log('=== AUDIO PLAYER DEBUG ===');
    console.log('Track title:', currentTrack.title);
    console.log('Track artist:', currentTrack.artist);
    console.log('Track URL:', currentTrack.url);
    console.log('Track source:', currentTrack.source);
    console.log('URL type:', typeof currentTrack.url);
    console.log('URL length:', currentTrack.url.length);
    
    setIsLoading(true);
    setHasError(false);
    
    // Cleanup existing sound first
    await cleanupSound();
    
    try {
      // Check if it's a platform streaming URL
      if (currentTrack.source === 'soundcloud' || 
          currentTrack.source === 'youtube' || 
          currentTrack.source === 'spotify') {
        console.log('Platform streaming URL detected:', currentTrack.source);
        
        // If the URL is a direct stream URL (from platform API), allow it
        if (currentTrack.url.includes('api.soundcloud.com') ||
            currentTrack.url.includes('p.scdn.co') ||
            currentTrack.url.includes('youtube-audio-proxy')) {
          console.log('Valid platform stream URL, proceeding...');
        } else {
          // Original platform page URL - cannot be played directly
          throw new Error(`This ${currentTrack.source} link cannot be played directly. The track was imported but may need platform API integration to stream.`);
        }
      }
      
      // Check if this is a legacy local file (from before cloud storage)
      if (currentTrack.url.startsWith('file://') || 
          currentTrack.url.includes('ExpoDocumentPicker') ||
          currentTrack.url.includes('/DocumentPicker/') ||
          currentTrack.url.includes('cache/')) {
        
        console.log('Legacy local file detected - uploaded before cloud storage was enabled');
        
        // Show helpful error for legacy local files
        throw new Error('This is a legacy local file uploaded before cloud storage was enabled. Please re-upload this track to enable cross-device playback.');
      }
      
      // More flexible URL validation for accessible files
      const isValidUrl = currentTrack.url.startsWith('http') || 
                        currentTrack.url.startsWith('content://') || // Android content URIs  
                        currentTrack.url.startsWith('ph://'); // iOS Photos framework
      
      if (!isValidUrl && !currentTrack.url.startsWith('file://')) {
        console.error('Invalid audio URL format:', currentTrack.url);
        throw new Error('Invalid audio file path or unsupported URL format');
      }
      
      console.log('Valid URL detected, creating sound...');
      
      // Set audio mode first for better compatibility
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      // Create new sound with robust config
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: currentTrack.url },
        { 
          shouldPlay: false,
          isLooping: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        // Callback for when loading completes/fails
        (status) => {
          if (status.isLoaded) {
            console.log('Audio loaded successfully');
          } else if ('error' in status) {
            console.error('Audio loading error:', status.error);
            runOnJS(setHasError)(true);
          }
        }
      );
      
      soundRef.current = newSound;
      setSound(newSound);
      console.log('Sound object created successfully');
      
      // Enhanced status callback with better error handling
      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          const position = status.positionMillis || 0;
          const trackDuration = status.durationMillis || (currentTrack.duration * 1000);
          
          setDuration(trackDuration);
          setCurrentTime(Math.floor(position / 1000));
          
          if (!isDragging.value && trackDuration > 0) {
            const progress = position / trackDuration;
            progressWidth.value = withTiming(Math.min(Math.max(progress, 0), 1));
          }
          
          if (status.didJustFinish) {
            console.log('Audio playback finished');
            runOnJS(togglePlayback)();
          }
        } else if ('error' in status) {
          console.error('Audio playback error:', status.error);
          console.error('Status details:', status);
          runOnJS(setHasError)(true);
          runOnJS(() => Alert.alert(
            'Playback Error', 
            'There was an issue playing this audio file. The file may be corrupted or in an unsupported format.'
          ))();
        }
      });
      
    } catch (error) {
      console.error('=== AUDIO LOADING ERROR ===');
      console.error('Error details:', error);
      console.error('Track that failed:', {
        title: currentTrack.title,
        url: currentTrack.url,
        source: currentTrack.source
      });
      console.error('=== END ERROR DETAILS ===');
      
      setHasError(true);
      
      // More specific error messages
      let errorMessage = 'Unable to load this audio file.';
      if (error instanceof Error) {
        if (error.message.includes('soundcloud') || 
            error.message.includes('youtube') || 
            error.message.includes('spotify')) {
          errorMessage = error.message;
        } else if (error.message.includes('format')) {
          errorMessage = 'Unsupported audio format. Please try MP3, WAV, or M4A files.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check file access permissions.';
        } else if (error.message.includes('Invalid audio file path')) {
          errorMessage = 'The audio file could not be found. Please try uploading the file again.';
        }
      }
      
      console.log('Showing error to user:', errorMessage);
      Alert.alert('Audio Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const seekToPosition = async (progress: number) => {
    if (sound && duration > 0) {
      try {
        const position = progress * duration;
        await sound.setPositionAsync(position);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };
  
  const progressGesture = Gesture.Pan()
    .onBegin(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      const progress = Math.max(0, Math.min(1, event.x / 280)); // 280 is approx progress bar width
      progressWidth.value = progress;
    })
    .onEnd((event) => {
      const progress = Math.max(0, Math.min(1, event.x / 280));
      runOnJS(seekToPosition)(progress);
      isDragging.value = false;
    });
  
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));
  
  if (!currentTrack) return null;
  
  return (
    <Animated.View
      entering={FadeInUp}
      className="absolute bottom-20 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-3"
    >
      <View className="flex-row items-center">
        {currentTrack.imageUrl ? (
          <Image
            source={{ uri: currentTrack.imageUrl }}
            className="w-12 h-12 rounded-lg mr-3"
          />
        ) : (
          <View className="w-12 h-12 rounded-lg bg-gray-800 items-center justify-center mr-3">
            <Ionicons name="musical-notes" size={16} color="#6B7280" />
          </View>
        )}
        
        <View className="flex-1">
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text className={`text-xs ${hasError ? 'text-red-400' : 'text-gray-400'}`} numberOfLines={1}>
            {hasError ? 'Audio Error - Tap retry button' : currentTrack.artist}
          </Text>
          
          {/* Progress Bar */}
          <View className="flex-row items-center mt-2">
            <Text className="text-gray-400 text-xs w-8">
              {formatTime(currentTime)}
            </Text>
            
            <GestureDetector gesture={progressGesture}>
              <View className="flex-1 mx-2">
                <View className="h-1 bg-gray-700 rounded-full">
                  <Animated.View
                    style={[progressBarStyle]}
                    className="h-full bg-purple-500 rounded-full"
                  />
                </View>
              </View>
            </GestureDetector>
            
            <Text className="text-gray-400 text-xs w-8">
              {formatTime(Math.floor(duration / 1000))}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center space-x-3 ml-3">
          <Pressable>
            <Ionicons name="heart-outline" size={20} color="white" />
          </Pressable>
          
          <AnimatedPressable
            onPress={hasError ? loadAndPlaySound : togglePlayback}
            disabled={isLoading}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              hasError ? 'bg-red-600' : 'bg-purple-600'
            }`}
          >
            {isLoading ? (
              <Ionicons name="hourglass" size={16} color="white" />
            ) : hasError ? (
              <Ionicons name="refresh" size={16} color="white" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={16}
                color="white"
              />
            )}
          </AnimatedPressable>
          
          <Pressable>
            <Ionicons name="list" size={20} color="white" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}