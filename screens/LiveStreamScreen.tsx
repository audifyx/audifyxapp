import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  Modal,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useContentStore } from '../state/content';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { LiveStream } from '../types/content';
import Animated, { 
  FadeInUp, 
  FadeInRight, 
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LiveChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'tip' | 'join' | 'system';
  tipAmount?: number;
}

interface LiveStreamPlayerProps {
  stream: LiveStream;
  onEndStream?: () => void;
  isOwner?: boolean;
}

const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({ 
  stream, 
  onEndStream, 
  isOwner = false 
}) => {
  const { user } = useAuthStore();
  const { allUsers } = useUsersStore();
  const { joinLiveStream, leaveLiveStream } = useContentStore();
  
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    {
      id: '1',
      userId: 'user-2',
      username: 'SarahM',
      message: 'This beat is fire! 🔥',
      timestamp: new Date(),
      type: 'chat'
    },
    {
      id: '2',
      userId: 'user-3',
      username: 'MikeP',
      message: 'Can you play something chill?',
      timestamp: new Date(),
      type: 'chat'
    },
    {
      id: '3',
      userId: 'user-4',
      username: 'JazzFan',
      message: 'Tipped $5.00',
      timestamp: new Date(),
      type: 'tip',
      tipAmount: 5.00
    }
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showTipModal, setShowTipModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const creator = allUsers?.find(u => u.id === stream.creatorId);
  const chatScrollRef = useRef<ScrollView>(null);
  
  const liveIndicatorOpacity = useSharedValue(1);
  const heartScale = useSharedValue(1);
  
  const animatedLiveStyle = useAnimatedStyle(() => ({
    opacity: liveIndicatorOpacity.value,
  }));
  
  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));
  
  useEffect(() => {
    // Animate live indicator
    liveIndicatorOpacity.value = withRepeat(
      withTiming(0.5, { duration: 1000 }),
      -1,
      true
    );
    
    // Join stream
    if (user) {
      joinLiveStream(stream.id, user.id);
    }
    
    return () => {
      // Leave stream on unmount
      if (user) {
        leaveLiveStream(stream.id, user.id);
      }
    };
  }, []);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;
    
    const message: LiveChatMessage = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      message: newMessage.trim(),
      timestamp: new Date(),
      type: 'chat'
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Auto-scroll to bottom
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  const handleLike = () => {
    setIsLiked(prev => !prev);
    heartScale.value = withSpring(1.2, {}, () => {
      heartScale.value = withSpring(1);
    });
  };
  
  const handleTip = (amount: number) => {
    if (!user) return;
    
    const tipMessage: LiveChatMessage = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      message: `Tipped $${amount.toFixed(2)}`,
      timestamp: new Date(),
      type: 'tip',
      tipAmount: amount
    };
    
    setChatMessages(prev => [...prev, tipMessage]);
    setShowTipModal(false);
    
    Alert.alert('Thank you!', `You sent $${amount.toFixed(2)} to ${creator?.username}`);
  };
  
  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <View className="flex-1 bg-black">
      {/* Video Stream Area */}
      <View className="flex-1 relative">
        <Image
          source={{ uri: stream.thumbnailUrl || 'https://picsum.photos/400/600?random=' + stream.id }}
          className="w-full h-full"
          resizeMode="cover"
        />
        
        {/* Gradient Overlay */}
        <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
        
        {/* Top Controls */}
        <View className="absolute top-12 left-4 right-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Animated.View 
              style={[animatedLiveStyle]}
              className="bg-red-500 px-3 py-1 rounded-full mr-3"
            >
              <Text className="text-white text-sm font-bold">● LIVE</Text>
            </Animated.View>
            
            <View className="bg-black/50 px-3 py-1 rounded-full">
              <Text className="text-white text-sm font-medium">
                {stream.actualStart && formatDuration(stream.actualStart)}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View className="bg-black/50 px-3 py-1 rounded-full mr-2">
              <View className="flex-row items-center">
                <Ionicons name="eye" size={16} color="white" />
                <Text className="text-white text-sm font-medium ml-1">
                  {stream.viewerCount}
                </Text>
              </View>
            </View>
            
            {isOwner && (
              <Pressable
                onPress={onEndStream}
                className="bg-red-600 px-4 py-2 rounded-full"
              >
                <Text className="text-white font-medium">End</Text>
              </Pressable>
            )}
          </View>
        </View>
        
        {/* Creator Info */}
        <View className="absolute top-24 left-4 right-4">
          <View className="flex-row items-center">
            <Image
              source={{ uri: creator?.profileImage || 'https://via.placeholder.com/40' }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold text-base">{creator?.username}</Text>
                {creator?.isVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#A855F7" className="ml-1" />
                )}
              </View>
              <Text className="text-white/90 text-sm">{stream.title}</Text>
            </View>
            
            {!isOwner && (
              <Pressable className="bg-purple-600 px-4 py-1 rounded-full">
                <Text className="text-white font-medium">Follow</Text>
              </Pressable>
            )}
          </View>
        </View>
        
        {/* Action Buttons */}
        <View className="absolute right-4 bottom-32">
          <View className="items-center space-y-4">
            {/* Like Button */}
            <AnimatedPressable
              style={[animatedHeartStyle]}
              onPress={handleLike}
              className="w-12 h-12 bg-black/30 rounded-full items-center justify-center"
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#FF1744" : "white"} 
              />
            </AnimatedPressable>
            
            {/* Chat Toggle */}
            <Pressable
              onPress={() => setShowChat(!showChat)}
              className="w-12 h-12 bg-black/30 rounded-full items-center justify-center"
            >
              <Ionicons name="chatbubble-outline" size={22} color="white" />
            </Pressable>
            
            {/* Tip Button */}
            {stream.allowTips && !isOwner && (
              <Pressable
                onPress={() => setShowTipModal(true)}
                className="w-12 h-12 bg-black/30 rounded-full items-center justify-center"
              >
                <Ionicons name="gift-outline" size={22} color="white" />
              </Pressable>
            )}
            
            {/* Share Button */}
            <Pressable className="w-12 h-12 bg-black/30 rounded-full items-center justify-center">
              <Ionicons name="share-outline" size={22} color="white" />
            </Pressable>
          </View>
        </View>
      </View>
      
      {/* Chat Section */}
      {showChat && stream.chatEnabled && (
        <View className="h-64 bg-black/80 border-t border-gray-800">
          {/* Chat Header */}
          <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-800">
            <Text className="text-white font-semibold">Live Chat</Text>
            <Pressable onPress={() => setShowChat(false)}>
              <Ionicons name="chevron-down" size={20} color="white" />
            </Pressable>
          </View>
          
          {/* Messages */}
          <ScrollView
            ref={chatScrollRef}
            className="flex-1 px-4 py-2"
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.map((message) => (
              <Animated.View
                key={message.id}
                entering={FadeInUp}
                className="mb-2"
              >
                <View className={`flex-row items-start ${
                  message.type === 'tip' ? 'bg-yellow-600/20 p-2 rounded-lg' : ''
                }`}>
                  {message.type === 'tip' && (
                    <Ionicons name="gift" size={16} color="#FCD34D" className="mr-2 mt-0.5" />
                  )}
                  <Text className="text-purple-400 font-medium text-sm">
                    {message.username}
                  </Text>
                  <Text className="text-white text-sm ml-2 flex-1">
                    {message.message}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
          
          {/* Message Input */}
          <View className="flex-row items-center px-4 py-3 border-t border-gray-800">
            <View className="flex-1 bg-gray-800 rounded-full px-4 py-2">
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Say something..."
                placeholderTextColor="#666"
                className="text-white"
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
            </View>
            <Pressable 
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
              className="ml-3 p-2"
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={newMessage.trim() ? "#A855F7" : "#666"} 
              />
            </Pressable>
          </View>
        </View>
      )}
      
      {/* Tip Modal */}
      <Modal
        visible={showTipModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTipModal(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
            <Text className="text-white text-lg font-semibold">Send Tip</Text>
            <Pressable onPress={() => setShowTipModal(false)}>
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </View>
          
          <View className="flex-1 px-4 py-6">
            <View className="items-center mb-8">
              <Image
                source={{ uri: creator?.profileImage || 'https://via.placeholder.com/80' }}
                className="w-20 h-20 rounded-full mb-4"
              />
              <Text className="text-white text-xl font-semibold">{creator?.username}</Text>
              <Text className="text-gray-400 text-sm">Support this creator</Text>
            </View>
            
            <Text className="text-white text-base font-medium mb-4">Choose an amount:</Text>
            
            <View className="flex-row flex-wrap justify-between">
              {[1, 2, 5, 10, 20, 50].map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => handleTip(amount)}
                  className="w-[30%] bg-gray-800 rounded-xl py-4 items-center mb-4"
                >
                  <Text className="text-white text-lg font-semibold">${amount}</Text>
                </Pressable>
              ))}
            </View>
            
            <Pressable className="bg-purple-600 rounded-xl py-4 items-center mt-4">
              <Text className="text-white text-base font-semibold">Custom Amount</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

interface LiveStreamListProps {
  onStreamPress: (stream: LiveStream) => void;
}

const LiveStreamList: React.FC<LiveStreamListProps> = ({ onStreamPress }) => {
  const { liveStreams } = useContentStore();
  const { allUsers } = useUsersStore();
  
  const activeStreams = liveStreams.filter(stream => stream.status === 'live');
  
  if (activeStreams.length === 0) {
    return (
      <View className="items-center justify-center py-20">
        <Ionicons name="radio-outline" size={64} color="#666" />
        <Text className="text-gray-400 text-lg mt-4">No live streams</Text>
        <Text className="text-gray-500 text-sm mt-2">Check back later for live content!</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={activeStreams}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => {
        const creator = allUsers?.find(u => u.id === item.creatorId);
        
        return (
          <AnimatedPressable
            entering={FadeInUp}
            onPress={() => onStreamPress(item)}
            className="w-[48%] mb-4"
          >
            <View className="bg-gray-900 rounded-xl overflow-hidden">
              <View className="relative">
                <Image
                  source={{ uri: item.thumbnailUrl || 'https://picsum.photos/200/120?random=' + item.id }}
                  className="w-full h-24"
                  resizeMode="cover"
                />
                
                <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">● LIVE</Text>
                </View>
                
                <View className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded-full">
                  <View className="flex-row items-center">
                    <Ionicons name="eye" size={12} color="white" />
                    <Text className="text-white text-xs ml-1">{item.viewerCount}</Text>
                  </View>
                </View>
              </View>
              
              <View className="p-3">
                <Text className="text-white font-semibold text-sm" numberOfLines={2}>
                  {item.title}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {creator?.username}
                </Text>
              </View>
            </View>
          </AnimatedPressable>
        );
      }}
    />
  );
};

export default function LiveStreamScreen() {
  const { user } = useAuthStore();
  const { startLiveStream, endLiveStream } = useContentStore();
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  
  const handleStartStream = async () => {
    if (!streamTitle.trim() || !user) return;
    
    try {
      const streamId = await startLiveStream({
        title: streamTitle.trim(),
        description: streamDescription.trim(),
        privacy: 'public',
        allowComments: true,
        allowDownloads: false,
        isExplicit: false,
        uploadStatus: 'published',
        creatorId: user.id,
        contentType: 'live_stream',
        fileUrl: '',
        duration: 0,
        streamKey: '',
        maxViewers: 0,
        chatEnabled: true,
        allowTips: true
      });
      
      Alert.alert('Stream Started!', 'Your live stream is now active.');
      setShowStartModal(false);
      setStreamTitle('');
      setStreamDescription('');
    } catch (error) {
      Alert.alert('Error', 'Failed to start stream. Please try again.');
    }
  };
  
  const handleEndStream = async () => {
    if (!selectedStream) return;
    
    Alert.alert(
      'End Stream',
      'Are you sure you want to end your live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: async () => {
            await endLiveStream(selectedStream.id);
            setSelectedStream(null);
            Alert.alert('Stream Ended', 'Your live stream has been ended.');
          }
        }
      ]
    );
  };
  
  if (selectedStream) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <LiveStreamPlayer
          stream={selectedStream}
          onEndStream={handleEndStream}
          isOwner={selectedStream.creatorId === user?.id}
        />
        
        <Pressable
          onPress={() => setSelectedStream(null)}
          className="absolute top-12 left-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </Pressable>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <Text className="text-white text-2xl font-bold">Live Streams</Text>
        
        {user && (
          <Pressable
            onPress={() => setShowStartModal(true)}
            className="bg-red-600 px-4 py-2 rounded-full flex-row items-center"
          >
            <Ionicons name="radio" size={16} color="white" />
            <Text className="text-white font-medium ml-2">Go Live</Text>
          </Pressable>
        )}
      </View>
      
      {/* Live Streams List */}
      <LiveStreamList onStreamPress={setSelectedStream} />
      
      {/* Start Stream Modal */}
      <Modal
        visible={showStartModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStartModal(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
            <Pressable onPress={() => setShowStartModal(false)}>
              <Text className="text-purple-500 text-base font-medium">Cancel</Text>
            </Pressable>
            <Text className="text-white text-lg font-semibold">Start Live Stream</Text>
            <Pressable
              onPress={handleStartStream}
              disabled={!streamTitle.trim()}
            >
              <Text className={`text-base font-medium ${
                streamTitle.trim() ? 'text-red-500' : 'text-gray-500'
              }`}>
                Start
              </Text>
            </Pressable>
          </View>
          
          <ScrollView className="flex-1 p-4">
            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-2">Stream Title</Text>
              <TextInput
                value={streamTitle}
                onChangeText={setStreamTitle}
                placeholder="What's your stream about?"
                placeholderTextColor="#666"
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-2">Description (Optional)</Text>
              <TextInput
                value={streamDescription}
                onChangeText={setStreamDescription}
                placeholder="Tell viewers what to expect..."
                placeholderTextColor="#666"
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-3">Stream Settings</Text>
              
              <View className="bg-gray-800 rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white">Enable Chat</Text>
                  <View className="w-12 h-6 bg-purple-600 rounded-full">
                    <View className="w-5 h-5 bg-white rounded-full mt-0.5 ml-6" />
                  </View>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <Text className="text-white">Allow Tips</Text>
                  <View className="w-12 h-6 bg-purple-600 rounded-full">
                    <View className="w-5 h-5 bg-white rounded-full mt-0.5 ml-6" />
                  </View>
                </View>
              </View>
            </View>
            
            <View className="bg-yellow-600/20 p-4 rounded-xl">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#FCD34D" />
                <View className="ml-3 flex-1">
                  <Text className="text-yellow-400 font-medium">Live Stream Tips</Text>
                  <Text className="text-yellow-200 text-sm mt-1">
                    • Make sure you have a stable internet connection{'\n'}
                    • Test your audio before going live{'\n'}
                    • Engage with your audience in chat{'\n'}
                    • Keep your stream title descriptive
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}