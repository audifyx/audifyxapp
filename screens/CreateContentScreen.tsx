import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useContentStore } from '../state/content';
import { useAuthStore } from '../state/auth';
import { ContentType, ContentPrivacy } from '../types/content';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ContentTypeOption {
  type: ContentType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  supportedFormats: string[];
}

const CONTENT_TYPES: ContentTypeOption[] = [
  {
    type: 'track',
    title: 'Music Track',
    description: 'Upload your original music tracks',
    icon: 'musical-notes',
    color: '#A855F7',
    supportedFormats: ['MP3', 'WAV', 'FLAC', 'M4A']
  },
  {
    type: 'video',
    title: 'Music Video',
    description: 'Share your music videos and performances',
    icon: 'videocam',
    color: '#EF4444',
    supportedFormats: ['MP4', 'MOV', 'AVI']
  },
  {
    type: 'reel',
    title: 'Audio Reel',
    description: 'Create short-form music content',
    icon: 'film',
    color: '#F59E0B',
    supportedFormats: ['MP4', 'MOV']
  },
  {
    type: 'story',
    title: 'Story',
    description: '24-hour disappearing content',
    icon: 'time',
    color: '#10B981',
    supportedFormats: ['MP4', 'MOV', 'JPG', 'PNG']
  },
  {
    type: 'podcast',
    title: 'Podcast',
    description: 'Long-form audio content',
    icon: 'mic',
    color: '#8B5CF6',
    supportedFormats: ['MP3', 'WAV', 'M4A']
  },
  {
    type: 'live_stream',
    title: 'Live Stream',
    description: 'Start a live performance',
    icon: 'radio',
    color: '#FF1744',
    supportedFormats: []
  }
];

interface ContentFormProps {
  contentType: ContentType;
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const ContentForm: React.FC<ContentFormProps> = ({ contentType, onCancel, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [thumbnailUri, setThumbnailUri] = useState('');
  const [privacy, setPrivacy] = useState<ContentPrivacy>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDownloads, setAllowDownloads] = useState(false);
  const [isExplicit, setIsExplicit] = useState(false);
  
  // Track-specific fields
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [tempo, setTempo] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  const [price, setPrice] = useState('0');
  
  // Video-specific fields
  const [videoType, setVideoType] = useState('music_video');
  
  // Reel-specific fields
  const [hashtags, setHashtags] = useState('');
  
  // Podcast-specific fields
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [seasonNumber, setSeasonNumber] = useState('');
  
  const contentTypeConfig = CONTENT_TYPES.find(ct => ct.type === contentType);
  
  const handleFilePicker = async () => {
    try {
      let result;
      
      if (contentType === 'track' || contentType === 'podcast') {
        result = await DocumentPicker.getDocumentAsync({
          type: ['audio/*'],
          copyToCacheDirectory: true,
        });
      } else if (contentType === 'video' || contentType === 'reel') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          quality: 0.8,
        });
      } else if (contentType === 'story') {
        const options = await new Promise<'image' | 'video' | null>((resolve) => {
          Alert.alert(
            'Story Type',
            'What type of story would you like to create?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
              { text: 'Image', onPress: () => resolve('image') },
              { text: 'Video', onPress: () => resolve('video') },
            ]
          );
        });
        
