import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { useCollaborationStore } from '../state/collaboration';
import Animated, { FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ApplyProjectScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { projectId } = route.params as { projectId: string };
  
  const { user } = useAuthStore();
  const { getUserById } = useUsersStore();
  const { getProjectById, applyToProject, getApplicationsForProject } = useCollaborationStore();
  
  const [message, setMessage] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const project = getProjectById(projectId);
  const projectCreator = project ? getUserById(project.creatorId) : null;
  const existingApplications = getApplicationsForProject(projectId);
  const hasAlreadyApplied = user ? existingApplications.some(app => app.applicantId === user.id) : false;

  if (!project || !user) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Project not found</Text>
      </SafeAreaView>
    );
  }

  if (project.creatorId === user.id) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-6">
        <Ionicons name="information-circle-outline" size={80} color="#6B7280" />
        <Text className="text-white text-xl font-semibold mt-6 text-center">
          This is Your Project
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          You cannot apply to your own collaboration project.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-orange-600 rounded-xl px-6 py-3 mt-6"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (hasAlreadyApplied) {
    const userApplication = existingApplications.find(app => app.applicantId === user.id);
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-6">
        <Ionicons name="checkmark-circle-outline" size={80} color="#10B981" />
        <Text className="text-white text-xl font-semibold mt-6 text-center">
          Application Submitted
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          You have already applied to this project. The creator will review your application.
        </Text>
        <View className="bg-gray-900 rounded-xl p-4 mt-6 w-full">
          <Text className="text-gray-400 text-sm">Status</Text>
          <Text className={`font-semibold capitalize ${
            userApplication?.status === 'pending' ? 'text-yellow-400' :
            userApplication?.status === 'accepted' ? 'text-green-400' :
            'text-red-400'
          }`}>
            {userApplication?.status || 'Pending'}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-gray-700 rounded-xl px-6 py-3 mt-6"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleSubmitApplication = async () => {
    if (!message.trim()) {
      Alert.alert('Missing Message', 'Please write a message explaining why you are a good fit for this project.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      applyToProject({
        projectId,
        applicantId: user.id,
        message: message.trim(),
        portfolio: portfolio.trim() || undefined,
        status: 'pending'
      });

      Alert.alert(
        'Application Sent!',
        'Your application has been submitted successfully. The project creator will review it and get back to you.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
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
          
          <Text className="text-lg font-semibold text-white">Apply to Project</Text>
          
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
          {/* Project Info */}
          <Animated.View entering={FadeInUp} className="bg-gray-900 rounded-xl p-4 mb-6">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1">
                <Text className="text-white font-bold text-lg mb-1">{project.title}</Text>
                <Text className="text-gray-400 text-sm">by {projectCreator?.username}</Text>
              </View>
              {project.isUrgent && (
                <View className="bg-red-600 rounded-full px-2 py-1">
                  <Text className="text-white text-xs font-medium">URGENT</Text>
                </View>
              )}
            </View>

            <Text className="text-gray-300 text-sm mb-4">{project.description}</Text>

            <View className="flex-row flex-wrap mb-3">
              {project.skillsNeeded.map((skill, idx) => (
                <View key={idx} className="bg-blue-600/20 rounded-full px-3 py-1 mr-2 mb-1">
                  <Text className="text-blue-300 text-xs font-medium">{skill}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row items-center space-x-4">
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
          </Animated.View>

          {/* Application Form */}
          <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Your Application</Text>
            
            {/* Message */}
            <View className="mb-6">
              <Text className="text-white font-medium mb-3">Message *</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Tell the creator why you're the perfect fit for this project. Include your experience, what you can bring to the collaboration, and any relevant background..."
                placeholderTextColor="#6B7280"
                className="bg-gray-900 text-white rounded-xl px-4 py-4 text-base min-h-[120px]"
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text className="text-gray-500 text-sm mt-2">{message.length}/1000 characters</Text>
            </View>

            {/* Portfolio/Links */}
            <View className="mb-6">
              <Text className="text-white font-medium mb-3">Portfolio/Links (Optional)</Text>
              <TextInput
                value={portfolio}
                onChangeText={setPortfolio}
                placeholder="Share links to your work, SoundCloud, YouTube, or portfolio website..."
                placeholderTextColor="#6B7280"
                className="bg-gray-900 text-white rounded-xl px-4 py-4 text-base"
                multiline
                maxLength={500}
              />
              <Text className="text-gray-500 text-sm mt-2">{portfolio.length}/500 characters</Text>
            </View>
          </Animated.View>

          {/* Tips */}
          <Animated.View entering={FadeInUp.delay(200)} className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="bulb" size={20} color="#3B82F6" style={{ marginTop: 2, marginRight: 12 }} />
              <View className="flex-1">
                <Text className="text-blue-400 font-semibold mb-2">Application Tips</Text>
                <Text className="text-blue-200 text-sm leading-5 mb-2">
                  • Be specific about your experience and skills
                </Text>
                <Text className="text-blue-200 text-sm leading-5 mb-2">
                  • Include examples of similar work you've done
                </Text>
                <Text className="text-blue-200 text-sm leading-5 mb-2">
                  • Show enthusiasm for the project
                </Text>
                <Text className="text-blue-200 text-sm leading-5">
                  • Be professional and clear in your communication
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Submit Button */}
        <View className="px-4 pb-6 border-t border-gray-800 pt-4">
          <AnimatedPressable
            entering={FadeInUp.delay(300)}
            onPress={handleSubmitApplication}
            disabled={isLoading}
            className={`bg-orange-600 rounded-xl py-4 items-center ${
              isLoading ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-white font-semibold text-lg">
              {isLoading ? 'Submitting Application...' : 'Submit Application'}
            </Text>
          </AnimatedPressable>
        </View>
      </View>
    </SafeAreaView>
  );
}