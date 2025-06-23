import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../state/auth';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuthStore();
  
  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !username)) {
      return;
    }
    
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(username, email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Authentication Error', (error as any)?.message || String(error) || 'Please try again');
    } finally {
      setLoading(false);
    }
  };
  

  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
          <View className="flex-1 justify-center">
            <Animated.View entering={FadeInUp.delay(200)} className="items-center mb-12">
              <Text className="text-4xl font-bold text-white mb-2">Audifyx</Text>
              <Text className="text-gray-400 text-center">
                Discover and share music with the world
              </Text>
            </Animated.View>
            
            <Animated.View entering={FadeInUp.delay(400)} className="space-y-4">
              {isSignUp && (
                <View>
                  <Text className="text-white text-sm font-medium mb-2">Username</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    placeholderTextColor="#6B7280"
                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                    autoCapitalize="none"
                  />
                </View>
              )}
              
              <View>
                <Text className="text-white text-sm font-medium mb-2">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View>
                <Text className="text-white text-sm font-medium mb-2">Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base"
                  secureTextEntry
                />
              </View>
              
              <AnimatedPressable
                entering={FadeInUp.delay(600)}
                onPress={handleAuth}
                disabled={loading}
                className={`bg-purple-600 rounded-xl py-4 mt-6 ${loading ? 'opacity-70' : ''}`}
              >
                <Text className="text-white text-center text-lg font-semibold">
                  {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              </AnimatedPressable>
              
              <AnimatedPressable
                entering={FadeInDown.delay(800)}
                onPress={() => setIsSignUp(!isSignUp)}
                className="py-4"
              >
                <Text className="text-gray-400 text-center">
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <Text className="text-purple-400 font-medium">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </AnimatedPressable>
              
              {/* Security Notice */}
              <Animated.View entering={FadeInDown.delay(1000)} className="mt-8 bg-gray-900 border border-gray-700 rounded-xl p-4">
                <Text className="text-white font-semibold mb-2 text-center">🔐 Secure Authentication</Text>
                <Text className="text-gray-400 text-sm text-center">
                  {isSignUp 
                    ? 'Create your secure account with password protection. Existing platform users can use Sign Up to add password security to their accounts.'
                    : 'Sign in with your email and password. All accounts are now secured with proper authentication.'
                  }
                </Text>
              </Animated.View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}