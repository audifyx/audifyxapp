import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/auth';
import { useUsersStore } from '../state/users';
import * as Linking from 'expo-linking';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Store categories
const storeCategories = ['Beats', 'Vocals', 'Samples', 'Mixing', 'Mastering', 'Artwork', 'Promotion'];

// No featured items initially - users will create store listings
const featuredItems: any[] = [];

export default function StoreScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { allUsers } = useUsersStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'mystore'>('home');
  const [storeSubTab, setStoreSubTab] = useState<'browse' | 'purchased' | 'selling'>('browse');

  const filteredItems = featuredItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some((tag: any) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // No user purchases or listings initially
  const userPurchases: any[] = [];
  const userListings: any[] = [];

  const handlePurchase = (item: any) => {
    // Find the seller's user profile to get payment methods
    const seller = allUsers.find(u => u.username === item.seller);
    
    if (!seller || (!seller.paypalLink && !seller.cashAppLink)) {
      Alert.alert(
        'Payment Methods Unavailable',
        'This seller has not set up payment methods yet. Please try again later or contact them directly.',
        [{ text: 'OK' }]
      );
      return;
    }

    const paymentOptions = [];
    if (seller.paypalLink) paymentOptions.push('PayPal');
    if (seller.cashAppLink) paymentOptions.push('Cash App');

    Alert.alert(
      'Choose Payment Method',
      `Purchase "${item.title}" for ${item.price}\n\nAvailable payment methods:`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...(seller.paypalLink ? [{
          text: 'PayPal',
          onPress: () => handlePaymentRedirect(item, seller, 'paypal')
        }] : []),
        ...(seller.cashAppLink ? [{
          text: 'Cash App',
          onPress: () => handlePaymentRedirect(item, seller, 'cashapp')
        }] : [])
      ]
    );
  };

  const handlePaymentRedirect = async (item: any, seller: any, method: 'paypal' | 'cashapp') => {
    const paymentUrl = method === 'paypal' ? seller.paypalLink : seller.cashAppLink;
    
    try {
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        Alert.alert(
          'Redirecting to Payment',
          `You will be redirected to ${method === 'paypal' ? 'PayPal' : 'Cash App'} to complete your purchase of "${item.title}" for ${item.price}.\n\nAfter payment, contact ${seller.username} to receive your item.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: () => {
                Linking.openURL(paymentUrl);
                // Show success message after redirect
                setTimeout(() => {
                  Alert.alert(
                    'Payment Initiated',
                    'Please complete the payment and contact the seller for delivery. The item will be added to your library once confirmed.',
                    [{ text: 'OK' }]
                  );
                }, 1000);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Cannot Open Payment Link',
          `Unable to open ${method === 'paypal' ? 'PayPal' : 'Cash App'}. Please make sure you have the app installed or try copying the link manually.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open payment link. Please try again.');
    }
  };

  const handleAddToCart = (item: any) => {
    Alert.alert('Added to Cart', `"${item.title}" has been added to your cart.`);
  };

  const handleCreateListing = () => {
    // Check if user has payment methods set up
    if (!user?.paypalLink && !user?.cashAppLink) {
      Alert.alert(
        'Setup Payment Methods First',
        'To sell items, you need to set up your payment methods so buyers can pay you.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Setup Now', 
            onPress: () => navigation.navigate('PaymentSetup' as never)
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Create Listing',
      'Listing creation feature coming soon! You will be able to sell your beats, services, and more.',
      [{ text: 'OK' }]
    );
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const renderStoreItem = ({ item, index }: { item: any, index: number }) => (
    <AnimatedPressable
      entering={FadeInUp.delay(index * 100)}
      className="bg-gray-900 rounded-xl overflow-hidden mb-4 mx-4"
    >
      {/* Item Image */}
      <View className="relative">
        <Image
          source={{ uri: item.image }}
          className="w-full h-48"
          resizeMode="cover"
        />
        
        {/* Badges */}
        <View className="absolute top-3 left-3 flex-row">
          {item.isHot && (
            <View className="bg-red-600 rounded-full px-2 py-1 mr-2">
              <Text className="text-white text-xs font-bold">🔥 HOT</Text>
            </View>
          )}
          {item.discount && (
            <View className="bg-green-600 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-bold">-{item.discount}%</Text>
            </View>
          )}
        </View>

        {/* Category */}
        <View className="absolute top-3 right-3">
          <View className="bg-black/70 rounded-full px-3 py-1">
            <Text className="text-white text-xs font-medium">{item.category}</Text>
          </View>
        </View>

        {/* Favorite Button */}
        <Pressable className="absolute bottom-3 right-3 w-10 h-10 bg-black/70 rounded-full items-center justify-center">
          <Ionicons name="heart-outline" size={20} color="white" />
        </Pressable>
      </View>

      {/* Item Details */}
      <View className="p-4">
        <Text className="text-white font-bold text-lg mb-2" numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text className="text-gray-300 text-sm mb-3" numberOfLines={2}>
          {item.description}
        </Text>

        {/* Tags */}
        <View className="flex-row flex-wrap mb-3">
          {item.tags.slice(0, 3).map((tag: string, idx: number) => (
            <View key={idx} className="bg-purple-600/20 rounded-full px-2 py-1 mr-2 mb-1">
              <Text className="text-purple-300 text-xs">{tag}</Text>
            </View>
          ))}
        </View>

        {/* Seller & Rating */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons name="person-circle" size={16} color="#6B7280" />
            <Text className="text-gray-400 text-sm ml-1">{item.seller}</Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text className="text-yellow-400 text-sm ml-1">{item.rating}</Text>
            <Text className="text-gray-400 text-sm ml-1">({item.sales})</Text>
          </View>
        </View>

        {/* Price & Actions */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-white font-bold text-xl">${item.price}</Text>
            {item.originalPrice && (
              <Text className="text-gray-500 text-sm line-through ml-2">
                ${item.originalPrice}
              </Text>
            )}
          </View>
          
          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => handleAddToCart(item)}
              className="bg-gray-700 rounded-lg px-4 py-2"
            >
              <Ionicons name="cart" size={16} color="white" />
            </Pressable>
            
            <Pressable
              onPress={() => handlePurchase(item)}
              className="bg-purple-600 rounded-lg px-6 py-2"
            >
              <Text className="text-white font-medium">Buy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );

  const renderPurchasedItem = ({ item, index }: { item: any, index: number }) => (
    <AnimatedPressable
      entering={FadeInUp.delay(index * 100)}
      className="bg-gray-900 rounded-xl p-4 mb-4 mx-4"
    >
      <View className="flex-row">
        <Image
          source={{ uri: item.image }}
          className="w-16 h-16 rounded-lg mr-3"
          resizeMode="cover"
        />
        
        <View className="flex-1">
          <Text className="text-white font-semibold text-base mb-1">{item.title}</Text>
          <Text className="text-gray-400 text-sm mb-2">
            Purchased {formatTimeAgo(item.purchaseDate)}
          </Text>
          <Text className="text-green-400 font-bold">${item.price}</Text>
        </View>
        
        <View className="items-end">
          <Pressable className="bg-purple-600 rounded-lg px-4 py-2 mb-2">
            <Text className="text-white font-medium text-sm">Download</Text>
          </Pressable>
          <Text className="text-gray-400 text-xs">{item.downloadCount} downloads</Text>
        </View>
      </View>
    </AnimatedPressable>
  );

  const renderUserListing = ({ item, index }: { item: any, index: number }) => (
    <AnimatedPressable
      entering={FadeInUp.delay(index * 100)}
      className="bg-gray-900 rounded-xl p-4 mb-4 mx-4"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-white font-bold text-lg mb-1">{item.title}</Text>
          <Text className="text-gray-300 text-sm mb-2" numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${
          item.status === 'active' ? 'bg-green-600/20' : 'bg-gray-600/20'
        }`}>
          <Text className={`text-xs font-medium ${
            item.status === 'active' ? 'text-green-400' : 'text-gray-400'
          }`}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap mb-3">
        {item.tags.map((tag: string, idx: number) => (
          <View key={idx} className="bg-purple-600/20 rounded-full px-2 py-1 mr-2 mb-1">
            <Text className="text-purple-300 text-xs">{tag}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-4">
          <Text className="text-white font-bold text-lg">${item.price}</Text>
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text className="text-yellow-400 text-sm ml-1">{item.rating}</Text>
          </View>
          <Text className="text-gray-400 text-sm">{item.sales} sales</Text>
        </View>
        
        <Pressable className="bg-gray-700 rounded-lg px-4 py-2">
          <Text className="text-white font-medium text-sm">Manage</Text>
        </Pressable>
      </View>

      <View className="border-t border-gray-800 mt-3 pt-3">
        <Text className="text-green-400 font-semibold">
          Total Earnings: ${item.earnings.toFixed(2)}
        </Text>
      </View>
    </AnimatedPressable>
  );

  const renderHomeTab = () => (
    <View className="items-center justify-center flex-1 px-6">
      <Ionicons name="storefront-outline" size={80} color="#6B7280" />
      <Text className="text-white text-xl font-semibold mt-6 text-center">
        Welcome to the Store
      </Text>
      <Text className="text-gray-400 text-center mt-2 leading-6">
        Discover beats, samples, mixing services, and more from talented creators in the Audifyx community.
      </Text>
      <Text className="text-gray-500 text-center mt-4 text-sm">
        No items available yet. Be the first to start selling!
      </Text>
    </View>
  );

  const renderMyStoreTab = () => {
    switch (storeSubTab) {
      case 'browse': // Listings
        return userListings.length > 0 ? (
          <FlatList
            data={userListings}
            renderItem={renderUserListing}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          />
        ) : (
          <View className="items-center justify-center flex-1 px-6">
            <Ionicons name="add-circle-outline" size={80} color="#6B7280" />
            <Text className="text-white text-xl font-semibold mt-6 text-center">
              Start Your Store
            </Text>
            <Text className="text-gray-400 text-center mt-2 leading-6">
              Create your first listing to start selling beats, samples, mixing services, or custom work.
            </Text>
            <Pressable
              onPress={handleCreateListing}
              className="bg-purple-600 rounded-xl px-6 py-3 mt-6"
            >
              <Text className="text-white font-semibold">Create First Listing</Text>
            </Pressable>
          </View>
        );
      
      case 'purchased': // Orders
        return userPurchases.length > 0 ? (
          <FlatList
            data={userPurchases}
            renderItem={renderPurchasedItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          />
        ) : (
          <View className="items-center justify-center flex-1 px-6">
            <Ionicons name="receipt-outline" size={80} color="#6B7280" />
            <Text className="text-white text-xl font-semibold mt-6 text-center">
              No Orders Yet
            </Text>
            <Text className="text-gray-400 text-center mt-2 leading-6">
              Customer orders and purchase requests will appear here.
            </Text>
          </View>
        );
      
      case 'selling': // Analytics
        return (
          <View className="items-center justify-center flex-1 px-6">
            <Ionicons name="analytics-outline" size={80} color="#6B7280" />
            <Text className="text-white text-xl font-semibold mt-6 text-center">
              Store Analytics
            </Text>
            <Text className="text-gray-400 text-center mt-2 leading-6">
              View your sales performance, earnings, and customer insights.
            </Text>
            <View className="w-full mt-8 space-y-4">
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-gray-400 text-sm">Total Earnings</Text>
                <Text className="text-white text-2xl font-bold">$0.00</Text>
              </View>
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-gray-400 text-sm">Total Sales</Text>
                <Text className="text-white text-2xl font-bold">0</Text>
              </View>
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-gray-400 text-sm">Active Listings</Text>
                <Text className="text-white text-2xl font-bold">{userListings.length}</Text>
              </View>
            </View>
          </View>
        );
    }
  };

  const renderTabContent = () => {
    return activeTab === 'home' ? renderHomeTab() : renderMyStoreTab();
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          
          <Text className="text-lg font-semibold text-white">Store</Text>
          
          <View className="flex-row space-x-2">
            <Pressable>
              <Ionicons name="cart" size={24} color="white" />
            </Pressable>
            <Pressable onPress={handleCreateListing}>
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Main Tab Bar */}
        <View className="flex-row bg-black border-b border-gray-800">
          <Pressable
            onPress={() => setActiveTab('home')}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeTab === 'home' ? 'border-purple-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold text-lg ${
              activeTab === 'home' ? 'text-white' : 'text-gray-400'
            }`}>
              Home
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab('mystore')}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeTab === 'mystore' ? 'border-purple-500' : 'border-transparent'
            }`}
          >
            <Text className={`font-semibold text-lg ${
              activeTab === 'mystore' ? 'text-white' : 'text-gray-400'
            }`}>
              My Store
            </Text>
          </Pressable>
        </View>

        {/* Sub Tab Bar for My Store */}
        {activeTab === 'mystore' && (
          <View className="flex-row bg-gray-900 border-b border-gray-800">
            <Pressable
              onPress={() => setStoreSubTab('browse')}
              className={`flex-1 py-3 items-center border-b-2 ${
                storeSubTab === 'browse' ? 'border-purple-400' : 'border-transparent'
              }`}
            >
              <Text className={`font-medium text-sm ${
                storeSubTab === 'browse' ? 'text-white' : 'text-gray-400'
              }`}>
                Listings
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => setStoreSubTab('purchased')}
              className={`flex-1 py-3 items-center border-b-2 ${
                storeSubTab === 'purchased' ? 'border-purple-400' : 'border-transparent'
              }`}
            >
              <Text className={`font-medium text-sm ${
                storeSubTab === 'purchased' ? 'text-white' : 'text-gray-400'
              }`}>
                Orders
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => setStoreSubTab('selling')}
              className={`flex-1 py-3 items-center border-b-2 ${
                storeSubTab === 'selling' ? 'border-purple-400' : 'border-transparent'
              }`}
            >
              <Text className={`font-medium text-sm ${
                storeSubTab === 'selling' ? 'text-white' : 'text-gray-400'
              }`}>
                Analytics
              </Text>
            </Pressable>
          </View>
        )}

        {/* Search Bar - only for home tab */}
        {activeTab === 'home' && (
          <View className="px-4 py-3 border-b border-gray-800">
            <View className="flex-row items-center bg-gray-900 rounded-xl px-3 py-2">
              <Ionicons name="search" size={16} color="#6B7280" />
              <TextInput
                placeholder="Search beats, samples, services..."
                placeholderTextColor="#6B7280"
                className="flex-1 ml-2 text-white text-base"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        )}

        {/* Category Filter - only for home tab */}
        {activeTab === 'home' && (
          <View className="py-3 border-b border-gray-800">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
              <Pressable
                onPress={() => setSelectedCategory(null)}
                className={`rounded-full px-4 py-2 mr-3 ${
                  !selectedCategory ? 'bg-purple-600' : 'bg-gray-800'
                }`}
              >
                <Text className={`font-medium ${
                  !selectedCategory ? 'text-white' : 'text-gray-300'
                }`}>
                  All
                </Text>
              </Pressable>
              
              {storeCategories.map((category, index) => (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 mr-3 ${
                    selectedCategory === category ? 'bg-purple-600' : 'bg-gray-800'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedCategory === category ? 'text-white' : 'text-gray-300'
                  }`}>
                    {category}
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