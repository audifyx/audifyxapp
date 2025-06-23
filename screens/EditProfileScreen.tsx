import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore, ProfileLink } from '../state/auth';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateProfile, addLink, updateLink, deleteLink } = useAuthStore();
  
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  
  // Update local state when user data changes
  React.useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      setProfileImage(user.profileImage || '');
    }
  }, [user]);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState<ProfileLink | null>(null);
  
  // Link form state
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState<'website' | 'social' | 'music' | 'custom'>('custom');
  
  const linkTypes = [
    { value: 'website', label: 'Website', icon: 'globe-outline' },
    { value: 'social', label: 'Social Media', icon: 'people-outline' },
    { value: 'music', label: 'Music Platform', icon: 'musical-notes-outline' },
    { value: 'custom', label: 'Custom', icon: 'link-outline' }
  ];
  
  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos to change your profile picture');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  const handleSave = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }
    
    const updates = {
      username: username.trim(),
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      website: website.trim() || undefined,
      profileImage: profileImage || undefined,
    };
    
    console.log('Saving profile updates:', updates);
    updateProfile(updates);
    
    // Show what was updated
    const updatedFields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
    console.log('Updated fields:', updatedFields);
    
    Alert.alert('Success', `Profile updated successfully!\nUpdated: ${updatedFields.join(', ')}`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };
  
  const handleAddLink = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) {
      Alert.alert('Error', 'Please fill in both title and URL');
      return;
    }
    
    if (editingLink) {
      updateLink(editingLink.id, {
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        type: linkType
      });
    } else {
      addLink({
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        type: linkType
      });
    }
    
    setLinkTitle('');
    setLinkUrl('');
    setLinkType('custom');
    setEditingLink(null);
    setShowAddLinkModal(false);
  };
  
  const handleEditLink = (link: ProfileLink) => {
    setLinkTitle(link.title);
    setLinkUrl(link.url);
    setLinkType(link.type);
    setEditingLink(link);
    setShowAddLinkModal(true);
  };
  
  const handleDeleteLink = (linkId: string) => {
    Alert.alert(
      'Delete Link',
      'Are you sure you want to delete this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteLink(linkId) }
      ]
    );
  };
  
  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()}>
            <Text className="text-purple-400 text-base">Cancel</Text>
          </Pressable>
          
          <Text className="text-lg font-semibold text-white">Edit Profile</Text>
          
          <Pressable onPress={handleSave}>
            <Text className="text-purple-400 text-base font-semibold">Save</Text>
          </Pressable>
        </View>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {/* Profile Picture */}
            <Animated.View entering={FadeInUp.delay(100)} className="items-center mb-8">
              <Pressable onPress={handleImagePicker} className="relative">
                <View className="w-24 h-24 bg-purple-600 rounded-full items-center justify-center">
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <Text className="text-white text-2xl font-bold">
                      {username?.[0]?.toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
                <View className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 rounded-full items-center justify-center border-2 border-black">
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </Pressable>
              <Text className="text-gray-400 text-sm mt-2">Tap to change photo</Text>
            </Animated.View>
            
            {/* Form Fields */}
            <View className="space-y-6">
              <Animated.View entering={FadeInUp.delay(200)}>
                <Text className="text-white text-sm font-medium mb-2">Username *</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                  autoCapitalize="none"
                />
              </Animated.View>
              
              <Animated.View entering={FadeInUp.delay(300)}>
                <Text className="text-white text-sm font-medium mb-2">Bio</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell people about yourself..."
                  placeholderTextColor="#6B7280"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                />
                <Text className="text-gray-500 text-xs mt-1">{bio.length}/150 characters</Text>
              </Animated.View>
              
              <Animated.View entering={FadeInUp.delay(400)}>
                <Text className="text-white text-sm font-medium mb-2">Location</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Where are you based?"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                />
              </Animated.View>
              
              <Animated.View entering={FadeInUp.delay(500)}>
                <Text className="text-white text-sm font-medium mb-2">Website</Text>
                <TextInput
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="https://yourwebsite.com"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </Animated.View>
            </View>
            
            {/* Links Section */}
            <Animated.View entering={FadeInUp.delay(600)} className="mt-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-semibold">Links</Text>
                <Pressable
                  onPress={() => setShowAddLinkModal(true)}
                  className="bg-purple-600 rounded-full w-8 h-8 items-center justify-center"
                >
                  <Ionicons name="add" size={16} color="white" />
                </Pressable>
              </View>
              
              {user?.links && user.links.length > 0 ? (
                user.links.map((link, index) => (
                  <Animated.View
                    key={link.id}
                    entering={FadeInUp.delay(700 + index * 100)}
                    className="bg-gray-900 rounded-xl p-4 mb-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-semibold">{link.title}</Text>
                        <Text className="text-gray-400 text-sm mt-1" numberOfLines={1}>
                          {link.url}
                        </Text>
                        <Text className="text-purple-400 text-xs mt-1 capitalize">
                          {link.type}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center space-x-2">
                        <Pressable
                          onPress={() => openLink(link.url)}
                          className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center"
                        >
                          <Ionicons name="open-outline" size={16} color="white" />
                        </Pressable>
                        
                        <Pressable
                          onPress={() => handleEditLink(link)}
                          className="w-8 h-8 bg-gray-700 rounded-full items-center justify-center"
                        >
                          <Ionicons name="pencil" size={16} color="white" />
                        </Pressable>
                        
                        <Pressable
                          onPress={() => handleDeleteLink(link.id)}
                          className="w-8 h-8 bg-red-600 rounded-full items-center justify-center"
                        >
                          <Ionicons name="trash" size={16} color="white" />
                        </Pressable>
                      </View>
                    </View>
                  </Animated.View>
                ))
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="link-outline" size={48} color="#6B7280" />
                  <Text className="text-gray-400 text-center mt-4">No links added yet</Text>
                  <Text className="text-gray-500 text-center mt-2 text-sm">
                    Add links to your social media, music platforms, or website
                  </Text>
                </View>
              )}
            </Animated.View>
            
            {/* Payment Methods Section */}
            <Animated.View entering={FadeInUp.delay(700)} className="mt-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-semibold">Payment Methods</Text>
                <Pressable
                  onPress={() => navigation.navigate('PaymentSetup' as never)}
                  className="bg-green-600 rounded-lg px-4 py-2"
                >
                  <Text className="text-white font-medium text-sm">Setup</Text>
                </Pressable>
              </View>
              
              <View className="bg-gray-900 rounded-xl p-4">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="card" size={20} color="#10B981" />
                  <Text className="text-white font-medium ml-3">For selling on the store</Text>
                </View>
                
                <View className="space-y-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400">PayPal</Text>
                    <Text className={`text-sm ${user?.paypalLink ? 'text-green-400' : 'text-gray-500'}`}>
                      {user?.paypalLink ? 'Connected' : 'Not set'}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400">Cash App</Text>
                    <Text className={`text-sm ${user?.cashAppLink ? 'text-green-400' : 'text-gray-500'}`}>
                      {user?.cashAppLink ? 'Connected' : 'Not set'}
                    </Text>
                  </View>
                </View>
                
                {(!user?.paypalLink && !user?.cashAppLink) && (
                  <Text className="text-yellow-400 text-sm mt-3">
                    ⚠️ Set up payment methods to start selling
                  </Text>
                )}
              </View>
            </Animated.View>
          </View>
        </ScrollView>
        
        {/* Add/Edit Link Modal */}
        {showAddLinkModal && (
          <View className="absolute inset-0 bg-black/80 justify-end">
            <Animated.View
              entering={FadeInDown}
              className="bg-gray-900 rounded-t-3xl p-6"
            >
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">
                  {editingLink ? 'Edit Link' : 'Add Link'}
                </Text>
                <Pressable 
                  onPress={() => {
                    setShowAddLinkModal(false);
                    setEditingLink(null);
                    setLinkTitle('');
                    setLinkUrl('');
                    setLinkType('custom');
                  }}
                  className="w-8 h-8 bg-gray-700 rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={16} color="white" />
                </Pressable>
              </View>
              
              <View className="space-y-4">
                <View>
                  <Text className="text-white text-sm font-medium mb-2">Title</Text>
                  <TextInput
                    value={linkTitle}
                    onChangeText={setLinkTitle}
                    placeholder="e.g., Instagram, SoundCloud, Website"
                    placeholderTextColor="#6B7280"
                    className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-base"
                  />
                </View>
                
                <View>
                  <Text className="text-white text-sm font-medium mb-2">URL</Text>
                  <TextInput
                    value={linkUrl}
                    onChangeText={setLinkUrl}
                    placeholder="https://..."
                    placeholderTextColor="#6B7280"
                    className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-base"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
                
                <View>
                  <Text className="text-white text-sm font-medium mb-3">Type</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {linkTypes.map((type) => (
                      <Pressable
                        key={type.value}
                        onPress={() => setLinkType(type.value as any)}
                        className={`flex-row items-center px-3 py-2 rounded-lg ${
                          linkType === type.value ? 'bg-purple-600' : 'bg-gray-800'
                        }`}
                      >
                        <Ionicons 
                          name={type.icon as any} 
                          size={16} 
                          color={linkType === type.value ? 'white' : '#9CA3AF'} 
                        />
                        <Text className={`ml-2 text-sm ${
                          linkType === type.value ? 'text-white' : 'text-gray-400'
                        }`}>
                          {type.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
              
              <View className="flex-row space-x-3 mt-6">
                <Pressable
                  onPress={() => {
                    setShowAddLinkModal(false);
                    setEditingLink(null);
                    setLinkTitle('');
                    setLinkUrl('');
                    setLinkType('custom');
                  }}
                  className="flex-1 bg-gray-700 rounded-xl py-3"
                >
                  <Text className="text-white text-center font-semibold">Cancel</Text>
                </Pressable>
                
                <Pressable
                  onPress={handleAddLink}
                  className="flex-1 bg-purple-600 rounded-xl py-3"
                  disabled={!linkTitle.trim() || !linkUrl.trim()}
                >
                  <Text className="text-white text-center font-semibold">
                    {editingLink ? 'Update' : 'Add'} Link
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}