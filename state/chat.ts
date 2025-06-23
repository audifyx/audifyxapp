import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  message: string;
  timestamp: string;
  isAdmin: boolean;
  ticketId: string;
  status: 'unread' | 'read' | 'replied';
  attachments?: string[];
  type: 'text' | 'image' | 'system';
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  subject: string;
  category: 'technical' | 'account' | 'billing' | 'feature' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  unreadCount: number;
  assignedAdmin?: string;
}

interface ChatState {
  // Messages
  messages: ChatMessage[];
  tickets: SupportTicket[];
  
  // Current chat state
  currentTicketId: string | null;
  isTyping: boolean;
  typingUsers: string[];
  
  // User's tickets
  userTickets: SupportTicket[];
  
  // Admin state
  isAdminMode: boolean;
  adminUnreadCount: number;
  
  // Actions
  sendMessage: (ticketId: string, message: string, userId: string, username: string, userEmail: string) => void;
  createTicket: (userId: string, username: string, userEmail: string, subject: string, category: SupportTicket['category'], message: string) => string;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  markMessagesAsRead: (ticketId: string, userId: string) => void;
  setCurrentTicket: (ticketId: string | null) => void;
  setTyping: (isTyping: boolean) => void;
  
  // Admin actions
  sendAdminReply: (ticketId: string, message: string, adminName: string) => void;
  assignTicket: (ticketId: string, adminName: string) => void;
  updateTicketPriority: (ticketId: string, priority: SupportTicket['priority']) => void;
  toggleAdminMode: () => void;
  
  // Get functions
  getTicketMessages: (ticketId: string) => ChatMessage[];
  getUserTickets: (userId: string) => SupportTicket[];
  getAllTickets: () => SupportTicket[];
  getUnreadTickets: () => SupportTicket[];
}

