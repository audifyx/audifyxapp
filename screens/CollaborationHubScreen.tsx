import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { useCollaborationStore } from '../state/collaboration';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Mock collaboration types and skills
const collaborationTypes = ['Song Writing', 'Beat Making', 'Vocals', 'Mixing/Mastering', 'Music Video', 'Live Performance'];
const skillCategories = ['Vocals', 'Instruments', 'Production', 'Writing', 'Visual', 'Performance'];

export default function CollaborationHubScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { allUsers, followUser, unfollowUser, isFollowing } = useUsersStore();
  const { 
    getFilteredProjects, 
    getProjectsByCreator, 
    getApplicationsForProject,
    applyToProject 
  } = useCollaborationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'artists' | 'my-projects'>('projects');

  // Get real projects from the store
  const allProjects = getFilteredProjects({
    search: searchQuery,
    type: selectedType || undefined
  });

  // Get user's own projects
  const myProjects = user ? getProjectsByCreator(user.id) : [];

  // Filter out user's own projects from the general list
  const filteredProjects = allProjects.filter(project => project.creatorId !== user?.id);

  const filteredArtists = allUsers.filter(artist => {
    if (artist.id === user?.id) return false;
    const matchesSearch = artist.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (artist.bio && artist.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleApplyToProject = (projectId: string) => {
    (navigation as any).navigate('ApplyProject', { projectId });
  };

  const handleContactArtist = (artistId: string) => {
    navigation.navigate('Messages' as never);
  };

  const handleCreateProject = () => {
    (navigation as any).navigate('CreateProject');
  };

  const handleManageProject = (projectId: string) => {
    (navigation as any).navigate('ManageProject', { projectId });
  };

  const handleViewProfile = (userId: string) => {
    (navigation as any).navigate('UserProfile', { userId });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const renderProjectCard = ({ item: project, index }: { item: any, index: number }) => {
    const creator = allUsers.find(u => u.id === project.creatorId);
    const applications = getApplicationsForProject(project.id);
    
    return (
      <AnimatedPressable
        entering={FadeInUp.delay(index * 100)}
        className="bg-gray-900 rounded-xl p-4 mb-4 mx-4"
      >
        {/* Project Header */}
        <View className="flex-row items-start mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Text className="text-white font-bold text-lg flex-1" numberOfLines={2}>
                {project.title}
              </Text>
              {project.isUrgent && (
                <View className="bg-red-600 rounded-full px-2 py-1 ml-2">
                  <Text className="text-white text-xs font-medium">URGENT</Text>
                </View>
              )}
            </View>
            
            <Pressable
              onPress={() => creator && handleViewProfile(creator.id)}
              className="flex-row items-center mb-2"
            >
              <View className="w-6 h-6 bg-purple-600 rounded-full items-center justify-center mr-2">
                {creator?.profileImage ? (
                  <Image
                    source={{ uri: creator.profileImage }}
                    className="w-full h-full rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-white text-xs font-bold">
                    {creator?.username[0]?.toUpperCase() || '?'}
                  </Text>
                )}
              </View>
              <Text className="text-gray-400 text-sm">{creator?.username || 'Unknown'}</Text>
              {creator?.isVerified && (
                <Ionicons name="checkmark-circle" size={12} color="#3B82F6" style={{ marginLeft: 4 }} />
              )}
              <Text className="text-gray-500 text-sm ml-2">• {formatTimeAgo(project.createdAt)}</Text>
            </Pressable>
          </View>
        </View>

        {/* Project Details */}
        <Text className="text-gray-300 text-sm mb-4" numberOfLines={3}>
          {project.description}
        </Text>

        {/* Skills Needed */}
        <View className="flex-row flex-wrap mb-3">
          {project.skillsNeeded.map((skill: string, idx: number) => (
            <View key={idx} className="bg-blue-600/20 rounded-full px-3 py-1 mr-2 mb-1">
              <Text className="text-blue-300 text-xs font-medium">{skill}</Text>
            </View>
          ))}
        </View>

        {/* Project Info */}
        <View className="flex-row items-center mb-4 space-x-4">
          <View className="flex-row items-center">
            <Ionicons name="musical-note" size={14} color="#6B7280" />
            <Text className="text-gray-400 text-sm ml-1">{project.genre}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="cash" size={14} color="#10B981" />
            <Text className="text-green-400 text-sm ml-1">{project.budget}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="time" size={14} color="#F59E0B" />
            <Text className="text-yellow-400 text-sm ml-1">{project.deadline}</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="people" size={16} color="#6B7280" />
            <Text className="text-gray-400 text-sm ml-1">{applications.length} applicants</Text>
          </View>
          
          <Pressable
            onPress={() => handleApplyToProject(project.id)}
            className="bg-orange-600 rounded-lg px-6 py-2"
          >
            <Text className="text-white font-medium">Apply</Text>
          </Pressable>
        </View>
      </AnimatedPressable>
    );
  };

  const renderArtistCard = ({ item: artist, index }: { item: any, index: number }) => (
    <AnimatedPressable
      entering={FadeInUp.delay(index * 100)}
      onPress={() => (navigation as any).navigate('UserProfile', { userId: artist.id })}
      className="bg-gray-900 rounded-xl p-4 mb-4 mx-4"
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center mr-3">
          {artist.profileImage ? (
            <Image
              source={{ uri: artist.profileImage }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-white text-base font-bold">
              {artist.username[0]?.toUpperCase()}
            </Text>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">{artist.username}</Text>
          {artist.bio && (
            <Text className="text-gray-400 text-sm mt-0.5" numberOfLines={2}>
              {artist.bio}
            </Text>
          )}
          <View className="flex-row items-center mt-2">
            <Text className="text-gray-500 text-xs">{artist.followers || 0} followers</Text>
            <Text className="text-gray-500 text-xs ml-3">{artist.following || 0} following</Text>
          </View>
        </View>
        
        <Pressable
          onPress={() => handleContactArtist(artist.id)}
          className="bg-orange-600 rounded-lg px-4 py-2"
        >
          <Text className="text-white font-medium text-sm">Connect</Text>
        </Pressable>
      </View>
    </AnimatedPressable>
  );

  const renderMyProjectCard = ({ item: project, index }: { item: any, index: number }) => {
    const applications = getApplicationsForProject(project.id);
    
    return (
      <AnimatedPressable
        entering={FadeInUp.delay(index * 100)}
        className="bg-gray-900 rounded-xl p-4 mb-4 mx-4"
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-white font-bold text-lg mb-1">{project.title}</Text>
            <Text className="text-gray-400 text-sm">Created {formatTimeAgo(project.createdAt)}</Text>
          </View>
          <View className={`px-2 py-1 rounded-full ${
            project.status === 'active' ? 'bg-green-600/20' :
            project.status === 'in_progress' ? 'bg-blue-600/20' :
            project.status === 'completed' ? 'bg-purple-600/20' :
            'bg-red-600/20'
          }`}>
            <Text className={`text-xs font-medium capitalize ${
              project.status === 'active' ? 'text-green-400' :
              project.status === 'in_progress' ? 'text-blue-400' :
              project.status === 'completed' ? 'text-purple-400' :
              'text-red-400'
            }`}>
              {project.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text className="text-gray-300 text-sm mb-3" numberOfLines={2}>
          {project.description}
        </Text>

        {/* Skills */}
        <View className="flex-row flex-wrap mb-3">
          {project.skillsNeeded.slice(0, 3).map((skill: string, idx: number) => (
            <View key={idx} className="bg-blue-600/20 rounded-full px-2 py-1 mr-2 mb-1">
              <Text className="text-blue-300 text-xs">{skill}</Text>
            </View>
          ))}
          {project.skillsNeeded.length > 3 && (
            <View className="bg-gray-700 rounded-full px-2 py-1 mr-2 mb-1">
              <Text className="text-gray-400 text-xs">+{project.skillsNeeded.length - 3}</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center">
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text className="text-gray-400 text-sm ml-1">{applications.length} applicants</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="cash" size={16} color="#10B981" />
              <Text className="text-green-400 text-sm ml-1">{project.budget}</Text>
            </View>
          </View>
          
          <Pressable 
            onPress={() => handleManageProject(project.id)}
            className="bg-orange-600 rounded-lg px-4 py-2"
          >
            <Text className="text-white font-medium text-sm">Manage</Text>
          </Pressable>
        </View>
      </AnimatedPressable>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'projects':
        return filteredProjects.length > 0 ? (
          <FlatList
            data={filteredProjects}
            renderItem={renderProjectCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          />
        ) : (
          <View className="items-center justify-center flex-1 px-6">
            <Ionicons name="folder-open-outline" size={80} color="#6B7280" />
            <Text className="text-white text-xl font-semibold mt-6 text-center">
              No projects found
            </Text>
            <Text className="text-gray-400 text-center mt-2 leading-6">
              {searchQuery || selectedType
                ? 'Try adjusting your search or filters'
                : 'No collaboration projects available right now'
              }
            </Text>
          </View>
        );
      
      case 'artists':
        return filteredArtists.length > 0 ? (
          <FlatList
            data={filteredArtists}
            renderItem={renderArtistCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          />
        ) : (
          <View className="items-center justify-center flex-1 px-6">
            <Ionicons name="people-outline" size={80} color="#6B7280" />
            <Text className="text-white text-xl font-semibold mt-6 text-center">
              No artists found
            </Text>
            <Text className="text-gray-400 text-center mt-2 leading-6">
              {searchQuery
                ? 'Try a different search term'
                : 'No artists available for collaboration'
              }
            </Text>
          </View>
        );
      
      case 'my-projects':
        return myProjects.length > 0 ? (
          <FlatList
            data={myProjects}
            renderItem={renderMyProjectCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          />
        ) : (
          <View className="items-center justify-center flex-1 px-6">
            <Ionicons name="add-circle-outline" size={80} color="#6B7280" />
            <Text className="text-white text-xl font-semibold mt-6 text-center">
              No projects created
            </Text>
            <Text className="text-gray-400 text-center mt-2 leading-6">
              Create your first collaboration project to get started
            </Text>
            <Pressable
              onPress={handleCreateProject}
              className="bg-orange-600 rounded-xl px-6 py-3 mt-4"
            >
              <Text className="text-white font-semibold">Create Project</Text>
            </Pressable>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          
          <Text className="text-lg font-semibold text-white">Collaboration Hub</Text>
          
          <Pressable onPress={handleCreateProject}>
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>

        {/* Tab Bar */}
        <View className="flex-row bg-black border-b border-gray-800">
          <Pressable
            onPress={() => setActiveTab('projects')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'projects' ? 'border-orange-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold text-sm ${
              activeTab === 'projects' ? 'text-white' : 'text-gray-400'
            }`}>
              Projects
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab('artists')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'artists' ? 'border-orange-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold text-sm ${
              activeTab === 'artists' ? 'text-white' : 'text-gray-400'
            }`}>
              Artists
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab('my-projects')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'my-projects' ? 'border-orange-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold text-sm ${
              activeTab === 'my-projects' ? 'text-white' : 'text-gray-400'
            }`}>
              My Projects
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="px-4 py-3 border-b border-gray-800">
          <View className="flex-row items-center bg-gray-900 rounded-xl px-3 py-2">
            <Ionicons name="search" size={16} color="#6B7280" />
            <TextInput
              placeholder={
                activeTab === 'projects' ? 'Search projects...' :
                activeTab === 'artists' ? 'Search artists...' :
                'Search my projects...'
              }
              placeholderTextColor="#6B7280"
              className="flex-1 ml-2 text-white text-base"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter Bar (only for projects tab) */}
        {activeTab === 'projects' && (
          <View className="py-3 border-b border-gray-800">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
              <Pressable
                onPress={() => setSelectedType(null)}
                className={`rounded-full px-4 py-2 mr-3 ${
                  !selectedType ? 'bg-orange-600' : 'bg-gray-800'
                }`}
              >
                <Text className={`font-medium ${
                  !selectedType ? 'text-white' : 'text-gray-300'
                }`}>
                  All Types
                </Text>
              </Pressable>
              
              {collaborationTypes.map((type, index) => (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className={`rounded-full px-4 py-2 mr-3 ${
                    selectedType === type ? 'bg-orange-600' : 'bg-gray-800'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedType === type ? 'text-white' : 'text-gray-300'
                  }`}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tab Content */}
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}