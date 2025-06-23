import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Producer genres and skills
const producerGenres = ['Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Jazz', 'Reggae', 'Country'];
const producerSkills = ['Beat Making', 'Mixing', 'Mastering', 'Songwriting', 'Vocal Production', 'Sound Design'];

export default function ProdConnectScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { allUsers, followUser, unfollowUser, isFollowing } = useUsersStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'following'>('discover');

  // No producers initially - users can become producers by setting up their profiles
  const producers: any[] = [];

  const filteredProducers = producers.filter(producer => {
    const matchesSearch = producer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         producer.genres.some((genre: any) => genre.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGenre = !selectedGenre || producer.genres.includes(selectedGenre);
    const matchesTab = activeTab === 'discover' || 
                      (activeTab === 'following' && user && isFollowing(producer.id, user.id));
    
    return matchesSearch && matchesGenre && matchesTab;
  });

  const handleFollow = (producerId: string) => {
    if (!user) return;
    
    if (isFollowing(producerId, user.id)) {
      unfollowUser(producerId, user.id);
    } else {
      followUser(producerId, user.id);
    }
  };

  const handleViewProfile = (producer: any) => {
    (navigation as any).navigate('UserProfile', { userId: producer.id });
  };

  const handleContact = (producer: any) => {
    // Navigate to chat or contact form
    navigation.navigate('Messages' as never);
  };

  const renderProducerCard = ({ item: producer, index }: { item: any, index: number }) => (
    <AnimatedPressable
      entering={FadeInUp.delay(index * 100)}
      onPress={() => handleViewProfile(producer)}
      className="bg-gray-900 rounded-xl p-4 mb-4 mx-4"
    >
      {/* Producer Header */}
      <View className="flex-row items-center mb-3">
        <View className="w-14 h-14 bg-purple-600 rounded-full items-center justify-center mr-3">
          {producer.profileImage ? (
            <Image
              source={{ uri: producer.profileImage }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-white text-lg font-bold">
              {producer.username[0]?.toUpperCase()}
            </Text>
          )}
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-white font-bold text-lg mr-2">{producer.username}</Text>
            {producer.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
            )}
          </View>
          <Text className="text-gray-400 text-sm">{producer.location}</Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text className="text-yellow-400 text-sm ml-1">{producer.rating}</Text>
            <Text className="text-gray-400 text-sm ml-2">({producer.projects} projects)</Text>
          </View>
        </View>
        
        <Text className="text-green-400 font-semibold">{producer.rate}</Text>
      </View>

      {/* Genres */}
      <View className="flex-row flex-wrap mb-3">
        {producer.genres.map((genre: string, idx: number) => (
          <View key={idx} className="bg-purple-600/20 rounded-full px-3 py-1 mr-2 mb-1">
            <Text className="text-purple-300 text-xs font-medium">{genre}</Text>
          </View>
        ))}
      </View>

      {/* Skills */}
      <View className="flex-row flex-wrap mb-4">
        {producer.skills.slice(0, 3).map((skill: string, idx: number) => (
          <View key={idx} className="bg-gray-800 rounded-full px-3 py-1 mr-2 mb-1">
            <Text className="text-gray-300 text-xs">{skill}</Text>
          </View>
        ))}
        {producer.skills.length > 3 && (
          <View className="bg-gray-800 rounded-full px-3 py-1 mr-2 mb-1">
            <Text className="text-gray-300 text-xs">+{producer.skills.length - 3}</Text>
          </View>
        )}
      </View>

      {/* Bio */}
      {producer.bio && (
        <Text className="text-gray-300 text-sm mb-4" numberOfLines={2}>
          {producer.bio}
        </Text>
      )}

      {/* Actions */}
      <View className="flex-row space-x-3">
        <Pressable
          onPress={() => handleFollow(producer.id)}
          className={`flex-1 rounded-lg py-3 px-4 ${
            user && isFollowing(producer.id, user.id) 
              ? 'bg-gray-700 border border-gray-600' 
              : 'bg-purple-600'
          }`}
        >
          <Text className="text-white text-center font-medium">
            {user && isFollowing(producer.id, user.id) ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
        
        <Pressable
          onPress={() => handleContact(producer)}
          className="flex-1 bg-green-600 rounded-lg py-3 px-4"
        >
          <Text className="text-white text-center font-medium">Contact</Text>
        </Pressable>
      </View>
    </AnimatedPressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          
          <Text className="text-lg font-semibold text-white">Prod Connect</Text>
          
          <Pressable>
            <Ionicons name="options" size={24} color="white" />
          </Pressable>
        </View>

        {/* Tab Bar */}
        <View className="flex-row bg-black border-b border-gray-800">
          <Pressable
            onPress={() => setActiveTab('discover')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'discover' ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold ${
              activeTab === 'discover' ? 'text-white' : 'text-gray-400'
            }`}>
              Discover
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab('following')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'following' ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold ${
              activeTab === 'following' ? 'text-white' : 'text-gray-400'
            }`}>
              Following
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="px-4 py-3 border-b border-gray-800">
          <View className="flex-row items-center bg-gray-900 rounded-xl px-3 py-2">
            <Ionicons name="search" size={16} color="#6B7280" />
            <TextInput
              placeholder="Search producers, genres..."
              placeholderTextColor="#6B7280"
              className="flex-1 ml-2 text-white text-base"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Genre Filter */}
        <View className="py-3 border-b border-gray-800">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            <Pressable
              onPress={() => setSelectedGenre(null)}
              className={`rounded-full px-4 py-2 mr-3 ${
                !selectedGenre ? 'bg-blue-600' : 'bg-gray-800'
              }`}
            >
              <Text className={`font-medium ${
                !selectedGenre ? 'text-white' : 'text-gray-300'
              }`}>
                All
              </Text>
            </Pressable>
            
            {producerGenres.map((genre, index) => (
              <Pressable
                key={genre}
                onPress={() => setSelectedGenre(genre)}
                className={`rounded-full px-4 py-2 mr-3 ${
                  selectedGenre === genre ? 'bg-blue-600' : 'bg-gray-800'
                }`}
              >
                <Text className={`font-medium ${
                  selectedGenre === genre ? 'text-white' : 'text-gray-300'
                }`}>
                  {genre}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Producers List */}
        {filteredProducers.length > 0 ? (
          <FlatList
            data={filteredProducers}
            renderItem={renderProducerCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          />
        ) : (
          <View className="items-center justify-center flex-1 px-6">
            <Ionicons name="musical-notes-outline" size={80} color="#6B7280" />
            <Text className="text-white text-xl font-semibold mt-6 text-center">
              {activeTab === 'following' ? 'No producers followed' : 'No producers found'}
            </Text>
            <Text className="text-gray-400 text-center mt-2 leading-6">
              {activeTab === 'following' 
                ? 'Follow some producers to see them here'
                : searchQuery || selectedGenre
                ? 'Try adjusting your search or filters'
                : 'When producers join Audifyx, they will appear here'
              }
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}