// Demo data for testing
const createDemoData = () => {
  const demoTickets: SupportTicket[] = [
    {
      id: 'ticket-demo-1',
      userId: 'user-1',
      username: 'Alex_Beats',
      userEmail: 'alex@demo.com',
      subject: 'Songs not playing properly',
      category: 'technical',
      priority: 'high',
      status: 'in-progress',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      lastMessage: 'Admin: We are looking into this issue for you.',
      unreadCount: 1,
      assignedAdmin: 'Support Team'
    },
    {
      id: 'ticket-demo-2',
      userId: 'user-2',
      username: 'SarahM',
      userEmail: 'sarah@demo.com',
      subject: 'Cannot upload my track',
      category: 'technical',
      priority: 'medium',
      status: 'open',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastMessage: 'The upload keeps failing at 50%',
      unreadCount: 0
    }
  ];

  const demoMessages: ChatMessage[] = [
    {
      id: 'msg-demo-1',
      userId: 'user-1',
      username: 'Alex_Beats',
      userEmail: 'alex@demo.com',
      message: 'Hi, I am having trouble with song playback. Songs keep stopping in the middle.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isAdmin: false,
      ticketId: 'ticket-demo-1',
      status: 'read',
      type: 'text'
    },
    {
      id: 'msg-demo-2',
      userId: 'admin',
      username: 'Support Team',
      userEmail: 'admin@musicapp.com',
      message: 'Hello Alex! I understand you are having playback issues. Can you tell me which device you are using and if this happens with all songs or specific ones?',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      isAdmin: true,
      ticketId: 'ticket-demo-1',
      status: 'read',
      type: 'text'
    },
    {
      id: 'msg-demo-3',
      userId: 'user-1',
      username: 'Alex_Beats',
      userEmail: 'alex@demo.com',
      message: 'I am using an iPhone 14 and it happens with most songs, especially when I skip tracks quickly.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      isAdmin: false,
      ticketId: 'ticket-demo-1',
      status: 'read',
      type: 'text'
    },
    {
      id: 'msg-demo-4',
      userId: 'admin',
      username: 'Support Team',
      userEmail: 'admin@musicapp.com',
      message: 'Thank you for the details. This sounds like a known issue we are working on. We will notify you as soon as we have a fix. In the meantime, try waiting a second between track skips.',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      isAdmin: true,
      ticketId: 'ticket-demo-1',
      status: 'unread',
      type: 'text'
    },
    {
      id: 'msg-demo-5',
      userId: 'user-2',
      username: 'SarahM',
      userEmail: 'sarah@demo.com',
      message: 'Hi, I am trying to upload a new track but it keeps failing at around 50%. The file is MP3 and under 10MB. What could be wrong?',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isAdmin: false,
      ticketId: 'ticket-demo-2',
      status: 'unread',
      type: 'text'
    }
  ];

  return { demoTickets, demoMessages };
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      const { demoTickets, demoMessages } = createDemoData();
      
      return {
        messages: demoMessages,
        tickets: demoTickets,
        currentTicketId: null,
        isTyping: false,
        typingUsers: [],
        userTickets: [],
        isAdminMode: false,
        adminUnreadCount: 2, // 2 unread messages from demo data
        
        sendMessage: (ticketId: string, message: string, userId: string, username: string, userEmail: string) => {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          username,
          userEmail,
          message,
          timestamp: new Date().toISOString(),
          isAdmin: false,
          ticketId,
          status: 'unread',
          type: 'text'
        };
        
        set(state => ({
          messages: [...state.messages, newMessage],
          tickets: state.tickets.map(ticket => 
            ticket.id === ticketId 
              ? { 
                  ...ticket, 
                  lastMessage: message,
                  updatedAt: new Date().toISOString(),
                  unreadCount: ticket.unreadCount + 1,
                  status: 'open' as const
                }
              : ticket
          ),
          adminUnreadCount: state.adminUnreadCount + 1
        }));
      },
      
      createTicket: (userId: string, username: string, userEmail: string, subject: string, category: SupportTicket['category'], message: string) => {
        const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        const newTicket: SupportTicket = {
          id: ticketId,
          userId,
          username,
          userEmail,
          subject,
          category,
          priority: 'medium',
          status: 'open',
          createdAt: now,
          updatedAt: now,
          lastMessage: message,
          unreadCount: 1
        };
        
        const initialMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          username,
          userEmail,
          message,
          timestamp: now,
          isAdmin: false,
          ticketId,
          status: 'unread',
          type: 'text'
        };
        
        set(state => ({
          tickets: [...state.tickets, newTicket],
          messages: [...state.messages, initialMessage],
          adminUnreadCount: state.adminUnreadCount + 1
        }));
        
        return ticketId;
      },
      
      sendAdminReply: (ticketId: string, message: string, adminName: string) => {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: 'admin',
          username: adminName,
          userEmail: 'admin@musicapp.com',
          message,
          timestamp: new Date().toISOString(),
          isAdmin: true,
          ticketId,
          status: 'read',
          type: 'text'
        };
        
        set(state => ({
          messages: [...state.messages, newMessage],
          tickets: state.tickets.map(ticket => 
            ticket.id === ticketId 
              ? { 
                  ...ticket, 
                  lastMessage: `Admin: ${message}`,
                  updatedAt: new Date().toISOString(),
                  status: 'in-progress' as const,
                  assignedAdmin: adminName
                }
              : ticket
          )
        }));
      },
      
      updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => {
        set(state => ({
          tickets: state.tickets.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, status, updatedAt: new Date().toISOString() }
              : ticket
          )
        }));
      },
      
      markMessagesAsRead: (ticketId: string, userId: string) => {
        set(state => ({
          messages: state.messages.map(msg => 
            msg.ticketId === ticketId && msg.userId !== userId
              ? { ...msg, status: 'read' as const }
              : msg
          ),
          tickets: state.tickets.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, unreadCount: 0 }
              : ticket
          ),
          adminUnreadCount: Math.max(0, state.adminUnreadCount - 1)
        }));
      },
      
      setCurrentTicket: (ticketId: string | null) => {
        set({ currentTicketId: ticketId });
      },
      
      setTyping: (isTyping: boolean) => {
        set({ isTyping });
      },
      
      assignTicket: (ticketId: string, adminName: string) => {
        set(state => ({
          tickets: state.tickets.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, assignedAdmin: adminName, status: 'in-progress' as const }
              : ticket
          )
        }));
      },
      
      updateTicketPriority: (ticketId: string, priority: SupportTicket['priority']) => {
        set(state => ({
          tickets: state.tickets.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, priority }
              : ticket
          )
        }));
      },
      
      toggleAdminMode: () => {
        set(state => ({ isAdminMode: !state.isAdminMode }));
      },
      
      // Get functions
      getTicketMessages: (ticketId: string) => {
        const state = get();
        return state.messages
          .filter(msg => msg.ticketId === ticketId)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      },
      
      getUserTickets: (userId: string) => {
        const state = get();
        return state.tickets
          .filter(ticket => ticket.userId === userId)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },
      
      getAllTickets: () => {
        const state = get();
        return state.tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },
      
      getUnreadTickets: () => {
        const state = get();
        return state.tickets.filter(ticket => ticket.unreadCount > 0);
      }
      };
    },
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);