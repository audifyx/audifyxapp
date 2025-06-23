import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import { useCollaborationStore } from '../state/collaboration';
import Animated, { FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ManageProjectScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { projectId } = route.params as { projectId: string };
  
  const { user } = useAuthStore();
  const { getUserById } = useUsersStore();
  const { 
    getProjectById, 
    getApplicationsForProject, 
    updateApplication, 
    updateProject, 
    deleteProject 
  } = useCollaborationStore();
  
  const [activeTab, setActiveTab] = useState<'applications' | 'details'>('applications');

  const project = getProjectById(projectId);
  const applications = getApplicationsForProject(projectId);

  if (!project || !user || project.creatorId !== user.id) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Project not found or access denied</Text>
      </SafeAreaView>
    );
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Recently';
  };

  const handleAcceptApplication = (applicationId: string) => {
    Alert.alert(
      'Accept Application',
      'Are you sure you want to accept this application? This will notify the applicant.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: () => {
            updateApplication(applicationId, 'accepted');
            Alert.alert('Application Accepted', 'The applicant has been notified.');
          }
        }
      ]
    );
  };

  const handleRejectApplication = (applicationId: string) => {
    Alert.alert(
      'Reject Application',
      'Are you sure you want to reject this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: () => {
            updateApplication(applicationId, 'rejected');
            Alert.alert('Application Rejected', 'The applicant has been notified.');
          }
        }
      ]
    );
  };

  const handleUpdateProjectStatus = (status: 'active' | 'in_progress' | 'completed' | 'cancelled') => {
    const statusLabels = {
      active: 'Active',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };

    Alert.alert(
      'Update Project Status',
      `Change project status to "${statusLabels[status]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: () => {
            updateProject(projectId, { status });
            Alert.alert('Status Updated', `Project marked as ${statusLabels[status].toLowerCase()}.`);
          }
        }
      ]
    );
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteProject(projectId);
            Alert.alert('Project Deleted', 'Your project has been removed.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        }
      ]
    );
  };

  const renderApplicationsTab = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {applications.length > 0 ? (
        <View className="px-4 py-4">
          {applications.map((application, index) => {
            const applicant = getUserById(application.applicantId);
            if (!applicant) return null;

            return (
              <AnimatedPressable
                key={application.id}
                entering={FadeInUp.delay(index * 100)}
                className="bg-gray-900 rounded-xl p-4 mb-4"
              >
                {/* Applicant Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center mr-3">
                      {applicant.profileImage ? (
                        <Image
                          source={{ uri: applicant.profileImage }}
                          className="w-full h-full rounded-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Text className="text-white text-base font-bold">
                          {applicant.username[0]?.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-semibold text-base">{applicant.username}</Text>
                        {applicant.isVerified && (
                          <Ionicons name="checkmark-circle" size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
                        )}
                      </View>
                      <Text className="text-gray-400 text-sm">{formatTimeAgo(application.appliedAt)}</Text>
                    </View>
                  </View>
                  
                  <View className={`px-2 py-1 rounded-full ${
                    application.status === 'pending' ? 'bg-yellow-600/20' :
                    application.status === 'accepted' ? 'bg-green-600/20' :
                    'bg-red-600/20'
                  }`}>
                    <Text className={`text-xs font-medium capitalize ${
                      application.status === 'pending' ? 'text-yellow-400' :
                      application.status === 'accepted' ? 'text-green-400' :
                      'text-red-400'
                    }`}>
                      {application.status}
                    </Text>
                  </View>
                </View>

                {/* Application Message */}
                <Text className="text-gray-300 text-sm mb-4 leading-5">
                  {application.message}
                </Text>

                {/* Portfolio Link */}
                {application.portfolio && (
                  <View className="bg-gray-800 rounded-lg p-3 mb-4">
                    <Text className="text-gray-400 text-xs mb-1">Portfolio/Links</Text>
                    <Text className="text-blue-400 text-sm">{application.portfolio}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                {application.status === 'pending' && (
                  <View className="flex-row space-x-3">
                    <Pressable
                      onPress={() => handleAcceptApplication(application.id)}
                      className="flex-1 bg-green-600 rounded-lg py-3"
                    >
                      <Text className="text-white font-medium text-center">Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRejectApplication(application.id)}
                      className="flex-1 bg-red-600 rounded-lg py-3"
                    >
                      <Text className="text-white font-medium text-center">Reject</Text>
                    </Pressable>
                  </View>
                )}
              </AnimatedPressable>
            );
          })}
        </View>
      ) : (
        <View className="items-center justify-center flex-1 px-6 py-20">
          <Ionicons name="people-outline" size={80} color="#6B7280" />
          <Text className="text-white text-xl font-semibold mt-6 text-center">
            No Applications Yet
          </Text>
          <Text className="text-gray-400 text-center mt-2 leading-6">
            Applications will appear here as artists apply to your project.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderDetailsTab = () => (
    <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
      {/* Project Status */}
      <Animated.View entering={FadeInUp} className="mb-6">
        <Text className="text-white font-semibold text-lg mb-3">Project Status</Text>
        <View className="bg-gray-900 rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-400">Current Status</Text>
            <View className={`px-3 py-1 rounded-full ${
              project.status === 'active' ? 'bg-green-600/20' :
              project.status === 'in_progress' ? 'bg-blue-600/20' :
              project.status === 'completed' ? 'bg-purple-600/20' :
              'bg-red-600/20'
            }`}>
              <Text className={`font-medium capitalize ${
                project.status === 'active' ? 'text-green-400' :
                project.status === 'in_progress' ? 'text-blue-400' :
                project.status === 'completed' ? 'text-purple-400' :
                'text-red-400'
              }`}>
                {project.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          
          <View className="flex-row flex-wrap gap-2">
            {(['active', 'in_progress', 'completed', 'cancelled'] as const).map(status => (
              <Pressable
                key={status}
                onPress={() => handleUpdateProjectStatus(status)}
                disabled={project.status === status}
                className={`px-4 py-2 rounded-lg ${
                  project.status === status 
                    ? 'bg-gray-700' 
                    : 'bg-gray-800 border border-gray-600'
                }`}
              >
                <Text className={`text-sm font-medium capitalize ${
                  project.status === status ? 'text-gray-500' : 'text-white'
                }`}>
                  {status.replace('_', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Project Stats */}
      <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
        <Text className="text-white font-semibold text-lg mb-3">Statistics</Text>
        <View className="bg-gray-900 rounded-xl p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-400">Total Applications</Text>
            <Text className="text-white font-bold text-lg">{applications.length}</Text>
          </View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-400">Pending Reviews</Text>
            <Text className="text-yellow-400 font-bold text-lg">
              {applications.filter(app => app.status === 'pending').length}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-400">Accepted</Text>
            <Text className="text-green-400 font-bold text-lg">
              {applications.filter(app => app.status === 'accepted').length}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-400">Created</Text>
            <Text className="text-white font-bold">
              {formatTimeAgo(project.createdAt)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Project Details */}
      <Animated.View entering={FadeInUp.delay(200)} className="mb-6">
        <Text className="text-white font-semibold text-lg mb-3">Project Details</Text>
        <View className="bg-gray-900 rounded-xl p-4 space-y-4">
          <View>
            <Text className="text-gray-400 text-sm">Title</Text>
            <Text className="text-white font-medium">{project.title}</Text>
          </View>
          
          <View>
            <Text className="text-gray-400 text-sm">Description</Text>
            <Text className="text-gray-300 text-sm leading-5">{project.description}</Text>
          </View>
          
          <View>
            <Text className="text-gray-400 text-sm">Skills Needed</Text>
            <View className="flex-row flex-wrap mt-2">
              {project.skillsNeeded.map((skill, idx) => (
                <View key={idx} className="bg-blue-600/20 rounded-full px-3 py-1 mr-2 mb-1">
                  <Text className="text-blue-300 text-xs">{skill}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View className="flex-row justify-between">
            <View>
              <Text className="text-gray-400 text-sm">Budget</Text>
              <Text className="text-green-400 font-medium">{project.budget}</Text>
            </View>
            <View>
              <Text className="text-gray-400 text-sm">Deadline</Text>
              <Text className="text-yellow-400 font-medium">{project.deadline}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Danger Zone */}
      <Animated.View entering={FadeInUp.delay(300)} className="mb-8">
        <Text className="text-white font-semibold text-lg mb-3">Danger Zone</Text>
        <View className="bg-red-900/20 border border-red-600/30 rounded-xl p-4">
          <Pressable
            onPress={handleDeleteProject}
            className="bg-red-600 rounded-lg py-3"
          >
            <Text className="text-white font-semibold text-center">Delete Project</Text>
          </Pressable>
          <Text className="text-red-200 text-sm text-center mt-2">
            This action cannot be undone
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          
          <Text className="text-lg font-semibold text-white">Manage Project</Text>
          
          <View className="w-6" />
        </View>

        {/* Tab Bar */}
        <View className="flex-row bg-black border-b border-gray-800">
          <Pressable
            onPress={() => setActiveTab('applications')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'applications' ? 'border-orange-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold ${
              activeTab === 'applications' ? 'text-white' : 'text-gray-400'
            }`}>
              Applications ({applications.length})
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab('details')}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === 'details' ? 'border-orange-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold ${
              activeTab === 'details' ? 'text-white' : 'text-gray-400'
            }`}>
              Details
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === 'applications' ? renderApplicationsTab() : renderDetailsTab()}
      </View>
    </SafeAreaView>
  );
}