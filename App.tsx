import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from "./src/navigation/AppNavigator";
import { resetAppData, debugStorage, checkAndClearMockUsers } from "./src/utils/resetApp";
import { supabaseStorage } from "./src/services/supabaseStorage";
import { supabaseDatabase } from "./src/api/supabaseDatabase";
import IncomingCallModal from "./src/components/IncomingCallModal";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project. 
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

export default function App() {
  useEffect(() => {
    // Configure audio session for playback
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };
    
    // Setup complete local UI demo with rich sample data
    const setupLocalDemo = async () => {
      try {
        console.log('🎨 Setting up complete UI demo with sample data...');
        
        // Import stores for local demo
        const { useUsersStore } = await import('./src/state/users');
        const { useMessagesStore } = await import('./src/state/messages');
        const { useMusicStore } = await import('./src/state/music');
        
        // Check if demo data already loaded
        const hasData = await AsyncStorage.getItem('ui-demo-complete-v1');
        if (!hasData) {
          console.log('📝 Loading complete UI demo data...');
          
          // Rich, diverse user profiles
          const demoUsers = [
            {
              id: 'user-1', username: 'Alex_Beats', email: 'alex@demo.com',
              profileImage: 'https://picsum.photos/300/300?random=1',
              bio: 'Producer & Beat Maker 🎵 | Hip-Hop & Trap | Atlanta | Collabs welcome!',
              location: 'Atlanta, GA', website: 'alexbeats.com', links: [],
              followers: 2450, following: 890, isVerified: true, paypalLink: '', cashAppLink: ''
            },
            {
              id: 'user-2', username: 'MelodyMaven', email: 'melody@demo.com',
              profileImage: 'https://picsum.photos/300/300?random=2',
              bio: 'Singer-Songwriter 🎤 | R&B, Pop & Soul | Nashville | Available for features',
              location: 'Nashville, TN', website: '', links: [],
              followers: 5200, following: 1200, isVerified: true, paypalLink: '', cashAppLink: ''
            },
            {
              id: 'user-3', username: 'StudioMaster', email: 'studio@demo.com',
              profileImage: 'https://picsum.photos/300/300?random=3',
              bio: 'Mixing & Mastering Engineer 🎚️ | 15+ years | Major label credits',
              location: 'Los Angeles, CA', website: 'studiomaster.net', links: [],
              followers: 8900, following: 450, isVerified: true, paypalLink: '', cashAppLink: ''
            },
            {
              id: 'user-4', username: 'VinylSoul', email: 'vinyl@demo.com',
              profileImage: 'https://picsum.photos/300/300?random=4',
              bio: 'Crate Digger & Sample Curator 💿 | Hip-Hop Soul | Rare finds & loops',
              location: 'Brooklyn, NY', website: '', links: [],
              followers: 1800, following: 3400, isVerified: false, paypalLink: '', cashAppLink: ''
            },
            {
              id: 'user-5', username: 'TrapLord', email: 'trap@demo.com',
              profileImage: 'https://picsum.photos/300/300?random=5',
              bio: 'Trap Producer 🔥 | Type beats & custom production | Quick delivery',
              location: 'Miami, FL', website: '', links: [],
              followers: 3200, following: 890, isVerified: false, paypalLink: '', cashAppLink: ''
            },
            {
              id: 'user-6', username: 'IndieVibes', email: 'indie@demo.com',
              profileImage: 'https://picsum.photos/300/300?random=6',
              bio: 'Indie Rock Guitarist 🎸 | Songwriter | Looking for band members',
              location: 'Portland, OR', website: 'indievibes.band', links: [],
              followers: 920, following: 1400, isVerified: false, paypalLink: '', cashAppLink: ''
            },
            {
              id: 'user-7', username: 'BasslineQueen', email: 'bass@demo.com',
              profileImage: 'https://picsum.photos/300/300?random=7',
              bio: 'Bass Player & Producer 🎸 | Funk, Jazz & Electronic | Session work',
              location: 'Detroit, MI', website: '', links: [],
              followers: 1560, following: 780, isVerified: false, paypalLink: '', cashAppLink: ''
            }
          ];
          
          // Add users to store
          demoUsers.forEach(user => useUsersStore.getState().addUser(user));
          
          // Sample tracks with rich metadata
          const demoTracks = [
            {
              id: 'track-1', title: 'Midnight Vibes', artist: 'Alex_Beats',
              url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              imageUrl: 'https://picsum.photos/400/400?random=t1',
              duration: 180, streamCount: 15420, uploadedBy: 'user-1',
              uploadedAt: new Date(Date.now() - 86400000 * 2),
              source: 'file' as const, likes: 890, shares: 45,
              comments: [
                { id: 'c1', trackId: 'track-1', userId: 'user-2', text: 'This beat is fire! 🔥', createdAt: new Date().toISOString(), likes: 12 }
              ]
            },
            {
              id: 'track-2', title: 'Soul Connection', artist: 'MelodyMaven',
              url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
              imageUrl: 'https://picsum.photos/400/400?random=t2',
              duration: 210, streamCount: 8900, uploadedBy: 'user-2',
              uploadedAt: new Date(Date.now() - 86400000 * 3),
              source: 'file' as const, likes: 560, shares: 23,
              comments: [
                { id: 'c2', trackId: 'track-2', userId: 'user-1', text: 'Your vocals are incredible!', createdAt: new Date().toISOString(), likes: 15 }
              ]
            }
          ];
          
          // Add tracks to music store
          useMusicStore.setState({ tracks: demoTracks });
          
          // Sample conversations with messages
          const demoConversations = [
            {
              id: 'conv-1', participants: ['current-user', 'user-1'],
              lastMessage: {
                id: 'msg-1', text: 'Hey! Love your latest beat. Want to collaborate? 🎵',
                senderId: 'user-1', receiverId: 'current-user',
                timestamp: new Date(Date.now() - 3600000), isRead: false, type: 'text' as const
              },
              lastActivity: new Date(Date.now() - 3600000), unreadCount: 1
            },
            {
              id: 'conv-2', participants: ['current-user', 'user-2'],
              lastMessage: {
                id: 'msg-2', text: 'Thanks for the feedback! Really appreciate it 🙏',
                senderId: 'current-user', receiverId: 'user-2',
                timestamp: new Date(Date.now() - 7200000), isRead: true, type: 'text' as const
              },
              lastActivity: new Date(Date.now() - 7200000), unreadCount: 0
            }
          ];
          
          // Add conversations to messages store
          useMessagesStore.setState(state => ({
            conversations: demoConversations,
            messages: {
              'conv-1': [demoConversations[0].lastMessage!],
              'conv-2': [demoConversations[1].lastMessage!]
            }
          }));
          
          await AsyncStorage.setItem('ui-demo-complete-v1', 'true');
          console.log('✅ Complete UI demo data loaded');
        }
        
        console.log('🎨 UI Demo Mode: Full-featured music platform ready');
        
      } catch (error) {
        console.error('Error setting up demo:', error);
      }
    };
    
    setupAudio();
    setupLocalDemo();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="light" backgroundColor="#000000" />
          <IncomingCallModal />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
