import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { useMyRaffles } from '@/hooks/useMyRaffles';
import { RaffleCard } from '@/components/raffle/RaffleCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { JoinWithCodeModal } from '@/components/raffle/JoinWithCodeModal';

export default function MyRafflesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    managedRaffles,
    participatingRaffles,
    pendingRaffles,
    pastRaffles,
    loading,
    error,
    refetch,
  } = useMyRaffles();
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [showPastRaffles, setShowPastRaffles] = useState(false);

  const totalActive =
    managedRaffles.length + participatingRaffles.length + pendingRaffles.length;

  if (loading && totalActive === 0 && pastRaffles.length === 0) {
    return <LoadingSpinner message={t('home.loadingRaffles')} />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FAFAFA' }}
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refetch}
          tintColor="#B91C1C"
          colors={['#B91C1C']}
        />
      }
    >
      {/* Top Header bar */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center flex-1">
          <View className="w-11 h-11 rounded-xl overflow-hidden mr-3 border border-red-100 bg-red-50 items-center justify-center shadow-xs">
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 44, height: 44, borderRadius: 12 }}
              resizeMode="cover"
            />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-black text-gray-900 tracking-tight">
              {t('home.title')}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
              {t('home.subtitle')}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Bar: New Raffle & Join with Code */}
      <View className="flex-row gap-2.5 mb-6">
        <Pressable
          onPress={() => router.push('/raffle/create')}
          className="flex-1 flex-row items-center justify-center bg-[#B91C1C] py-3 px-3 rounded-xl shadow-xs active:bg-[#991B1B]"
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text className="text-white font-bold text-sm ml-1.5">{t('home.newRaffle')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setJoinModalVisible(true)}
          className="flex-1 flex-row items-center justify-center bg-white border border-gray-200 py-3 px-3 rounded-xl shadow-xs active:bg-gray-50"
        >
          <Ionicons name="ticket-outline" size={18} color="#B91C1C" />
          <Text className="text-gray-800 font-bold text-sm ml-1.5">{t('home.joinWithCodeBtn')}</Text>
        </Pressable>
      </View>

      {/* Error message */}
      {error ? (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <Text className="text-xs text-red-600 font-medium">{error}</Text>
        </View>
      ) : null}

      {/* Section 0: Pending Invitations to Accept */}
      {pendingRaffles.length > 0 ? (
        <View className="mb-7 bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
              <Ionicons name="mail-unread" size={20} color="#D97706" />
              <Text className="text-base font-black text-amber-900 ml-2">
                {t('home.pendingSection')}
              </Text>
            </View>
            <View className="bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
              <Text className="text-xs font-bold text-amber-900">
                {pendingRaffles.length}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-amber-800 mb-3.5 leading-4">
            {t('home.pendingSubtitle')}
          </Text>

          {pendingRaffles.map((raffle) => (
            <RaffleCard
              key={raffle.id}
              raffle={raffle}
              isPending
              isManager={false}
              onPress={() => router.push(`/raffle/${raffle.id}` as any)}
            />
          ))}
        </View>
      ) : null}

      {/* Section 1: Raffles I participate in (Active) */}
      <View className="mb-8">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-gray-900">
              {t('home.participateSection')}
            </Text>
            <View className="ml-2 bg-emerald-100 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-bold text-emerald-800">
                {participatingRaffles.length}
              </Text>
            </View>
          </View>

          {participatingRaffles.length > 0 ? (
            <Pressable
              onPress={() => setJoinModalVisible(true)}
              className="flex-row items-center active:opacity-70 py-1"
            >
              <Ionicons name="add-circle-outline" size={16} color="#B91C1C" />
              <Text className="text-xs font-bold text-[#B91C1C] ml-1">
                {t('home.joinWithCodeBtn')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {participatingRaffles.length === 0 ? (
          <EmptyState
            icon="snow-outline"
            title={t('home.emptyParticipateTitle')}
            subtitle={t('home.emptyParticipateSubtitle')}
            action={{
              label: t('home.joinWithCodeBtn'),
              onPress: () => setJoinModalVisible(true),
            }}
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

      {/* Section 2: Raffles I manage (Active) */}
      <View className="mb-8">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-gray-900">
              {t('home.manageSection')}
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
            title={t('home.emptyManageTitle')}
            subtitle={t('home.emptyManageSubtitle')}
            action={{
              label: t('home.emptyManageAction'),
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

      {/* Section 3: Past & Completed Raffles Link / Collapsible */}
      <View className="mt-2 pt-4 border-t border-gray-200">
        <Pressable
          onPress={() => setShowPastRaffles(!showPastRaffles)}
          className="flex-row items-center justify-between bg-white p-3.5 rounded-2xl border border-gray-200 active:bg-gray-50 shadow-xs"
        >
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-2.5">
              <Ionicons name="archive-outline" size={17} color="#4B5563" />
            </View>
            <Text className="text-sm font-bold text-gray-800">
              {t('home.pastSection')}
            </Text>
            <View className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-bold text-gray-600">
                {pastRaffles.length}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <Text className="text-xs font-semibold text-gray-500 mr-1.5">
              {showPastRaffles
                ? t('home.hidePastRaffles')
                : t('home.showPastRaffles', { count: pastRaffles.length })}
            </Text>
            <Ionicons
              name={showPastRaffles ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#6B7280"
            />
          </View>
        </Pressable>

        {showPastRaffles ? (
          <View className="mt-3">
            {pastRaffles.length === 0 ? (
              <View className="py-6 px-4 items-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Text className="text-xs font-semibold text-gray-600">
                  {t('home.emptyPastTitle')}
                </Text>
                <Text className="text-[11px] text-gray-400 mt-0.5 text-center">
                  {t('home.emptyPastSubtitle')}
                </Text>
              </View>
            ) : (
              pastRaffles.map((raffle) => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  isManager={raffle.managerId === user?.uid}
                  onPress={() => router.push(`/raffle/${raffle.id}` as any)}
                />
              ))
            )}
          </View>
        ) : null}
      </View>

      <JoinWithCodeModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
      />
    </ScrollView>
  );
}