        if (!options) return;
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: options === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
          quality: 0.8,
        });
      }
      
      if (result && !result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };
  
  const handleThumbnailPicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [16, 9],
      });
      
      if (!result.canceled && result.assets[0]) {
        setThumbnailUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick thumbnail. Please try again.');
    }
  };
  
  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    if (!selectedFile && contentType !== 'live_stream') {
      Alert.alert('Error', 'Please select a file');
      return;
    }
    
    if (contentType === 'track' && !artist.trim()) {
      Alert.alert('Error', 'Please enter the artist name');
      return;
    }
    
    const formData = {
      title: title.trim(),
      description: description.trim(),
      fileUrl: selectedFile?.uri || '',
      thumbnailUrl: thumbnailUri,
      privacy,
      allowComments,
      allowDownloads,
      isExplicit,
      duration: selectedFile?.duration || 0,
      
      // Track-specific
      ...(contentType === 'track' && {
        artist: artist.trim(),
        genre: genre.trim(),
        mood: mood.trim(),
        tempo: tempo ? parseInt(tempo) : undefined,
        instrumental,
        price: parseFloat(price) || 0,
      }),
      
      // Video-specific
      ...(contentType === 'video' && {
        videoType,
        aspectRatio: '16:9',
        resolution: '1080p',
        fps: 30,
        hasCaptions: false,
      }),
      
      // Reel-specific
      ...(contentType === 'reel' && {
        hashtags: hashtags.split(' ').filter(tag => tag.startsWith('#')),
        mentions: [],
        aspectRatio: '9:16',
        effectsUsed: [],
      }),
      
      // Story-specific
      ...(contentType === 'story' && {
        storyType: selectedFile?.type?.startsWith('video') ? 'video' : 'image',
        effectsUsed: [],
      }),
      
      // Podcast-specific
      ...(contentType === 'podcast' && {
        episodeNumber: episodeNumber ? parseInt(episodeNumber) : undefined,
        seasonNumber: seasonNumber ? parseInt(seasonNumber) : undefined,
        hosts: [],
        guests: [],
        chapters: [],
      }),
      
      // Live stream-specific
      ...(contentType === 'live_stream' && {
        chatEnabled: true,
        allowTips: true,
      }),
    };
    
    onSubmit(formData);
  };
  
  return (
    <ScrollView className="flex-1 p-4">
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <View 
          className="w-12 h-12 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: contentTypeConfig?.color + '20' }}
        >
          <Ionicons name={contentTypeConfig?.icon || 'document'} size={24} color={contentTypeConfig?.color} />
        </View>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">{contentTypeConfig?.title}</Text>
          <Text className="text-gray-400 text-sm">{contentTypeConfig?.description}</Text>
        </View>
      </View>
      
      {/* File Selection */}
      {contentType !== 'live_stream' && (
        <View className="mb-6">
          <Text className="text-white text-base font-medium mb-3">
            {contentType === 'story' ? 'Media File' : 'Select File'}
          </Text>
          
          {selectedFile ? (
            <View className="bg-gray-800 rounded-xl p-4">
              <View className="flex-row items-center">
                <Ionicons name="document" size={20} color="#10B981" />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium" numberOfLines={1}>
                    {selectedFile.name || 'Selected file'}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedFile(null)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={handleFilePicker}
              className="border-2 border-dashed border-gray-600 rounded-xl p-8 items-center"
            >
              <Ionicons name="cloud-upload-outline" size={48} color="#6B7280" />
              <Text className="text-gray-400 text-center mt-4">
                Tap to select {contentType === 'story' ? 'image or video' : contentTypeConfig?.supportedFormats.join(', ')} file
              </Text>
            </Pressable>
          )}
        </View>
      )}
      
      {/* Basic Info */}
      <View className="mb-6">
        <Text className="text-white text-base font-medium mb-2">Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter title..."
          placeholderTextColor="#6B7280"
          className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
        />
      </View>
      
      <View className="mb-6">
        <Text className="text-white text-base font-medium mb-2">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your content..."
          placeholderTextColor="#6B7280"
          className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
      
      {/* Track-specific fields */}
      {contentType === 'track' && (
        <>
          <View className="mb-6">
            <Text className="text-white text-base font-medium mb-2">Artist *</Text>
            <TextInput
              value={artist}
              onChangeText={setArtist}
              placeholder="Artist name..."
              placeholderTextColor="#6B7280"
              className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
            />
          </View>
          
          <View className="flex-row mb-6">
            <View className="flex-1 mr-3">
              <Text className="text-white text-base font-medium mb-2">Genre</Text>
              <TextInput
                value={genre}
                onChangeText={setGenre}
                placeholder="Hip-Hop, R&B, etc."
                placeholderTextColor="#6B7280"
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-medium mb-2">Mood</Text>
              <TextInput
                value={mood}
                onChangeText={setMood}
                placeholder="Chill, Energetic, etc."
                placeholderTextColor="#6B7280"
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
          </View>
          
          <View className="flex-row mb-6">
            <View className="flex-1 mr-3">
              <Text className="text-white text-base font-medium mb-2">Tempo (BPM)</Text>
              <TextInput
                value={tempo}
                onChangeText={setTempo}
                placeholder="120"
                placeholderTextColor="#6B7280"
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-medium mb-2">Price ($)</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor="#6B7280"
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          <View className="flex-row items-center justify-between mb-6 bg-gray-800 rounded-xl p-4">
            <Text className="text-white font-medium">Instrumental Track</Text>
            <Switch
              value={instrumental}
              onValueChange={setInstrumental}
              trackColor={{ false: '#374151', true: '#A855F7' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </>
      )}
      
      {/* Reel-specific fields */}
      {contentType === 'reel' && (
        <View className="mb-6">
          <Text className="text-white text-base font-medium mb-2">Hashtags</Text>
          <TextInput
            value={hashtags}
            onChangeText={setHashtags}
            placeholder="#music #beat #viral"
            placeholderTextColor="#6B7280"
            className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
          />
          <Text className="text-gray-500 text-xs mt-1">Separate hashtags with spaces</Text>
        </View>
      )}
      
      {/* Podcast-specific fields */}
      {contentType === 'podcast' && (
        <View className="flex-row mb-6">
          <View className="flex-1 mr-3">
            <Text className="text-white text-base font-medium mb-2">Season</Text>
            <TextInput
              value={seasonNumber}
              onChangeText={setSeasonNumber}
              placeholder="1"
              placeholderTextColor="#6B7280"
              className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-medium mb-2">Episode</Text>
            <TextInput
              value={episodeNumber}
              onChangeText={setEpisodeNumber}
              placeholder="1"
              placeholderTextColor="#6B7280"
              className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
              keyboardType="numeric"
            />
          </View>
        </View>
      )}
      
      {/* Thumbnail */}
      <View className="mb-6">
        <Text className="text-white text-base font-medium mb-2">
          {contentType === 'video' || contentType === 'reel' ? 'Thumbnail' : 'Cover Image'}
        </Text>
        
        {thumbnailUri ? (
          <View className="relative">
            <Image
              source={{ uri: thumbnailUri }}
              className="w-full h-40 rounded-xl"
              resizeMode="cover"
            />
            <Pressable
              onPress={() => setThumbnailUri('')}
              className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={16} color="white" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleThumbnailPicker}
            className="border border-gray-600 rounded-xl p-8 items-center"
          >
            <Ionicons name="image-outline" size={32} color="#6B7280" />
            <Text className="text-gray-400 text-center mt-2">
              Add {contentType === 'video' || contentType === 'reel' ? 'thumbnail' : 'cover image'}
            </Text>
          </Pressable>
        )}
      </View>
      
      {/* Privacy Settings */}
      <View className="mb-6">
        <Text className="text-white text-base font-medium mb-3">Privacy & Settings</Text>
        
        <View className="bg-gray-800 rounded-xl p-4 space-y-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-white">Privacy</Text>
            <Pressable
              onPress={() => {
                const options: ContentPrivacy[] = ['public', 'unlisted', 'private', 'followers_only'];
                Alert.alert(
                  'Privacy Setting',
                  'Choose who can see this content',
                  options.map(option => ({
                    text: option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    onPress: () => setPrivacy(option)
                  }))
                );
              }}
              className="bg-gray-700 px-3 py-1 rounded-full"
            >
              <Text className="text-white text-sm capitalize">
                {privacy.replace('_', ' ')}
              </Text>
            </Pressable>
          </View>
          
          <View className="flex-row items-center justify-between">
            <Text className="text-white">Allow Comments</Text>
            <Switch
              value={allowComments}
              onValueChange={setAllowComments}
              trackColor={{ false: '#374151', true: '#A855F7' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View className="flex-row items-center justify-between">
            <Text className="text-white">Allow Downloads</Text>
            <Switch
              value={allowDownloads}
              onValueChange={setAllowDownloads}
              trackColor={{ false: '#374151', true: '#A855F7' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View className="flex-row items-center justify-between">
            <Text className="text-white">Explicit Content</Text>
            <Switch
              value={isExplicit}
              onValueChange={setIsExplicit}
              trackColor={{ false: '#374151', true: '#A855F7' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View className="flex-row space-x-4 mb-8">
        <Pressable
          onPress={onCancel}
          className="flex-1 bg-gray-800 rounded-xl py-4 items-center"
        >
          <Text className="text-white font-semibold">Cancel</Text>
        </Pressable>
        
        <Pressable
          onPress={handleSubmit}
          className="flex-1 bg-purple-600 rounded-xl py-4 items-center"
        >
          <Text className="text-white font-semibold">
            {contentType === 'live_stream' ? 'Start Live Stream' : 'Upload'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default function CreateContentScreen() {
  const { addContent, addStory, startLiveStream } = useContentStore();
  const { user } = useAuthStore();
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const handleContentTypeSelect = (contentType: ContentType) => {
    if (contentType === 'live_stream') {
      Alert.alert(
        'Start Live Stream',
        'Ready to go live? Make sure you have a stable internet connection.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => setSelectedContentType(contentType) }
        ]
      );
    } else {
      setSelectedContentType(contentType);
    }
  };
  
  const handleFormSubmit = async (formData: any) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to upload content');
      return;
    }
    
    setUploading(true);
    
    try {
      const contentData = {
        ...formData,
        creatorId: user.id,
        uploadStatus: 'published' as const,
        publishedAt: new Date(),
      };
      
      let contentId: string;
      
      if (selectedContentType === 'story') {
        contentId = await addStory(contentData);
      } else if (selectedContentType === 'live_stream') {
        contentId = await startLiveStream(contentData);
      } else {
        contentId = await addContent({
          ...contentData,
          contentType: selectedContentType!,
        });
      }
      
      Alert.alert(
        'Success!',
        `Your ${selectedContentType?.replace('_', ' ')} has been ${
          selectedContentType === 'live_stream' ? 'started' : 'uploaded'
        } successfully.`,
        [
          {
            text: 'OK',
            onPress: () => setSelectedContentType(null)
          }
        ]
      );
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload content. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  if (selectedContentType) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
          <Pressable
            onPress={() => setSelectedContentType(null)}
            disabled={uploading}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-lg font-semibold">Create Content</Text>
        </View>
        
        <ContentForm
          contentType={selectedContentType}
          onCancel={() => setSelectedContentType(null)}
          onSubmit={handleFormSubmit}
        />
        
        {uploading && (
          <View className="absolute inset-0 bg-black/80 items-center justify-center">
            <View className="bg-gray-900 rounded-xl p-6 items-center">
              <Ionicons name="cloud-upload" size={48} color="#A855F7" />
              <Text className="text-white font-semibold text-lg mt-4">
                {selectedContentType === 'live_stream' ? 'Starting Stream...' : 'Uploading...'}
              </Text>
              <Text className="text-gray-400 text-sm mt-2">Please wait</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-800">
        <Text className="text-white text-2xl font-bold">Create Content</Text>
        <Text className="text-gray-400 text-sm mt-1">Choose what type of content to create</Text>
      </View>
      
      {/* Content Type Selection */}
      <ScrollView className="flex-1 p-4">
        <View className="space-y-4">
          {CONTENT_TYPES.map((contentType, index) => (
            <AnimatedPressable
              key={contentType.type}
              entering={FadeInUp.delay(index * 100)}
              onPress={() => handleContentTypeSelect(contentType.type)}
              className="bg-gray-900 rounded-xl p-4 flex-row items-center"
            >
              <View 
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: contentType.color + '20' }}
              >
                <Ionicons 
                  name={contentType.icon} 
                  size={24} 
                  color={contentType.color} 
                />
              </View>
              
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">
                  {contentType.title}
                </Text>
                <Text className="text-gray-400 text-sm mt-1">
                  {contentType.description}
                </Text>
                {contentType.supportedFormats.length > 0 && (
                  <Text className="text-gray-500 text-xs mt-1">
                    Supports: {contentType.supportedFormats.join(', ')}
                  </Text>
                )}
              </View>
              
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </AnimatedPressable>
          ))}
        </View>
        
        {/* Quick Actions */}
        <View className="mt-8">
          <Text className="text-white text-lg font-semibold mb-4">Quick Actions</Text>
          
          <View className="flex-row space-x-4">
            <Pressable
              onPress={() => handleContentTypeSelect('reel')}
              className="flex-1 bg-yellow-600/20 border border-yellow-600/30 rounded-xl p-4 items-center"
            >
              <Ionicons name="flash" size={24} color="#F59E0B" />
              <Text className="text-yellow-400 font-medium mt-2">Quick Reel</Text>
            </Pressable>
            
            <Pressable
              onPress={() => handleContentTypeSelect('live_stream')}
              className="flex-1 bg-red-600/20 border border-red-600/30 rounded-xl p-4 items-center"
            >
              <Ionicons name="radio" size={24} color="#EF4444" />
              <Text className="text-red-400 font-medium mt-2">Go Live</Text>
            </Pressable>
          </View>
        </View>
        
        {/* Tips */}
        <View className="mt-8 bg-purple-600/10 border border-purple-600/20 rounded-xl p-4">
          <View className="flex-row items-start">
            <Ionicons name="bulb" size={20} color="#A855F7" />
            <View className="ml-3 flex-1">
              <Text className="text-purple-400 font-medium">Content Tips</Text>
              <Text className="text-purple-200 text-sm mt-1">
                • Use descriptive titles and tags{'\n'}
                • Add high-quality cover images{'\n'}
                • Engage with your audience in comments{'\n'}
                • Post consistently to build your following
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}