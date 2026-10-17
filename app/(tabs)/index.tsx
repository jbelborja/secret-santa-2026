import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMyRaffles } from '@/hooks/useMyRaffles';
import { RaffleCard } from '@/components/raffle/RaffleCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MyRafflesScreen() {
  const router = useRouter();
  const { managedRaffles, participatingRaffles, loading, error, refetch } = useMyRaffles();

  if (loading && managedRaffles.length === 0 && participatingRaffles.length === 0) {
    return <LoadingSpinner message="Loading your raffles..." />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FAFAFA' }}
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refetch}
          tintColor="#B91C1C"
          colors={['#B91C1C']}
        />
      }
    >
      {/* Top Header bar with + button */}
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-2xl font-black text-gray-900 tracking-tight">
            My Raffles
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            Organize and exchange secret gifts
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/raffle/create')}
          className="flex-row items-center bg-[#B91C1C] px-3.5 py-2.5 rounded-xl shadow-sm active:bg-[#991B1B]"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text className="text-white font-bold text-sm ml-1">New Raffle</Text>
        </Pressable>
      </View>

      {/* Error message */}
      {error ? (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <Text className="text-xs text-red-600 font-medium">{error}</Text>
        </View>
      ) : null}

      {/* Section 1: Raffles I manage */}
      <View className="mb-8">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-gray-900">
              Raffles I Manage
            </Text>
            <View className="ml-2 bg-red-100 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-bold text-[#B91C1C]">
                {managedRaffles.length}
              </Text>
            </View>
          </View>
        </View>

        {managedRaffles.length === 0 ? (
          <EmptyState
            icon="gift-outline"
            title="No managed raffles yet"
            subtitle="Create a raffle and invite your friends, family, or colleagues."
            action={{
              label: 'Create First Raffle',
              onPress: () => router.push('/raffle/create'),
            }}
          />
        ) : (
          managedRaffles.map((raffle) => (
            <RaffleCard
              key={raffle.id}
              raffle={raffle}
              isManager
              onPress={() => router.push(`/raffle/${raffle.id}` as any)}
            />
          ))
        )}
      </View>

      {/* Section 2: Raffles I participate in */}
      <View>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-gray-900">
              Raffles I Participate In
            </Text>
            <View className="ml-2 bg-emerald-100 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-bold text-emerald-800">
                {participatingRaffles.length}
              </Text>
            </View>
          </View>
        </View>

        {participatingRaffles.length === 0 ? (
          <EmptyState
            icon="snow-outline"
            title="No participating raffles"
            subtitle="Got an invite code? Open the invite link to accept and join the gift exchange."
          />
        ) : (
          participatingRaffles.map((raffle) => (
            <RaffleCard
              key={raffle.id}
              raffle={raffle}
              isManager={false}
              onPress={() => router.push(`/raffle/${raffle.id}` as any)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
