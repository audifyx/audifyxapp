import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseDatabase, Message as DbMessage, Conversation as DbConversation } from '../api/supabaseDatabase';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'audio' | 'image';
  audioUrl?: string;
  imageUrl?: string;
  replyTo?: string; // Message ID for replies
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  lastActivity: Date;
  unreadCount: number;
  isTyping?: string; // User ID who is typing
}

interface MessagesState {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  
  // Actions
  createConversation: (participantIds: string[]) => Promise<string>;
  sendMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  markAsRead: (conversationId: string, userId: string) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  getConversationId: (userId1: string, userId2: string) => string | null;
  getUnreadCount: () => number;
  deleteConversation: (conversationId: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  clearAllMessages: () => void;
  syncFromDatabase: (userId: string) => Promise<void>;
}

export const useMessagesStore = create<MessagesState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      
      createConversation: async (participantIds: string[]) => {
        try {
          // Create conversation in database
          const dbConversation = await supabaseDatabase.createConversation(participantIds);
          
          // Convert to local format
          if (!dbConversation) throw new Error('Failed to create conversation');
          
          const newConversation: Conversation = {
            id: dbConversation.id,
            participants: dbConversation.participants,
            lastMessage: dbConversation.lastMessage ? {
              id: dbConversation.lastMessage.id,
              text: (dbConversation.lastMessage as any).text || '',
              senderId: dbConversation.lastMessage.senderId,
              receiverId: dbConversation.lastMessage.senderId === participantIds[0] ? participantIds[1] : participantIds[0],
              timestamp: new Date((dbConversation.lastMessage as any).timestamp),
              isRead: (dbConversation.lastMessage as any).isRead,
              type: (dbConversation.lastMessage as any).type,
              audioUrl: (dbConversation.lastMessage as any).audioUrl,
              imageUrl: (dbConversation.lastMessage as any).imageUrl
            } : undefined,
            lastActivity: new Date((dbConversation as any).lastActivity),
            unreadCount: (dbConversation as any).unreadCount,
            isTyping: (dbConversation as any).isTyping
          };
          
          set(state => ({
            conversations: [newConversation, ...state.conversations],
            messages: { ...state.messages, [newConversation.id]: [] }
          }));
          
          return newConversation.id;
        } catch (error) {
          console.error('Failed to create conversation in database:', error);
          
          // Fallback to local-only
          const { conversations } = get();
          
          const existingConv = conversations.find(conv => 
            conv.participants.length === participantIds.length &&
            participantIds.every(id => conv.participants.includes(id))
          );
          
          if (existingConv) {
            return existingConv.id;
          }
          
          const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newConversation: Conversation = {
            id: conversationId,
            participants: participantIds,
            lastActivity: new Date(),
            unreadCount: 0
          };
          
          set(state => ({
            conversations: [newConversation, ...state.conversations],
            messages: { ...state.messages, [conversationId]: [] }
          }));
          
          return conversationId;
        }
      },
      
      sendMessage: async (conversationId: string, messageData: Omit<Message, 'id' | 'timestamp'>) => {
        try {
          // Create message in database
          const dbMessage = await supabaseDatabase.sendMessage({
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            conversationId,
            senderId: messageData.senderId,
            content: messageData.text,
            type: messageData.type
          });
          
          // Convert to local format
          if (!dbMessage) return;
          
          const message: Message = {
            id: dbMessage.id,
            text: (dbMessage as any).content || '',
            senderId: dbMessage.senderId,
            receiverId: messageData.receiverId,
            timestamp: new Date((dbMessage as any).createdAt),
            isRead: (dbMessage as any).readAt ? true : false,
            type: (dbMessage as any).type,
            audioUrl: messageData.audioUrl,
            imageUrl: messageData.imageUrl,
            replyTo: messageData.replyTo
          };
          
          set(state => {
            const updatedMessages = {
              ...state.messages,
              [conversationId]: [...(state.messages[conversationId] || []), message]
            };
            
            const updatedConversations = state.conversations.map(conv => {
              if (conv.id === conversationId) {
                return {
                  ...conv,
                  lastMessage: message,
                  lastActivity: new Date(),
                  unreadCount: message.senderId === messageData.senderId ? conv.unreadCount : conv.unreadCount + 1
                };
              }
              return conv;
            });
            
            // Move conversation to top
            const activeConv = updatedConversations.find(c => c.id === conversationId);
            const otherConvs = updatedConversations.filter(c => c.id !== conversationId);
            
            return {
              conversations: activeConv ? [activeConv, ...otherConvs] : updatedConversations,
              messages: updatedMessages
            };
          });
        } catch (error) {
          console.error('Failed to send message to database:', error);
          
          // Fallback to local-only
          const message: Message = {
            ...messageData,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
          };
          
          set(state => {
            const updatedMessages = {
              ...state.messages,
              [conversationId]: [...(state.messages[conversationId] || []), message]
            };
            
            const updatedConversations = state.conversations.map(conv => {
              if (conv.id === conversationId) {
                return {
                  ...conv,
                  lastMessage: message,
                  lastActivity: new Date(),
                  unreadCount: message.senderId === messageData.senderId ? conv.unreadCount : conv.unreadCount + 1
                };
              }
              return conv;
            });
            
            const activeConv = updatedConversations.find(c => c.id === conversationId);
            const otherConvs = updatedConversations.filter(c => c.id !== conversationId);
            
            return {
              conversations: activeConv ? [activeConv, ...otherConvs] : updatedConversations,
              messages: updatedMessages
            };
          });
        }
      },
      
