import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/auth';
import Animated, { FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const collaborationTypes = ['Song Writing', 'Beat Making', 'Vocals', 'Mixing/Mastering', 'Music Video', 'Live Performance'];
const skillCategories = ['Vocals', 'Instruments', 'Production', 'Writing', 'Visual', 'Performance'];
const genres = ['Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Jazz', 'Reggae', 'Country', 'Other'];

export default function CreateProjectScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkillsNeeded(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleCreateProject = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a project title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please enter a project description');
      return;
    }

    if (!selectedType) {
      Alert.alert('Missing Type', 'Please select a collaboration type');
      return;
    }

    if (!selectedGenre) {
      Alert.alert('Missing Genre', 'Please select a genre');
      return;
    }

    if (skillsNeeded.length === 0) {
      Alert.alert('Missing Skills', 'Please select at least one skill needed');
      return;
    }

    if (!budget.trim()) {
      Alert.alert('Missing Budget', 'Please enter a budget range');
      return;
    }

    if (!deadline.trim()) {
      Alert.alert('Missing Deadline', 'Please enter a deadline');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Project Created!',
        'Your collaboration project has been posted successfully. Artists can now apply to work with you.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
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
          
          <Text className="text-lg font-semibold text-white">Create Project</Text>
          
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
          {/* Project Title */}
          <Animated.View entering={FadeInUp} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Project Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Need vocalist for R&B track"
              placeholderTextColor="#6B7280"
              className="bg-gray-900 text-white rounded-xl px-4 py-4 text-base"
              maxLength={100}
            />
            <Text className="text-gray-500 text-sm mt-2">{title.length}/100 characters</Text>
          </Animated.View>

          {/* Project Description */}
          <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your project, what you're looking for, and any specific requirements..."
              placeholderTextColor="#6B7280"
              className="bg-gray-900 text-white rounded-xl px-4 py-4 text-base min-h-[120px]"
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text className="text-gray-500 text-sm mt-2">{description.length}/500 characters</Text>
          </Animated.View>

          {/* Collaboration Type */}
          <Animated.View entering={FadeInUp.delay(200)} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Collaboration Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {collaborationTypes.map((type, index) => (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className={`rounded-full px-4 py-3 mr-3 ${
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
          </Animated.View>

          {/* Genre */}
          <Animated.View entering={FadeInUp.delay(300)} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Genre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {genres.map((genre, index) => (
                <Pressable
                  key={genre}
                  onPress={() => setSelectedGenre(genre)}
                  className={`rounded-full px-4 py-3 mr-3 ${
                    selectedGenre === genre ? 'bg-purple-600' : 'bg-gray-800'
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
          </Animated.View>

          {/* Skills Needed */}
          <Animated.View entering={FadeInUp.delay(400)} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Skills Needed</Text>
            <Text className="text-gray-400 text-sm mb-3">Select all that apply</Text>
            <View className="flex-row flex-wrap">
              {skillCategories.map((skill, index) => (
                <Pressable
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  className={`rounded-full px-4 py-3 mr-3 mb-3 border-2 ${
                    skillsNeeded.includes(skill) 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'bg-transparent border-gray-600'
                  }`}
                >
                  <Text className={`font-medium ${
                    skillsNeeded.includes(skill) ? 'text-white' : 'text-gray-300'
                  }`}>
                    {skill}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Budget */}
          <Animated.View entering={FadeInUp.delay(500)} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Budget Range</Text>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              placeholder="e.g., $200-500 or Negotiable"
              placeholderTextColor="#6B7280"
              className="bg-gray-900 text-white rounded-xl px-4 py-4 text-base"
            />
          </Animated.View>

          {/* Deadline */}
          <Animated.View entering={FadeInUp.delay(600)} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Deadline</Text>
            <TextInput
              value={deadline}
              onChangeText={setDeadline}
              placeholder="e.g., 2 weeks, 1 month, ASAP"
              placeholderTextColor="#6B7280"
              className="bg-gray-900 text-white rounded-xl px-4 py-4 text-base"
            />
          </Animated.View>

          {/* Urgent Project Toggle */}
          <Animated.View entering={FadeInUp.delay(700)} className="mb-8">
            <Pressable
              onPress={() => setIsUrgent(!isUrgent)}
              className="flex-row items-center justify-between bg-gray-900 rounded-xl px-4 py-4"
            >
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">Mark as Urgent</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Urgent projects get priority visibility
                </Text>
              </View>
              <View className={`w-12 h-6 rounded-full ${isUrgent ? 'bg-red-600' : 'bg-gray-600'}`}>
                <View className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-all ${
                  isUrgent ? 'ml-6' : 'ml-1'
                }`} />
              </View>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* Create Button */}
        <View className="px-4 pb-6 border-t border-gray-800 pt-4">
          <AnimatedPressable
            entering={FadeInUp.delay(800)}
            onPress={handleCreateProject}
            disabled={isLoading}
            className={`bg-orange-600 rounded-xl py-4 items-center ${
              isLoading ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-white font-semibold text-lg">
              {isLoading ? 'Creating Project...' : 'Create Project'}
            </Text>
          </AnimatedPressable>
        </View>
      </View>
    </SafeAreaView>
  );
}