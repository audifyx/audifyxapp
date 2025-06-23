import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/auth';
import Animated, { FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PaymentSetupScreen() {
  const navigation = useNavigation();
  const { user, updateProfile } = useAuthStore();
  
  const [paypalLink, setPaypalLink] = useState(user?.paypalLink || '');
  const [cashAppLink, setCashAppLink] = useState(user?.cashAppLink || '');
  const [isLoading, setIsLoading] = useState(false);

  const validatePayPalLink = (link: string) => {
    if (!link) return true; // Optional field
    const paypalPattern = /^(https?:\/\/)?(www\.)?(paypal\.me\/|paypal\.com\/paypalme\/)[a-zA-Z0-9._-]+$/;
    return paypalPattern.test(link) || link.includes('paypal.me/') || link.includes('paypal.com');
  };

  const validateCashAppLink = (link: string) => {
    if (!link) return true; // Optional field
    return link.startsWith('$') || link.includes('cash.app') || link.includes('$');
  };

  const handleSave = async () => {
    if (!validatePayPalLink(paypalLink)) {
      Alert.alert('Invalid PayPal Link', 'Please enter a valid PayPal.me link (e.g., https://paypal.me/yourusername)');
      return;
    }

    if (!validateCashAppLink(cashAppLink)) {
      Alert.alert('Invalid Cash App', 'Please enter a valid Cash App username (e.g., $yourusername) or cash.app link');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateProfile({
        paypalLink: paypalLink.trim(),
        cashAppLink: cashAppLink.trim()
      });
      
      Alert.alert(
        'Payment Setup Complete!',
        'Your payment methods have been saved. Buyers can now pay you directly through these methods.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save payment methods. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Payment Setup?',
      'You can add payment methods later in your profile settings. Without payment methods, buyers cannot purchase your items.',
      [
        { text: 'Add Later', onPress: () => navigation.goBack() },
        { text: 'Setup Now', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          
          <Text className="text-lg font-semibold text-white">Payment Setup</Text>
          
          <Pressable onPress={handleSkip}>
            <Text className="text-purple-400 font-medium">Skip</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
          {/* Header Info */}
          <Animated.View entering={FadeInUp} className="mb-8">
            <Text className="text-white text-2xl font-bold mb-2">
              Setup Payment Methods
            </Text>
            <Text className="text-gray-400 text-base leading-6">
              Add your PayPal and Cash App details so buyers can pay you directly for your beats, services, and collaborations.
            </Text>
          </Animated.View>

          {/* PayPal Section */}
          <Animated.View entering={FadeInUp.delay(100)} className="mb-8">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold">PP</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">PayPal</Text>
                <Text className="text-gray-400 text-sm">Receive payments via PayPal</Text>
              </View>
            </View>

            <View className="bg-gray-900 rounded-xl p-4">
              <Text className="text-white font-medium mb-2">PayPal.me Link</Text>
              <TextInput
                value={paypalLink}
                onChangeText={setPaypalLink}
                placeholder="https://paypal.me/yourusername"
                placeholderTextColor="#6B7280"
                className="bg-gray-800 text-white rounded-lg px-4 py-3 text-base"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="text-gray-500 text-sm mt-2">
                Enter your PayPal.me link. Buyers will be redirected to this link to complete payments.
              </Text>
            </View>
          </Animated.View>

          {/* Cash App Section */}
          <Animated.View entering={FadeInUp.delay(200)} className="mb-8">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-green-600 rounded-full items-center justify-center mr-3">
                <Text className="text-white font-bold">$</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">Cash App</Text>
                <Text className="text-gray-400 text-sm">Receive payments via Cash App</Text>
              </View>
            </View>

            <View className="bg-gray-900 rounded-xl p-4">
              <Text className="text-white font-medium mb-2">Cash App Username or Link</Text>
              <TextInput
                value={cashAppLink}
                onChangeText={setCashAppLink}
                placeholder="$yourusername or https://cash.app/$yourusername"
                placeholderTextColor="#6B7280"
                className="bg-gray-800 text-white rounded-lg px-4 py-3 text-base"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="text-gray-500 text-sm mt-2">
                Enter your Cash App username (e.g., $yourusername) or cash.app link.
              </Text>
            </View>
          </Animated.View>

          {/* Security Note */}
          <Animated.View entering={FadeInUp.delay(300)} className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 mb-8">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={20} color="#F59E0B" className="mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-yellow-400 font-semibold mb-1">Security Note</Text>
                <Text className="text-yellow-200 text-sm leading-5">
                  Your payment information is stored securely and only shared with buyers when they make a purchase. We never store sensitive payment details.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* How it Works */}
          <Animated.View entering={FadeInUp.delay(400)} className="mb-8">
            <Text className="text-white font-semibold text-lg mb-4">How it Works</Text>
            
            <View className="space-y-4">
              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center mr-3 mt-0.5">
                  <Text className="text-white text-sm font-bold">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">Buyer clicks "Buy"</Text>
                  <Text className="text-gray-400 text-sm">They select your item and choose a payment method</Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center mr-3 mt-0.5">
                  <Text className="text-white text-sm font-bold">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">Direct payment</Text>
                  <Text className="text-gray-400 text-sm">They're redirected to your PayPal or Cash App to complete payment</Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-purple-600 rounded-full items-center justify-center mr-3 mt-0.5">
                  <Text className="text-white text-sm font-bold">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">You receive payment</Text>
                  <Text className="text-gray-400 text-sm">Money goes directly to your account, no platform fees</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Save Button */}
        <View className="px-4 pb-6 border-t border-gray-800 pt-4">
          <AnimatedPressable
            entering={FadeInUp.delay(500)}
            onPress={handleSave}
            disabled={isLoading}
            className={`bg-purple-600 rounded-xl py-4 items-center ${
              isLoading ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-white font-semibold text-lg">
              {isLoading ? 'Saving...' : 'Save Payment Methods'}
            </Text>
          </AnimatedPressable>
        </View>
      </View>
    </SafeAreaView>
  );
}