import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/auth';
import { useMusicStore } from '../state/music';
import { useUsersStore } from '../state/users';
import Animated, { FadeInUp, FadeInRight, FadeInLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => (
  <Animated.View entering={FadeInUp} className="bg-gray-800 rounded-2xl p-4 mb-4">
    <View className="flex-row items-center justify-between mb-3">
      <View className={`w-12 h-12 rounded-xl items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      {trend && (
        <View className={`flex-row items-center px-2 py-1 rounded-full ${
          trend.isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
        }`}>
          <Ionicons 
            name={trend.isPositive ? 'trending-up' : 'trending-down'} 
            size={12} 
            color={trend.isPositive ? '#10B981' : '#EF4444'} 
          />
          <Text className={`text-xs font-medium ml-1 ${
            trend.isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend.value}
          </Text>
        </View>
      )}
    </View>
    <Text className="text-white text-2xl font-bold mb-1">{value}</Text>
    <Text className="text-gray-400 text-sm">{subtitle}</Text>
    <Text className="text-gray-500 text-xs mt-1">{title}</Text>
  </Animated.View>
);

interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: ChartDataPoint[];
  title: string;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Animated.View entering={FadeInUp} className="bg-gray-800 rounded-2xl p-4 mb-4">
      <Text className="text-white text-lg font-semibold mb-4">{title}</Text>
      <View className="flex-row items-end justify-between" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40);
          return (
            <View key={index} className="items-center flex-1">
              <Text className="text-white text-xs font-medium mb-2">{item.value}</Text>
              <View 
                className="w-8 rounded-t-lg mb-2"
                style={{ 
                  height: Math.max(barHeight, 4),
                  backgroundColor: item.color 
                }}
              />
              <Text className="text-gray-400 text-xs text-center" numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
};

interface TopListProps {
  title: string;
  data: Array<{
    name: string;
    value: string;
    subtitle: string;
    icon?: keyof typeof Ionicons.glyphMap;
  }>;
}

const TopList: React.FC<TopListProps> = ({ title, data }) => (
  <Animated.View entering={FadeInUp} className="bg-gray-800 rounded-2xl p-4 mb-4">
    <Text className="text-white text-lg font-semibold mb-4">{title}</Text>
    <View className="space-y-3">
      {data.map((item, index) => (
        <View key={index} className="flex-row items-center">
          <View className="w-6 h-6 bg-purple-600 rounded-full items-center justify-center mr-3">
            <Text className="text-white text-xs font-bold">{index + 1}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-medium" numberOfLines={1}>{item.name}</Text>
            <Text className="text-gray-400 text-sm" numberOfLines={1}>{item.subtitle}</Text>
          </View>
          <Text className="text-purple-400 font-semibold">{item.value}</Text>
        </View>
      ))}
    </View>
  </Animated.View>
);