      markAsRead: (conversationId: string, userId: string) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId && conv.participants.includes(userId)
              ? { ...conv, unreadCount: 0 }
              : conv
          ),
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).map(msg =>
              msg.receiverId === userId ? { ...msg, isRead: true } : msg
            )
          }
        }));
      },
      
      setTyping: (conversationId: string, userId: string, isTyping: boolean) => {
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, isTyping: isTyping ? userId : undefined }
              : conv
          )
        }));
      },
      
      getConversationId: (userId1: string, userId2: string) => {
        const { conversations } = get();
        const conversation = conversations.find(conv =>
          conv.participants.length === 2 &&
          conv.participants.includes(userId1) &&
          conv.participants.includes(userId2)
        );
        return conversation?.id || null;
      },
      
      getUnreadCount: () => {
        const { conversations } = get();
        return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
      },
      
      deleteConversation: (conversationId: string) => {
        set(state => {
          const { [conversationId]: deleted, ...remainingMessages } = state.messages;
          return {
            conversations: state.conversations.filter(conv => conv.id !== conversationId),
            messages: remainingMessages
          };
        });
      },
      
      deleteMessage: (conversationId: string, messageId: string) => {
        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).filter(msg => msg.id !== messageId)
          }
        }));
      },
      
      clearAllMessages: () => {
        set({
          conversations: [],
          messages: {}
        });
      },
      
      syncFromDatabase: async (userId: string) => {
        try {
          console.log('Messages Store: Syncing from database for user:', userId);
          
          // For Supabase, we'll need to implement getConversations method
          // For now, using empty array
          const dbConversations: any[] = [];
          console.log('Messages Store: Found', dbConversations.length, 'conversations');
          
          // Convert to local format
          const conversations: Conversation[] = dbConversations.map((dbConv: any) => ({
            id: dbConv.id,
            participants: dbConv.participants,
            lastMessage: dbConv.lastMessage ? {
              id: dbConv.lastMessage.id,
              text: dbConv.lastMessage.text || '',
              senderId: dbConv.lastMessage.senderId,
              receiverId: dbConv.participants.find((p: any) => p !== dbConv.lastMessage!.senderId) || '',
              timestamp: new Date(dbConv.lastMessage.timestamp),
              isRead: dbConv.lastMessage.isRead,
              type: dbConv.lastMessage.type,
              audioUrl: dbConv.lastMessage.audioUrl,
              imageUrl: dbConv.lastMessage.imageUrl
            } : undefined,
            lastActivity: new Date(dbConv.lastActivity),
            unreadCount: dbConv.unreadCount,
            isTyping: dbConv.isTyping
          }));
          
          // Get messages for each conversation
          const messages: { [conversationId: string]: Message[] } = {};
          
          for (const conv of conversations) {
            // For Supabase, we'll need to implement getMessages method
            const dbMessages: any[] = [];
            messages[conv.id] = dbMessages.map(dbMsg => ({
              id: dbMsg.id,
              text: dbMsg.text || '',
              senderId: dbMsg.senderId,
              receiverId: conv.participants.find(p => p !== dbMsg.senderId) || '',
              timestamp: new Date(dbMsg.timestamp),
              isRead: dbMsg.isRead,
              type: dbMsg.type,
              audioUrl: dbMsg.audioUrl,
              imageUrl: dbMsg.imageUrl
            }));
          }
          
          // Update local state
          set({
            conversations,
            messages
          });
          
          console.log('Messages Store: Successfully synced from database');
        } catch (error) {
          console.error('Messages Store: Failed to sync from database:', error);
        }
      }
    }),
    {
      name: 'messages-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);