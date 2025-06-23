import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMessagesStore, Message } from '../state/messages';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp, FadeInRight, FadeInLeft } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId, otherUserId } = route.params as { conversationId: string; otherUserId: string };
  
  const { messages, sendMessage, markAsRead, setTyping } = useMessagesStore();
  const { user } = useAuthStore();
  const { getUserById } = useUsersStore();
  
  const [messageText, setMessageText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const otherUser = getUserById(otherUserId);
  const conversationMessages = messages[conversationId] || [];
  
  useEffect(() => {
    if (user) {
      markAsRead(conversationId, user.id);
    }
  }, [conversationId, user]);
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [conversationMessages.length]);
  
  const handleSendMessage = () => {
    if (!messageText.trim() || !user) return;
    
    sendMessage(conversationId, {
      text: messageText.trim(),
      senderId: user.id,
      receiverId: otherUserId,
      isRead: false,
      type: 'text'
    });
    
    setMessageText('');
    setTyping(conversationId, user.id, false);
  };
  
  const handleTyping = (text: string) => {
    setMessageText(text);
    if (user) {
      setTyping(conversationId, user.id, text.length > 0);
    }
  };
  
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow microphone access to send voice messages');
        return;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: 2, // MPEG_4
          audioEncoder: 3, // AAC
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: 'mp4',
          audioQuality: 1, // High quality
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };
      
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };
  
  const stopRecording = async () => {
    if (!recording || !user) return;
    
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        sendMessage(conversationId, {
          text: 'Voice message',
          senderId: user.id,
          receiverId: otherUserId,
          isRead: false,
          type: 'audio',
          audioUrl: uri
        });
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0] && user) {
        sendMessage(conversationId, {
          text: 'Photo',
          senderId: user.id,
          receiverId: otherUserId,
          isRead: false,
          type: 'image',
          imageUrl: result.assets[0].uri
        });
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
    }
  };
  
  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderMessage = (message: Message, index: number) => {
    const isFromCurrentUser = message.senderId === user?.id;
    const showTime = index === 0 || 
      new Date(conversationMessages[index - 1]?.timestamp).getTime() - new Date(message.timestamp).getTime() > 300000; // 5 minutes
    
    return (
      <Animated.View
        key={message.id}
        entering={isFromCurrentUser ? FadeInRight.delay(index * 50) : FadeInLeft.delay(index * 50)}
        className={`mb-2 ${isFromCurrentUser ? 'items-end' : 'items-start'}`}
      >
        {showTime && (
          <Text className="text-gray-500 text-xs mb-1 text-center w-full">
            {formatMessageTime(message.timestamp)}
          </Text>
        )}
        
        <View className={`max-w-[80%] ${isFromCurrentUser ? 'items-end' : 'items-start'}`}>
          <View className={`px-4 py-2 rounded-2xl ${
            isFromCurrentUser 
              ? 'bg-purple-600 rounded-br-lg' 
              : 'bg-gray-800 rounded-bl-lg'
          }`}>
            {message.type === 'text' && (
              <Text className="text-white text-base">{message.text}</Text>
            )}
            
            {message.type === 'audio' && (
              <View className="flex-row items-center">
                <Ionicons name="play" size={16} color="white" />
                <Text className="text-white ml-2">Voice message</Text>
                <View className="w-20 h-1 bg-white/30 rounded ml-2" />
              </View>
            )}
            
            {message.type === 'image' && message.imageUrl && (
              <Image
                source={{ uri: message.imageUrl }}
                className="w-48 h-36 rounded-lg"
                resizeMode="cover"
              />
            )}
          </View>
          
          {isFromCurrentUser && (
            <View className="flex-row items-center mt-1">
              <Text className="text-gray-500 text-xs mr-1">
                {message.isRead ? 'Read' : 'Delivered'}
              </Text>
              <Ionicons 
                name={message.isRead ? 'checkmark-done' : 'checkmark'} 
                size={12} 
                color={message.isRead ? '#A855F7' : '#6B7280'} 
              />
            </View>
          )}
        </View>
      </Animated.View>
    );
  };
  
  if (!otherUser) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">User not found</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          
          <View className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center mr-3">
            {otherUser.profileImage ? (
              <Image
                source={{ uri: otherUser.profileImage }}
                className="w-full h-full rounded-full"
              />
            ) : (
              <Text className="text-white text-sm font-bold">
                {otherUser.username[0]?.toUpperCase()}
              </Text>
            )}
          </View>
          
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">{otherUser.username}</Text>
            <Text className="text-gray-400 text-sm">Active now</Text>
          </View>
          
          <View className="flex-row space-x-4">
            <Pressable>
              <Ionicons name="videocam-outline" size={24} color="white" />
            </Pressable>
            <Pressable>
              <Ionicons name="call-outline" size={24} color="white" />
            </Pressable>
            <Pressable>
              <Ionicons name="information-circle-outline" size={24} color="white" />
            </Pressable>
          </View>
        </View>
        
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-4 py-2"
          showsVerticalScrollIndicator={false}
        >
          {conversationMessages.map((message, index) => renderMessage(message, index))}
        </ScrollView>
        
        {/* Message Input */}
        <View className="flex-row items-end px-4 py-3 border-t border-gray-800">
          <Pressable onPress={pickImage} className="mr-3 mb-2">
            <Ionicons name="camera-outline" size={24} color="white" />
          </Pressable>
          
          <View className="flex-1 bg-gray-900 rounded-full flex-row items-center px-4 py-2 mr-3">
            <TextInput
              value={messageText}
              onChangeText={handleTyping}
              placeholder="Message..."
              placeholderTextColor="#6B7280"
              className="flex-1 text-white text-base"
              multiline
              maxLength={1000}
            />
            
            {messageText.length === 0 && (
              <Pressable className="ml-2">
                <Ionicons name="happy-outline" size={20} color="#6B7280" />
              </Pressable>
            )}
          </View>
          
          {messageText.trim().length > 0 ? (
            <AnimatedPressable
              entering={FadeInUp}
              onPress={handleSendMessage}
              className="bg-purple-600 rounded-full w-8 h-8 items-center justify-center"
            >
              <Ionicons name="arrow-up" size={20} color="white" />
            </AnimatedPressable>
          ) : (
            <Pressable
              onPressIn={startRecording}
              onPressOut={stopRecording}
              className={`rounded-full w-8 h-8 items-center justify-center ${
                isRecording ? 'bg-red-600' : 'bg-purple-600'
              }`}
            >
              <Ionicons 
                name={isRecording ? 'stop' : 'mic'} 
                size={16} 
                color="white" 
              />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}