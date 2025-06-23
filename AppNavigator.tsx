import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../state/auth';
import AuthScreen from '../screens/AuthScreen';
import MainTabs from './MainTabs';
import UploadScreen from '../screens/UploadScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ChatScreen from '../screens/ChatScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CallScreen from '../screens/CallScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import ProdConnectScreen from '../screens/ProdConnectScreen';
import CollaborationHubScreen from '../screens/CollaborationHubScreen';
import StoreScreen from '../screens/StoreScreen';
import PaymentSetupScreen from '../screens/PaymentSetupScreen';
import CreateProjectScreen from '../screens/CreateProjectScreen';
import ApplyProjectScreen from '../screens/ApplyProjectScreen';
import ManageProjectScreen from '../screens/ManageProjectScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Upload" component={UploadScreen} />
          <Stack.Screen name="Playlists" component={PlaylistScreen} />
          <Stack.Screen name="Library" component={LibraryScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Call" component={CallScreen} />
          <Stack.Screen name="VideoCall" component={VideoCallScreen} />
          <Stack.Screen name="ProdConnect" component={ProdConnectScreen} />
          <Stack.Screen name="CollaborationHub" component={CollaborationHubScreen} />
          <Stack.Screen name="Store" component={StoreScreen} />
          <Stack.Screen name="PaymentSetup" component={PaymentSetupScreen} />
          <Stack.Screen name="CreateProject" component={CreateProjectScreen} />
          <Stack.Screen name="ApplyProject" component={ApplyProjectScreen} />
          <Stack.Screen name="ManageProject" component={ManageProjectScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}