import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { useRaffle } from '@/hooks/useRaffle';
import { useParticipants } from '@/hooks/useParticipants';
import { updateDoc, participantDoc, addDoc, participantsCollection } from '@/lib/firestore';
import { StatusBadge } from '@/components/raffle/StatusBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PageContainer } from '@/components/ui/PageContainer';

export default function RaffleParticipantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { raffle, loading: raffleLoading, error: raffleError } = useRaffle(id);
  const { participants, loading: partsLoading, error: partsError } = useParticipants(id);

  const [actionLoading, setActionLoading] = useState(false);

  if (raffleLoading || partsLoading) {
    return <LoadingSpinner message={t('raffleDetail.loading')} />;
  }

  if (raffleError || !raffle) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-16 h-16 rounded-2xl bg-red-50 items-center justify-center mb-4 border border-red-100">
          <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
        </View>
        <Text className="text-lg font-bold text-gray-800 text-center">
          {raffleError && raffleError !== 'Raffle not found'
            ? raffleError
            : t('raffleDetail.notFound')}
        </Text>
        <Button
          title={t('raffleDetail.goToRaffles')}
          onPress={() => router.replace('/(tabs)')}
          variant="primary"
          className="mt-4"
        />
      </View>
    );
  }

  const isManager = user?.uid === raffle.managerId;
  const userEmail = (user?.email || '').trim().toLowerCase();
  const myParticipant = participants.find(
    (p) =>
      p.userId === user?.uid ||
      (userEmail && (p.email || '').trim().toLowerCase() === userEmail)
  );

  const isDrawn = raffle.status === 'drawn' || raffle.status === 'completed';
  const targetDateForTimer = isDrawn ? raffle.giftDate : raffle.raffleDate;
  const timerLabel = isDrawn ? t('raffleDetail.giftExchangeIn') : t('raffleDetail.pairingsDrawnIn');

  const handleAcceptInvite = async () => {
    if (!user || !id || !myParticipant) return;
    setActionLoading(true);
    try {
      const participantPayload: Record<string, any> = {
        status: 'accepted',
        userId: user.uid,
        joinedAt: new Date(),
      };
      if (user.expoPushToken) {
        participantPayload.expoPushToken = user.expoPushToken;
      }

      await updateDoc(participantDoc(id, myParticipant.id), participantPayload);
    } catch (err: unknown) {
      console.error('Error accepting invitation:', err);
      const rawMsg =
        (err as any)?.message ||
        (err instanceof Error ? err.message : '') ||
        (typeof err === 'string' ? err : '');
      const errMsg = rawMsg || t('common.error');
      if (Platform.OS === 'web') {
        window.alert(`Error: ${errMsg}`);
      } else {
        Alert.alert(t('common.error'), errMsg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!myParticipant || !id) return;
    setActionLoading(true);
    try {
      await updateDoc(participantDoc(id, myParticipant.id), {
        status: 'declined',
      });
    } catch (err) {
      console.error('Error declining invitation:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ paddingVertical: 20, paddingBottom: 60 }}
    >
      <PageContainer maxWidth={840} className="px-4 sm:px-6">
        {/* Header Info Card */}
        <Card elevated className="p-5 mb-4 border border-gray-100 bg-white">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1.5">
              <StatusBadge status={raffle.status} />
              {isManager ? (
                <View className="ml-2">
                  <Badge label={t('raffleDetail.organizer')} variant="warning" size="sm" />
                </View>
              ) : null}
            </View>
            <Text className="text-2xl font-black text-gray-900 mt-1">
              {raffle.name}
            </Text>
            {raffle.topic ? (
              <Text className="text-sm text-gray-600 mt-1">
                {t('raffleDetail.themePrefix')}<Text className="font-semibold">{raffle.topic}</Text>
              </Text>
            ) : null}
          </View>

          <View className="bg-red-50 p-2.5 rounded-2xl items-center justify-center border border-red-100">
            <Ionicons name="pricetag-outline" size={18} color="#B91C1C" />
            <Text className="text-xs font-black text-[#B91C1C] mt-1">
              {raffle.priceLimit} {raffle.currency}
            </Text>
          </View>
        </View>

        {/* Manager Quick Navigation Bar */}
        {isManager ? (
          <Pressable
            onPress={() => router.push(`/raffle/${raffle.id}/manage` as any)}
            className="mt-4 pt-3 border-t border-gray-100 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="settings-outline" size={16} color="#B91C1C" />
              <Text className="text-xs font-bold text-[#B91C1C] ml-1.5">
                {t('raffleDetail.managerDashboard')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#B91C1C" />
          </Pressable>
        ) : null}
      </Card>

      {/* Countdown Timer */}
      <CountdownTimer
        targetDate={targetDateForTimer}
        label={timerLabel}
        className="mb-4"
      />

      {/* Participation Status Card */}
      <Card className="mb-4 bg-white border border-gray-100">
        <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          {t('raffleDetail.yourStatus')}
        </Text>

        {!myParticipant ? (
          <View className="py-2 items-center">
            <Ionicons name="information-circle-outline" size={24} color="#D97706" />
            <Text className="text-sm font-bold text-gray-800 mt-1 text-center">
              {t('raffleDetail.notInvitedTitle')}
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              {t('raffleDetail.notInvitedSubtitle', {
                email: user?.email || t('raffleDetail.unknownEmail'),
              })}
            </Text>
          </View>
        ) : myParticipant.status === 'invited' ? (
          <View className="py-2">
            <Text className="text-base font-bold text-gray-900 mb-1">
              {t('raffleDetail.invitedTitle')}
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              {t('raffleDetail.invitedSubtitle')}
            </Text>
            <View className="flex-row space-x-3">
              <Button
                title={t('raffleDetail.decline')}
                variant="outline"
                size="md"
                className="flex-1 mr-2"
                loading={actionLoading}
                onPress={handleDeclineInvite}
              />
              <Button
                title={t('raffleDetail.accept')}
                variant="secondary"
                size="md"
                className="flex-1 ml-2"
                loading={actionLoading}
                onPress={handleAcceptInvite}
              />
            </View>
          </View>
        ) : myParticipant.status === 'declined' ? (
          <View className="py-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="close-circle" size={24} color="#DC2626" />
              <Text className="text-sm font-semibold text-red-600 ml-2">
                {t('raffleDetail.declinedNotice')}
              </Text>
            </View>
            <Button
              title={t('raffleDetail.rejoin')}
              size="sm"
              variant="outline"
              loading={actionLoading}
              onPress={handleAcceptInvite}
            />
          </View>
        ) : (
          <View className="py-2">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={22} color="#15803D" />
                <Text className="text-base font-bold text-[#15803D] ml-2">
                  {t('raffleDetail.inNotice')}
                </Text>
              </View>
              {myParticipant.giftGiven ? (
                <View className="bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex-row items-center">
                  <Ionicons name="checkmark" size={12} color="#059669" />
                  <Text className="text-xs font-semibold text-emerald-700 ml-1">
                    {t('raffleDetail.giftSentBadge')}
                  </Text>
                </View>
              ) : null}
            </View>

            {isDrawn ? (
              <Button
                title={t('raffleDetail.viewAssignment')}
                variant="primary"
                size="md"
                leftIcon={<Ionicons name="gift-outline" size={16} color="#FFFFFF" />}
                onPress={() => router.push(`/raffle/${raffle.id}/assignment` as any)}
              />
            ) : (
              <Text className="text-xs text-gray-500 italic">
                {t('raffleDetail.waitingDrawNotice')}
              </Text>
            )}
          </View>
        )}
      </Card>

      {/* Group Revealed Section */}
      {raffle.revealed ? (
        <Card className="mb-4 bg-violet-50/60 border border-violet-200">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-lg bg-violet-100 items-center justify-center mr-2 border border-violet-200">
              <Ionicons name="sparkles" size={16} color="#7C3AED" />
            </View>
            <View>
              <Text className="text-base font-black text-violet-900">
                {t('raffleDetail.allRevealedTitle')}
              </Text>
              <Text className="text-xs text-violet-700">
                {t('raffleDetail.allRevealedSubtitle')}
              </Text>
            </View>
          </View>

          <View className="space-y-2 mt-2">
            {participants
              .filter((p) => p.assignedTo)
              .map((giver) => {
                const recipient = participants.find((p) => p.id === giver.assignedTo);
                return (
                  <View
                    key={giver.id}
                    className="flex-row items-center justify-between bg-white p-3 rounded-xl border border-violet-100 mb-1.5"
                  >
                    <View className="flex-row items-center">
                      <Avatar name={giver.name} size="sm" />
                      <Text className="text-sm font-bold text-gray-800 ml-2">
                        {giver.name}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color="#8B5CF6" />
                    <View className="flex-row items-center">
                      <Text className="text-sm font-bold text-[#B91C1C] mr-2">
                        {recipient?.name || t('raffleDetail.someone')}
                      </Text>
                      <Avatar name={recipient?.name || '?'} size="sm" />
                    </View>
                  </View>
                );
              })}
          </View>
        </Card>
      ) : null}

      {/* Participants List */}
      <View className="mt-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-gray-900">
            {t('raffleDetail.participantsTitle', { count: participants.length })}
          </Text>
          <Text className="text-xs text-gray-400">
            {t('raffleDetail.confirmedCount', {
              count: participants.filter((p) => p.status === 'accepted').length,
            })}
          </Text>
        </View>

        {participants.map((p) => (
          <View
            key={p.id}
            className="flex-row items-center justify-between bg-white p-3 rounded-xl mb-2 border border-gray-100 shadow-sm"
          >
            <View className="flex-row items-center">
              <Avatar name={p.name} size="sm" />
              <Text className="text-sm font-semibold text-gray-900 ml-3">
                {p.name} {p.userId === user?.uid ? t('raffleDetail.you') : ''}
              </Text>
            </View>
            <StatusBadge status={p.status} />
          </View>
        ))}
      </View>
      </PageContainer>
    </ScrollView>
  );
}
