import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  ScrollView, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView, 
  Platform,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocialStore } from '../state/social';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { useNotificationsStore } from '../state/notifications';
import { Track } from '../state/music';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  track: Track;
}

export default function CommentsModal({ visible, onClose, track }: CommentsModalProps) {
  const { addComment, getTrackComments } = useSocialStore();
  const { user } = useAuthStore();
  const { getUserById } = useUsersStore();
  const { addNotification } = useNotificationsStore();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  
  const comments = getTrackComments(track.id);
  
  const handleAddComment = () => {
    if (!user || !commentText.trim()) return;
    
    addComment(user.id, track.id, commentText.trim(), replyTo || undefined);
    
    // Create notification for track owner
    if (track.uploadedBy !== user.id) {
      addNotification({
        type: 'comment',
        fromUserId: user.id,
        toUserId: track.uploadedBy,
        trackId: track.id,
        text: commentText.trim()
      });
    }
    
    setCommentText('');
    setReplyTo(null);
  };
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  };
  
  const handleReply = (commentId: string, username: string) => {
    setReplyTo(commentId);
    setCommentText(`@${username} `);
    inputRef.current?.focus();
  };
  
  useEffect(() => {
    if (visible) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800 pt-12">
          <Text className="text-white text-lg font-semibold">Comments</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>
        
        {/* Track Info */}
        <View className="px-4 py-3 border-b border-gray-800">
          <View className="flex-row items-center">
            <Image
              source={{ uri: track.imageUrl || 'https://picsum.photos/100/100' }}
              className="w-12 h-12 rounded-lg mr-3"
            />
            <View className="flex-1">
              <Text className="text-white font-semibold">{track.title}</Text>
              <Text className="text-gray-400 text-sm">{track.artist}</Text>
            </View>
          </View>
        </View>
        
        {/* Comments List */}
        <ScrollView className="flex-1 px-4 py-2">
          {comments.length > 0 ? (
            comments.map((comment, index) => {
              const commentUser = getUserById(comment.userId);
              const isReply = !!comment.replyTo;
              
              return (
                <Animated.View
                  key={comment.id}
                  entering={FadeInUp.delay(index * 50)}
                  className={`flex-row py-3 ${isReply ? 'ml-8 border-l-2 border-gray-700 pl-4' : ''}`}
                >
                  <View className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center mr-3">
                    {commentUser?.profileImage ? (
                      <Image
                        source={{ uri: commentUser.profileImage }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Text className="text-white text-xs font-bold">
                        {commentUser?.username?.[0]?.toUpperCase() || '?'}
                      </Text>
                    )}
                  </View>
                  
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-white font-semibold text-sm mr-2">
                        {commentUser?.username || 'Unknown User'}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {formatTime(comment.timestamp)}
                      </Text>
                    </View>
                    
                    <Text className="text-gray-300 text-sm leading-5 mb-2">
                      {comment.text}
                    </Text>
                    
                    <Pressable 
                      onPress={() => handleReply(comment.id, commentUser?.username || 'user')}
                    >
                      <Text className="text-gray-500 text-xs font-medium">Reply</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              );
            })
          ) : (
            <View className="items-center justify-center py-20">
              <Ionicons name="chatbubbles-outline" size={64} color="#6B7280" />
              <Text className="text-gray-400 text-lg mt-4">No comments yet</Text>
              <Text className="text-gray-500 text-center mt-2">
                Be the first to share your thoughts!
              </Text>
            </View>
          )}
        </ScrollView>
        
        {/* Comment Input */}
        <View className="px-4 py-3 border-t border-gray-800">
          {replyTo && (
            <View className="flex-row items-center justify-between mb-2 bg-gray-900 rounded-lg px-3 py-2">
              <Text className="text-gray-400 text-sm">
                Replying to comment
              </Text>
              <Pressable onPress={() => {
                setReplyTo(null);
                setCommentText('');
              }}>
                <Ionicons name="close" size={16} color="#6B7280" />
              </Pressable>
            </View>
          )}
          
          <View className="flex-row items-end space-x-3">
            <View className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center">
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-white text-xs font-bold">
                  {user?.username?.[0]?.toUpperCase() || '?'}
                </Text>
              )}
            </View>
            
            <View className="flex-1 bg-gray-900 rounded-2xl px-4 py-3">
              <TextInput
                ref={inputRef}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#6B7280"
                className="text-white text-base"
                multiline
                maxLength={500}
              />
            </View>
            
            <AnimatedPressable
              onPress={handleAddComment}
              disabled={!commentText.trim()}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                commentText.trim() ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <Ionicons 
                name="arrow-up" 
                size={20} 
                color={commentText.trim() ? 'white' : '#6B7280'} 
              />
            </AnimatedPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}