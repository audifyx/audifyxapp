import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/auth';
import { useChatStore, ChatMessage, SupportTicket } from '../state/chat';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View
      entering={FadeInUp}
      className={`flex-row mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      <View className={`max-w-[80%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {!isCurrentUser && (
          <View className="flex-row items-center mb-1">
            <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
              message.isAdmin ? 'bg-purple-600' : 'bg-gray-600'
            }`}>
              <Ionicons 
                name={message.isAdmin ? "shield-checkmark" : "person"} 
                size={12} 
                color="white" 
              />
            </View>
            <Text className="text-gray-400 text-xs font-medium">
              {message.isAdmin ? `${message.username} (Support)` : message.username}
            </Text>
          </View>
        )}
        
        <View className={`px-4 py-3 rounded-2xl ${
          isCurrentUser 
            ? 'bg-purple-600' 
            : message.isAdmin 
              ? 'bg-blue-600' 
              : 'bg-gray-700'
        }`}>
          <Text className="text-white text-base leading-5">{message.message}</Text>
        </View>
        
        <Text className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
          {isCurrentUser && (
            <Text className="ml-1">
              {message.status === 'read' ? '✓✓' : '✓'}
            </Text>
          )}
        </Text>
      </View>
    </Animated.View>
  );
};

interface TicketCardProps {
  ticket: SupportTicket;
  onPress: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-600';
      case 'in-progress': return 'bg-yellow-600';
      case 'resolved': return 'bg-blue-600';
      case 'closed': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Animated.View entering={FadeInUp}>
      <Pressable
        onPress={onPress}
        className="bg-gray-800 rounded-xl p-4 mb-3"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-white font-semibold text-base" numberOfLines={2}>
              {ticket.subject}
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              #{ticket.id.slice(-8)} • {ticket.category}
            </Text>
          </View>
          
          <View className="items-end">
            <View className={`px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
              <Text className="text-white text-xs font-medium capitalize">
                {ticket.status.replace('-', ' ')}
              </Text>
            </View>
            {ticket.unreadCount > 0 && (
              <View className="w-5 h-5 bg-red-500 rounded-full items-center justify-center mt-1">
                <Text className="text-white text-xs font-bold">
                  {ticket.unreadCount > 9 ? '9+' : ticket.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {ticket.lastMessage && (
          <Text className="text-gray-300 text-sm mb-2" numberOfLines={2}>
            {ticket.lastMessage}
          </Text>
        )}
        
        <View className="flex-row items-center justify-between">
          <Text className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority.toUpperCase()} PRIORITY
          </Text>
          <Text className="text-gray-500 text-xs">
            {new Date(ticket.updatedAt).toLocaleDateString()}
          </Text>
        </View>
        
        {ticket.assignedAdmin && (
          <View className="flex-row items-center mt-2 pt-2 border-t border-gray-700">
            <Ionicons name="person" size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs ml-1">
              Assigned to {ticket.assignedAdmin}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default function HelpSupportScreen() {
  const { user } = useAuthStore();
  const {
    tickets,
    messages,
    currentTicketId,
    isAdminMode,
    adminUnreadCount,
    sendMessage,
    createTicket,
    sendAdminReply,
    setCurrentTicket,
    markMessagesAsRead,
    updateTicketStatus,
    getTicketMessages,
    getUserTickets,
    getAllTickets,
    toggleAdminMode,
  } = useChatStore();

  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<SupportTicket['category']>('technical');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);

  const userTickets = user ? getUserTickets(user.id) : [];
  const allTickets = getAllTickets();
  const currentTicketMessages = currentTicketId ? getTicketMessages(currentTicketId) : [];
  const currentTicket = tickets.find(t => t.id === currentTicketId);

  useEffect(() => {
    if (currentTicketMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentTicketMessages.length]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !currentTicketId || !user) return;

    if (isAdminMode) {
      sendAdminReply(currentTicketId, messageText.trim(), 'Support Team');
    } else {
      sendMessage(currentTicketId, messageText.trim(), user.id, user.username, user.email);
    }
    
    setMessageText('');
  };

  const handleCreateTicket = () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || !user) return;

    const ticketId = createTicket(
      user.id,
      user.username,
      user.email,
      newTicketSubject.trim(),
      newTicketCategory,
      newTicketMessage.trim()
    );

    setNewTicketSubject('');
    setNewTicketMessage('');
    setNewTicketCategory('technical');
    setShowNewTicketModal(false);

    // Auto-open the new ticket
    setCurrentTicket(ticketId);
    setShowChatModal(true);
  };

  const handleOpenTicket = (ticket: SupportTicket) => {
    setCurrentTicket(ticket.id);
    setShowChatModal(true);
    
    // Mark messages as read
    if (user) {
      markMessagesAsRead(ticket.id, user.id);
    }
  };

  const categories: { value: SupportTicket['category']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'technical', label: 'Technical Issue', icon: 'bug' },
    { value: 'account', label: 'Account Problem', icon: 'person' },
    { value: 'billing', label: 'Billing Question', icon: 'card' },
    { value: 'feature', label: 'Feature Request', icon: 'bulb' },
    { value: 'other', label: 'Other', icon: 'help-circle' },
  ];

  const quickActions = [
    { title: 'Account Issues', subtitle: 'Login, password, profile problems', icon: 'person-circle', category: 'account' as const },
    { title: 'App Not Working', subtitle: 'Crashes, bugs, technical problems', icon: 'bug', category: 'technical' as const },
    { title: 'Music Playback', subtitle: 'Songs not playing, audio issues', icon: 'musical-note', category: 'technical' as const },
    { title: 'Billing Support', subtitle: 'Subscription, payments, refunds', icon: 'card', category: 'billing' as const },
  ];

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">Help & Support</Text>
          <Text className="text-gray-400 text-sm">
            {isAdminMode ? `${allTickets.length} total tickets` : `${userTickets.length} your tickets`}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          {/* Admin Toggle (hidden for regular users) */}
          {user?.email === 'admin@demo.com' && (
            <Pressable
              onPress={toggleAdminMode}
              className={`mr-3 px-3 py-2 rounded-full ${isAdminMode ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark" size={16} color="white" />
                <Text className="text-white text-xs ml-1 font-medium">
                  {isAdminMode ? 'ADMIN' : 'USER'}
                </Text>
              </View>
            </Pressable>
          )}
          
          <Pressable
            onPress={() => setShowNewTicketModal(true)}
            className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={20} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        {!isAdminMode && (
          <View className="p-4">
            <Text className="text-white text-lg font-semibold mb-4">Quick Help</Text>
            <View className="space-y-3">
              {quickActions.map((action, index) => (
                <Animated.View key={action.title} entering={FadeInRight.delay(index * 100)}>
                  <Pressable
                    onPress={() => {
                      setNewTicketCategory(action.category);
                      setNewTicketSubject(action.title);
                      setShowNewTicketModal(true);
                    }}
                    className="bg-gray-800 rounded-xl p-4 flex-row items-center"
                  >
                    <View className="w-12 h-12 bg-purple-600 rounded-xl items-center justify-center mr-4">
                      <Ionicons name={action.icon as any} size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base">{action.title}</Text>
                      <Text className="text-gray-400 text-sm mt-1">{action.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Tickets List */}
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-semibold">
              {isAdminMode ? 'All Support Tickets' : 'Your Tickets'}
            </Text>
            {isAdminMode && adminUnreadCount > 0 && (
              <View className="px-2 py-1 bg-red-500 rounded-full">
                <Text className="text-white text-xs font-bold">
                  {adminUnreadCount} unread
                </Text>
              </View>
            )}
          </View>

          {(isAdminMode ? allTickets : userTickets).length > 0 ? (
            (isAdminMode ? allTickets : userTickets).map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onPress={() => handleOpenTicket(ticket)}
              />
            ))
          ) : (
            <View className="items-center py-12">
              <View className="w-16 h-16 bg-gray-800 rounded-full items-center justify-center mb-4">
                <Ionicons name="chatbubbles-outline" size={32} color="#6B7280" />
              </View>
              <Text className="text-gray-400 text-lg mb-2">No tickets yet</Text>
              <Text className="text-gray-500 text-center">
                {isAdminMode 
                  ? 'No support tickets have been created yet'
                  : 'Create your first support ticket to get help'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* New Ticket Modal */}
      <Modal
        visible={showNewTicketModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewTicketModal(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
            <Pressable onPress={() => setShowNewTicketModal(false)}>
              <Text className="text-purple-500 text-base font-medium">Cancel</Text>
            </Pressable>
            <Text className="text-white text-lg font-semibold">New Ticket</Text>
            <Pressable
              onPress={handleCreateTicket}
              disabled={!newTicketSubject.trim() || !newTicketMessage.trim()}
            >
              <Text className={`text-base font-medium ${
                newTicketSubject.trim() && newTicketMessage.trim() 
                  ? 'text-purple-500' 
                  : 'text-gray-500'
              }`}>
                Create
              </Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-3">Category</Text>
              <View className="space-y-2">
                {categories.map((category) => (
                  <Pressable
                    key={category.value}
                    onPress={() => setNewTicketCategory(category.value)}
                    className={`flex-row items-center p-3 rounded-xl border ${
                      newTicketCategory === category.value 
                        ? 'bg-purple-600/20 border-purple-600' 
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <Ionicons 
                      name={category.icon} 
                      size={20} 
                      color={newTicketCategory === category.value ? '#A855F7' : '#9CA3AF'} 
                    />
                    <Text className={`ml-3 font-medium ${
                      newTicketCategory === category.value ? 'text-purple-400' : 'text-white'
                    }`}>
                      {category.label}
                    </Text>
                    {newTicketCategory === category.value && (
                      <Ionicons name="checkmark-circle" size={20} color="#A855F7" className="ml-auto" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-2">Subject</Text>
              <TextInput
                value={newTicketSubject}
                onChangeText={setNewTicketSubject}
                placeholder="Briefly describe your issue"
                placeholderTextColor="#6B7280"
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
              />
            </View>

            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-2">Description</Text>
              <TextInput
                value={newTicketMessage}
                onChangeText={setNewTicketMessage}
                placeholder="Provide more details about your issue..."
                placeholderTextColor="#6B7280"
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowChatModal(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <KeyboardAvoidingView 
            className="flex-1" 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Chat Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
              <Pressable 
                onPress={() => setShowChatModal(false)}
                className="mr-3"
              >
                <Ionicons name="close" size={24} color="#A855F7" />
              </Pressable>
              
              <View className="flex-1">
                <Text className="text-white font-semibold text-base" numberOfLines={1}>
                  {currentTicket?.subject || 'Support Chat'}
                </Text>
                <Text className="text-gray-400 text-sm">
                  #{currentTicket?.id.slice(-8)} • {currentTicket?.status}
                </Text>
              </View>

              {isAdminMode && currentTicket && (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Update Status',
                      'Change ticket status:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'In Progress', onPress: () => updateTicketStatus(currentTicket.id, 'in-progress') },
                        { text: 'Resolved', onPress: () => updateTicketStatus(currentTicket.id, 'resolved') },
                        { text: 'Close', onPress: () => updateTicketStatus(currentTicket.id, 'closed') },
                      ]
                    );
                  }}
                  className="p-2"
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
                </Pressable>
              )}
            </View>

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={currentTicketMessages}
              keyExtractor={(item) => item.id}
              className="flex-1 px-4"
              contentContainerStyle={{ paddingVertical: 16 }}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  isCurrentUser={!isAdminMode ? item.userId === user?.id : item.isAdmin}
                />
              )}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Message Input */}
            <View className="flex-row items-end px-4 py-3 border-t border-gray-800">
              <View className="flex-1 bg-gray-800 rounded-2xl px-4 py-3 mr-3">
                <TextInput
                  value={messageText}
                  onChangeText={setMessageText}
                  placeholder={isAdminMode ? "Type admin response..." : "Type your message..."}
                  placeholderTextColor="#6B7280"
                  className="text-white text-base"
                  multiline
                  maxLength={500}
                />
              </View>
              
              <Pressable
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  messageText.trim() ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <Ionicons 
                  name="send" 
                  size={18} 
                  color={messageText.trim() ? 'white' : '#6B7280'} 
                />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}