import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
  TextInput,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/auth';
import { useMusicStore } from '../state/music';
import { useSettingsStore } from '../state/settings';
import { useChatStore } from '../state/chat';
import { useNavigation } from '@react-navigation/native';
import HelpSupportScreen from './HelpSupportScreen';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => (
  <View className="mb-6">
    <Text className="text-white text-lg font-semibold mb-3 px-4">{title}</Text>
    <View className="bg-gray-800 rounded-xl mx-4">{children}</View>
  </View>
);

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showArrow?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightComponent,
  showArrow = false,
  isFirst = false,
  isLast = false,
}) => (
  <Pressable
    onPress={onPress}
    className={`flex-row items-center px-4 py-4 ${
      !isLast ? 'border-b border-gray-700' : ''
    } ${isFirst ? 'rounded-t-xl' : ''} ${isLast ? 'rounded-b-xl' : ''}`}
  >
    <View className="w-8 h-8 bg-purple-600 rounded-lg items-center justify-center mr-3">
      <Ionicons name={icon} size={18} color="white" />
    </View>
    <View className="flex-1">
      <Text className="text-white font-medium text-base">{title}</Text>
      {subtitle && <Text className="text-gray-400 text-sm mt-1">{subtitle}</Text>}
    </View>
    {rightComponent}
    {showArrow && (
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    )}
  </Pressable>
);

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { clearPlayHistory } = useMusicStore();
  const { adminUnreadCount, getUserTickets } = useChatStore();
  const navigation = useNavigation();
  const {
    darkMode,
    notifications,
    autoPlay,
    highQuality,
    downloadOnWifi,
    language,
    toggleDarkMode,
    toggleNotifications,
    toggleAutoPlay,
    toggleHighQuality,
    toggleDownloadOnWifi,
    setLanguage,
  } = useSettingsStore();

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');

  const userTickets = user ? getUserTickets(user.id) : [];
  const unreadTickets = userTickets.filter(t => t.unreadCount > 0).length;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear App Data',
      'This will clear your play history, downloaded songs, and cached data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            clearPlayHistory();
            Alert.alert('Success', 'App data has been cleared.');
          },
        },
      ]
    );
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <Text className="text-white text-2xl font-bold">Settings</Text>
        <View className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center">
          <Ionicons name="settings" size={20} color="white" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <SettingSection title="Profile">
          <View className="px-4 py-6 items-center">
            <View className="w-24 h-24 rounded-full mb-4 relative">
              <Image
                source={{ uri: user?.profileImage || 'https://via.placeholder.com/150' }}
                className="w-full h-full rounded-full"
              />
              <Pressable 
                onPress={() => setShowProfileModal(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 rounded-full items-center justify-center border-2 border-black"
              >
                <Ionicons name="camera" size={16} color="white" />
              </Pressable>
            </View>
            <Text className="text-white text-xl font-bold">{user?.username}</Text>
            <Text className="text-gray-400 text-sm">{user?.email}</Text>
            <View className="flex-row items-center mt-2">
              <Text className="text-purple-400 text-sm font-medium mr-4">
                {user?.followers || 0} followers
              </Text>
              <Text className="text-purple-400 text-sm font-medium">
                {user?.following || 0} following
              </Text>
            </View>
          </View>
        </SettingSection>

        {/* Account Section */}
        <SettingSection title="Account">
          <SettingItem
            icon="person-circle"
            title="Edit Profile"
            subtitle="Update your profile information"
            onPress={() => setShowProfileModal(true)}
            showArrow
            isFirst
          />
          <SettingItem
            icon="shield-checkmark"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => Alert.alert(
              'Privacy Settings',
              'Profile Visibility: Public\nData Sharing: Minimal\nLocation Services: Disabled\n\nFull privacy controls coming soon!'
            )}
            showArrow
          />
          <SettingItem
            icon="card"
            title="Subscription"
            subtitle="Manage your premium subscription"
            onPress={() => Alert.alert(
              'Subscription Status',
              'Free Plan\n\n• Unlimited music streaming\n• Basic audio quality\n• Limited downloads\n\nUpgrade to Premium for:\n• High-quality audio\n• Unlimited downloads\n• Ad-free experience'
            )}
            showArrow
            isLast
          />
        </SettingSection>

        {/* Playback Section */}
        <SettingSection title="Playback">
          <SettingItem
            icon="play"
            title="Auto-play"
            subtitle="Automatically play similar songs"
            rightComponent={
              <Switch
                value={autoPlay}
                onValueChange={toggleAutoPlay}
                trackColor={{ false: '#374151', true: '#A855F7' }}
                thumbColor={autoPlay ? '#FFFFFF' : '#9CA3AF'}
              />
            }
            isFirst
          />
          <SettingItem
            icon="musical-note"
            title="High Quality Audio"
            subtitle="Stream at 320kbps (uses more data)"
            rightComponent={
              <Switch
                value={highQuality}
                onValueChange={toggleHighQuality}
                trackColor={{ false: '#374151', true: '#A855F7' }}
                thumbColor={highQuality ? '#FFFFFF' : '#9CA3AF'}
              />
            }
          />
          <SettingItem
            icon="download"
            title="Download on Wi-Fi only"
            subtitle="Only download songs when connected to Wi-Fi"
            rightComponent={
              <Switch
                value={downloadOnWifi}
                onValueChange={toggleDownloadOnWifi}
                trackColor={{ false: '#374151', true: '#A855F7' }}
                thumbColor={downloadOnWifi ? '#FFFFFF' : '#9CA3AF'}
              />
            }
            isLast
          />
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="Notifications">
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Get notified about new releases and updates"
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#374151', true: '#A855F7' }}
                thumbColor={notifications ? '#FFFFFF' : '#9CA3AF'}
              />
            }
            isFirst
            isLast
          />
        </SettingSection>

        {/* General Section */}
        <SettingSection title="General">
          <SettingItem
            icon="moon"
            title="Dark Mode"
            subtitle="Use dark theme throughout the app"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#374151', true: '#A855F7' }}
                thumbColor={darkMode ? '#FFFFFF' : '#9CA3AF'}
              />
            }
            isFirst
          />
          <SettingItem
            icon="language"
            title="Language"
            subtitle={languages.find(l => l.code === language)?.name || 'English'}
            onPress={() => setShowLanguageModal(true)}
            showArrow
          />
          <SettingItem
            icon="cellular"
            title="Data Usage"
            subtitle="Monitor and control data consumption"
            onPress={() => Alert.alert(
              'Data Usage',
              'This month:\n• Music streaming: 2.1 GB\n• Image loading: 150 MB\n• App updates: 45 MB\n\nTotal: 2.3 GB\n\nTip: Enable "Download on Wi-Fi only" to save mobile data.'
            )}
            showArrow
          />
          <SettingItem
            icon="storefront"
            title="Storage"
            subtitle="Manage downloaded music and cache"
            onPress={() => Alert.alert(
              'Storage Usage',
              'Downloaded Music: 1.2 GB\nCache: 245 MB\nApp Size: 120 MB\n\nTotal: 1.6 GB\n\nYou can clear cache or remove downloaded songs to free up space.'
            )}
            showArrow
          />
          <SettingItem
            icon="trash"
            title="Clear App Data"
            subtitle="Clear play history and cached data"
            onPress={handleClearData}
            showArrow
            isLast
          />
        </SettingSection>

        {/* Social Section */}
        <SettingSection title="Social & Sharing">
          <SettingItem
            icon="people"
            title="Friend Requests"
            subtitle="Manage who can send you friend requests"
            onPress={() => Alert.alert(
              'Friend Requests',
              'Current setting: Everyone\n\nOptions:\n• Everyone\n• Friends of friends\n• No one\n\nChange to limit who can send you friend requests.'
            )}
            showArrow
            isFirst
          />
          <SettingItem
            icon="eye"
            title="Profile Visibility"
            subtitle="Control who can see your profile"
            onPress={() => Alert.alert(
              'Profile Visibility',
              'Current setting: Public\n\nOptions:\n• Public - Anyone can see your profile\n• Friends only - Only friends can see details\n• Private - Profile is hidden from search'
            )}
            showArrow
          />
          <SettingItem
            icon="musical-note"
            title="Activity Sharing"
            subtitle="Share your listening activity with friends"
            rightComponent={
              <Switch
                value={true}
                onValueChange={() => Alert.alert('Info', 'Activity sharing controls your music status visibility to friends.')}
                trackColor={{ false: '#374151', true: '#A855F7' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingItem
            icon="link"
            title="Connected Accounts"
            subtitle="Link your social media accounts"
            onPress={() => Alert.alert(
              'Connected Accounts',
              'Link your accounts to:\n• Share music easily\n• Find friends\n• Import playlists\n\nSupported platforms:\n• Spotify\n• Apple Music\n• Instagram\n• Twitter'
            )}
            showArrow
            isLast
          />
        </SettingSection>

        {/* Support Section */}
        <SettingSection title="Support & Info">
          <SettingItem
            icon="chatbubbles"
            title="Help & Support"
            subtitle={`Live chat support${unreadTickets > 0 ? ` • ${unreadTickets} unread` : ''}`}
            onPress={() => setShowHelpModal(true)}
            rightComponent={
              unreadTickets > 0 ? (
                <View className="w-5 h-5 bg-red-500 rounded-full items-center justify-center mr-2">
                  <Text className="text-white text-xs font-bold">
                    {unreadTickets > 9 ? '9+' : unreadTickets}
                  </Text>
                </View>
              ) : undefined
            }
            showArrow
            isFirst
          />
          <SettingItem
            icon="star"
            title="Rate App"
            subtitle="Help us improve with your feedback"
            onPress={() => Alert.alert(
              'Rate MusicApp',
              'Thank you for using MusicApp! Your feedback helps us improve.\n\nWould you like to rate us on the App Store?',
              [
                { text: 'Later', style: 'cancel' },
                { text: 'Rate Now', onPress: () => Alert.alert('Thank you!', 'Rating feature coming soon!') }
              ]
            )}
            showArrow
          />
          <SettingItem
            icon="share"
            title="Share App"
            subtitle="Tell your friends about MusicApp"
            onPress={async () => {
              try {
                await Share.share({
                  message: 'Check out MusicApp - the best way to discover and share music! 🎵',
                  title: 'MusicApp'
                });
              } catch (error) {
                console.log('Share error:', error);
              }
            }}
            showArrow
          />
          <SettingItem
            icon="document-text"
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            onPress={() => Alert.alert(
              'Terms of Service',
              'MusicApp Terms of Service\n\n1. Use of the app is subject to these terms\n2. You must be 13+ to use this service\n3. Respect copyright and intellectual property\n4. No harmful or inappropriate content\n5. We reserve the right to suspend accounts\n\nFull terms available at musicapp.com/terms'
            )}
            showArrow
          />
          <SettingItem
            icon="shield"
            title="Privacy Policy"
            subtitle="Learn how we protect your data"
            onPress={() => Alert.alert(
              'Privacy Policy',
              'Your Privacy Matters\n\n• We only collect necessary data\n• Your music preferences stay private\n• No data is sold to third parties\n• All data is encrypted and secure\n• You can delete your account anytime\n\nFull policy at musicapp.com/privacy'
            )}
            showArrow
          />
          <SettingItem
            icon="information-circle"
            title="About"
            subtitle="App version and information"
            onPress={() => setShowAboutModal(true)}
            showArrow
            isLast
          />
        </SettingSection>

        {/* Sign Out Button */}
        <View className="mx-4 mb-8">
          <Pressable
            onPress={handleSignOut}
            className="bg-red-600 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold text-base">Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Account Modal */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
            <Pressable onPress={() => setShowAccountModal(false)}>
              <Text className="text-purple-500 text-base font-medium">Cancel</Text>
            </Pressable>
            <Text className="text-white text-lg font-semibold">Account Info</Text>
            <Pressable
              onPress={() => {
                Alert.alert('Success', 'Account information updated!');
                setShowAccountModal(false);
              }}
            >
              <Text className="text-purple-500 text-base font-medium">Save</Text>
            </Pressable>
          </View>
          
          <ScrollView className="flex-1 px-4 py-6">
            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-2">Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
                placeholder="Enter username"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-white text-base font-medium mb-2">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
                placeholder="Enter email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
            <Pressable onPress={() => setShowLanguageModal(false)}>
              <Text className="text-purple-500 text-base font-medium">Done</Text>
            </Pressable>
            <Text className="text-white text-lg font-semibold">Language</Text>
            <View className="w-12" />
          </View>
          
          <ScrollView className="flex-1">
            {languages.map((lang, index) => (
              <Pressable
                key={lang.code}
                onPress={() => {
                  setLanguage(lang.code);
                  setShowLanguageModal(false);
                }}
                className={`px-4 py-4 flex-row items-center justify-between ${
                  index < languages.length - 1 ? 'border-b border-gray-800' : ''
                }`}
              >
                <Text className="text-white text-base">{lang.name}</Text>
                {language === lang.code && (
                  <Ionicons name="checkmark" size={20} color="#A855F7" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
            <Pressable onPress={() => setShowAboutModal(false)}>
              <Text className="text-purple-500 text-base font-medium">Done</Text>
            </Pressable>
            <Text className="text-white text-lg font-semibold">About</Text>
            <View className="w-12" />
          </View>
          
          <ScrollView className="flex-1 px-6 py-8">
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-purple-600 rounded-3xl items-center justify-center mb-6">
                <Ionicons name="musical-notes" size={40} color="white" />
              </View>
              
              <Text className="text-white text-3xl font-bold mb-2">MusicApp</Text>
              <Text className="text-gray-400 text-lg mb-2">Version 1.0.0</Text>
              <Text className="text-purple-400 text-sm">Build 2024.1.0</Text>
            </View>
            
            <Text className="text-gray-300 text-center text-base leading-6 mb-8">
              Discover, share, and enjoy music with friends. Built with React Native and powered by modern audio technology.
            </Text>
            
            <View className="space-y-4">
              <View className="bg-gray-800 rounded-xl p-4">
                <Text className="text-white font-semibold text-base mb-3">🛠️ Technical Stack</Text>
                <Text className="text-gray-400 text-sm leading-5">
                  • React Native 0.76.7{'\n'}
                  • Expo SDK 53{'\n'}
                  • TypeScript{'\n'}
                  • Zustand State Management{'\n'}
                  • React Navigation{'\n'}
                  • React Native Reanimated{'\n'}
                  • NativeWind/TailwindCSS
                </Text>
              </View>

              <View className="bg-gray-800 rounded-xl p-4">
                <Text className="text-white font-semibold text-base mb-3">🎵 Features</Text>
                <Text className="text-gray-400 text-sm leading-5">
                  • High-quality music streaming{'\n'}
                  • Social music sharing{'\n'}
                  • Real-time messaging{'\n'}
                  • Live chat support{'\n'}
                  • Offline playback{'\n'}
                  • Smart recommendations{'\n'}
                  • Cross-platform sync
                </Text>
              </View>

              <View className="bg-gray-800 rounded-xl p-4">
                <Text className="text-white font-semibold text-base mb-3">❤️ Credits</Text>
                <Text className="text-gray-400 text-sm leading-5">
                  Built with React Native, Expo, and lots of love by passionate developers who believe music brings people together.
                </Text>
              </View>

              <View className="bg-gray-800 rounded-xl p-4">
                <Text className="text-white font-semibold text-base mb-3">📞 Contact</Text>
                <Text className="text-gray-400 text-sm leading-5">
                  Website: musicapp.com{'\n'}
                  Email: hello@musicapp.com{'\n'}
                  Support: Via in-app live chat
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
            <Pressable onPress={() => setShowProfileModal(false)}>
              <Text className="text-purple-500 text-base font-medium">Cancel</Text>
            </Pressable>
            <Text className="text-white text-lg font-semibold">Edit Profile</Text>
            <Pressable
              onPress={() => {
                Alert.alert('Success', 'Profile updated successfully!');
                setShowProfileModal(false);
              }}
            >
              <Text className="text-purple-500 text-base font-medium">Save</Text>
            </Pressable>
          </View>
          
          <ScrollView className="flex-1 px-4 py-6">
            {/* Profile Picture */}
            <View className="items-center mb-8">
              <View className="w-32 h-32 rounded-full mb-4 relative">
                <Image
                  source={{ uri: user?.profileImage || 'https://via.placeholder.com/150' }}
                  className="w-full h-full rounded-full"
                />
                <Pressable 
                  onPress={() => Alert.alert('Photo', 'Photo upload coming soon!')}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-600 rounded-full items-center justify-center border-2 border-black"
                >
                  <Ionicons name="camera" size={20} color="white" />
                </Pressable>
              </View>
              <Text className="text-gray-400 text-sm">Tap to change photo</Text>
            </View>

            <View className="space-y-6">
              <View>
                <Text className="text-white text-base font-medium mb-2">Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
                  placeholder="Enter username"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View>
                <Text className="text-white text-base font-medium mb-2">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
                  placeholder="Enter email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-white text-base font-medium mb-2">Bio</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl text-base"
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Text className="text-gray-500 text-xs mt-1">{bio.length}/150 characters</Text>
              </View>

              <View>
                <Text className="text-white text-base font-medium mb-2">Music Preferences</Text>
                <View className="flex-row flex-wrap">
                  {['Hip-Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Country'].map((genre) => (
                    <Pressable
                      key={genre}
                      className="bg-gray-800 px-3 py-2 rounded-full mr-2 mb-2"
                    >
                      <Text className="text-gray-300 text-sm">{genre}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View className="flex-1">
          <HelpSupportScreen />
          <View className="absolute top-12 right-4 z-10">
            <Pressable
              onPress={() => setShowHelpModal(false)}
              className="w-10 h-10 bg-black/80 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={20} color="white" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}