export default function InsightsScreen() {
  const { user } = useAuthStore();
  const { tracks } = useMusicStore();
  const { allUsers } = useUsersStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('');

  // Calculate statistics
  const totalTracks = tracks?.length || 0;
  const totalUsers = allUsers?.length || 0;
  const totalStreams = tracks?.reduce((sum, track) => sum + track.streamCount, 0) || 0;
  const averageRating = tracks?.reduce((sum, track) => sum + (track.rating || 0), 0) / Math.max(totalTracks, 1) || 0;

  // User-specific stats
  const userTracks = tracks?.filter(track => track.artist === user?.username) || [];
  const userStreams = userTracks.reduce((sum, track) => sum + track.streamCount, 0);
  const userFollowers = user?.followers || 0;
  const userFollowing = user?.following || 0;

  // Generate demo analytics data
  const weeklyStreams = [
    { label: 'Mon', value: Math.floor(Math.random() * 1000) + 200, color: '#A855F7' },
    { label: 'Tue', value: Math.floor(Math.random() * 1000) + 200, color: '#A855F7' },
    { label: 'Wed', value: Math.floor(Math.random() * 1000) + 200, color: '#A855F7' },
    { label: 'Thu', value: Math.floor(Math.random() * 1000) + 200, color: '#A855F7' },
    { label: 'Fri', value: Math.floor(Math.random() * 1000) + 200, color: '#A855F7' },
    { label: 'Sat', value: Math.floor(Math.random() * 1000) + 200, color: '#A855F7' },
    { label: 'Sun', value: Math.floor(Math.random() * 1000) + 200, color: '#A855F7' },
  ];

  const genreData = [
    { label: 'Hip-Hop', value: Math.floor(Math.random() * 800) + 300, color: '#EF4444' },
    { label: 'R&B', value: Math.floor(Math.random() * 800) + 300, color: '#F59E0B' },
    { label: 'Pop', value: Math.floor(Math.random() * 800) + 300, color: '#10B981' },
    { label: 'Rock', value: Math.floor(Math.random() * 800) + 300, color: '#8B5CF6' },
    { label: 'Electronic', value: Math.floor(Math.random() * 800) + 300, color: '#06B6D4' },
  ];

  const topTracks = userTracks
    .sort((a, b) => b.streamCount - a.streamCount)
    .slice(0, 5)
    .map(track => ({
      name: track.title,
      value: track.streamCount.toLocaleString(),
      subtitle: `${track.genre || 'Unknown'} • ${new Date(track.uploadedAt).toLocaleDateString()}`
    }));

  const topArtists = allUsers
    ?.sort((a, b) => b.followers - a.followers)
    .slice(0, 5)
    .map(artist => ({
      name: artist.username,
      value: artist.followers.toLocaleString(),
      subtitle: `${artist.following} following • ${tracks?.filter(t => t.artist === artist.username).length || 0} tracks`
    })) || [];

  const periods = [
    { key: 'week' as const, label: 'Week' },
    { key: 'month' as const, label: 'Month' },
    { key: 'year' as const, label: 'Year' },
  ];

  const handleStatCardPress = (metric: string) => {
    setSelectedMetric(metric);
    setShowDetailModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">Insights</Text>
          <Text className="text-gray-400 text-sm">Analytics and performance data</Text>
        </View>
        <View className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center">
          <Ionicons name="analytics" size={20} color="white" />
        </View>
      </View>

      {/* Period Selector */}
      <View className="flex-row justify-center py-4 px-4">
        <View className="flex-row bg-gray-800 rounded-xl p-1">
          {periods.map((period) => (
            <Pressable
              key={period.key}
              onPress={() => setSelectedPeriod(period.key)}
              className={`px-4 py-2 rounded-lg ${
                selectedPeriod === period.key ? 'bg-purple-600' : 'bg-transparent'
              }`}
            >
              <Text className={`font-medium ${
                selectedPeriod === period.key ? 'text-white' : 'text-gray-400'
              }`}>
                {period.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Key Metrics */}
        <View className="px-4">
          <Text className="text-white text-lg font-semibold mb-4">📊 Key Metrics</Text>
          <View className="flex-row space-x-3 mb-4">
            <View className="flex-1">
              <Pressable onPress={() => handleStatCardPress('streams')}>
                <StatCard
                  title="Total Streams"
                  value={userStreams.toLocaleString()}
                  subtitle="Your music plays"
                  icon="play"
                  color="#A855F7"
                  trend={{ value: "+12%", isPositive: true }}
                />
              </Pressable>
            </View>
            <View className="flex-1">
              <Pressable onPress={() => handleStatCardPress('followers')}>
                <StatCard
                  title="Followers"
                  value={userFollowers.toLocaleString()}
                  subtitle="People following you"
                  icon="people"
                  color="#10B981"
                  trend={{ value: "+8%", isPositive: true }}
                />
              </Pressable>
            </View>
          </View>

          <View className="flex-row space-x-3 mb-6">
            <View className="flex-1">
              <Pressable onPress={() => handleStatCardPress('tracks')}>
                <StatCard
                  title="Your Tracks"
                  value={userTracks.length.toString()}
                  subtitle="Songs uploaded"
                  icon="musical-note"
                  color="#F59E0B"
                  trend={{ value: "+2", isPositive: true }}
                />
              </Pressable>
            </View>
            <View className="flex-1">
              <Pressable onPress={() => handleStatCardPress('engagement')}>
                <StatCard
                  title="Engagement"
                  value="94%"
                  subtitle="Listener retention"
                  icon="heart"
                  color="#EF4444"
                  trend={{ value: "+5%", isPositive: true }}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Charts */}
        <View className="px-4">
          <Text className="text-white text-lg font-semibold mb-4">📈 Trends</Text>
          <BarChart data={weeklyStreams} title="Weekly Streams" />
          <BarChart data={genreData} title="Genre Performance" />
        </View>

        {/* Top Lists */}
        <View className="px-4">
          <Text className="text-white text-lg font-semibold mb-4">🏆 Top Performers</Text>
          {topTracks.length > 0 && (
            <TopList title="Your Top Tracks" data={topTracks} />
          )}
          <TopList title="Top Artists" data={topArtists} />
        </View>

        {/* Detailed Analytics */}
        <View className="px-4">
          <Text className="text-white text-lg font-semibold mb-4">🔍 Detailed Analytics</Text>
          
          <Animated.View entering={FadeInUp} className="bg-gray-800 rounded-2xl p-4 mb-4">
            <Text className="text-white text-lg font-semibold mb-4">🎯 Audience Insights</Text>
            <View className="space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-300">Average Listen Time</Text>
                <Text className="text-white font-semibold">3:42</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-300">Skip Rate</Text>
                <Text className="text-white font-semibold">8%</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-300">Peak Listening Hours</Text>
                <Text className="text-white font-semibold">8PM - 11PM</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-300">Top Location</Text>
                <Text className="text-white font-semibold">United States</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp} className="bg-gray-800 rounded-2xl p-4 mb-4">
            <Text className="text-white text-lg font-semibold mb-4">💰 Revenue Insights</Text>
            <View className="space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-300">This Month</Text>
                <Text className="text-green-400 font-semibold">$2,450</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-300">Last Month</Text>
                <Text className="text-white font-semibold">$2,180</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-300">Growth</Text>
                <Text className="text-green-400 font-semibold">+12.4%</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-300">Per Stream</Text>
                <Text className="text-white font-semibold">$0.004</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp} className="bg-gray-800 rounded-2xl p-4 mb-4">
            <Text className="text-white text-lg font-semibold mb-4">🌍 Global Reach</Text>
            <View className="space-y-3">
              {[
                { country: 'United States', percentage: 45, streams: '12,450' },
                { country: 'United Kingdom', percentage: 22, streams: '6,230' },
                { country: 'Canada', percentage: 15, streams: '4,120' },
                { country: 'Australia', percentage: 10, streams: '2,890' },
                { country: 'Germany', percentage: 8, streams: '2,100' },
              ].map((item, index) => (
                <View key={index} className="flex-row items-center">
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-white font-medium">{item.country}</Text>
                      <Text className="text-gray-400 text-sm">{item.streams} streams</Text>
                    </View>
                    <View className="w-full h-2 bg-gray-700 rounded-full">
                      <View 
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Bottom padding */}
        <View className="h-20" />
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
            <Pressable onPress={() => setShowDetailModal(false)}>
              <Text className="text-purple-500 text-base font-medium">Done</Text>
            </Pressable>
            <Text className="text-white text-lg font-semibold">Detailed {selectedMetric}</Text>
            <View className="w-12" />
          </View>
          
          <ScrollView className="flex-1 p-4">
            <View className="bg-gray-800 rounded-2xl p-4 mb-4">
              <Text className="text-white text-lg font-semibold mb-4">
                📊 {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Breakdown
              </Text>
              <Text className="text-gray-300 text-base leading-6">
                Detailed analytics for your {selectedMetric} will be available here. This includes:
                {'\n\n'}
                • Historical data over time
                {'\n'}• Comparative analysis
                {'\n'}• Predictive insights
                {'\n'}• Actionable recommendations
                {'\n\n'}
                Coming soon with enhanced analytics features!
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}