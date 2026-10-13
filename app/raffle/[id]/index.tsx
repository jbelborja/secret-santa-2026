import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/hooks/useAuth';
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

export default function RaffleParticipantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { raffle, loading: raffleLoading, error: raffleError } = useRaffle(id);
  const { participants, loading: partsLoading, error: partsError } = useParticipants(id);

  const [actionLoading, setActionLoading] = useState(false);

  if (raffleLoading || partsLoading) {
    return <LoadingSpinner message="Loading raffle details..." />;
  }

  if (raffleError || !raffle) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-16 h-16 rounded-2xl bg-red-50 items-center justify-center mb-4 border border-red-100">
          <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
        </View>
        <Text className="text-lg font-bold text-gray-800 text-center">
          {raffleError || 'Raffle not found'}
        </Text>
        <Button
          title="Go to My Raffles"
          onPress={() => router.replace('/(tabs)')}
          variant="primary"
          className="mt-4"
        />
      </View>
    );
  }

  const isManager = user?.uid === raffle.managerId;
  const myParticipant = participants.find(
    (p) => p.userId === user?.uid || (user?.email && p.email.toLowerCase() === user.email.toLowerCase())
  );

  const isDrawn = raffle.status === 'drawn' || raffle.status === 'completed';
  const targetDateForTimer = isDrawn ? raffle.giftDate : raffle.raffleDate;
  const timerLabel = isDrawn ? 'Gift Exchange In' : 'Pairings Drawn In';

  const handleAcceptInvite = async () => {
    if (!user || !id) return;
    setActionLoading(true);
    try {
      if (myParticipant) {
        await updateDoc(participantDoc(id, myParticipant.id), {
          status: 'accepted',
          userId: user.uid,
          joinedAt: new Date(),
          expoPushToken: user.expoPushToken,
        });
      } else {
        await addDoc(participantsCollection(id), {
          id: '',
          raffleId: id,
          userId: user.uid,
          name: user.displayName || 'Participant',
          email: user.email || '',
          status: 'accepted',
          exclusions: [],
          giftGiven: false,
          expoPushToken: user.expoPushToken,
          joinedAt: new Date(),
        });
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
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
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      {/* Header Info Card */}
      <Card elevated className="p-5 mb-4 border border-gray-100 bg-white">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1.5">
              <StatusBadge status={raffle.status} />
              {isManager ? (
                <View className="ml-2">
                  <Badge label="Organiser" variant="warning" size="sm" />
                </View>
              ) : null}
            </View>
            <Text className="text-2xl font-black text-gray-900 mt-1">
              {raffle.name}
            </Text>
            {raffle.topic ? (
              <Text className="text-sm text-gray-600 mt-1">
                Theme: <Text className="font-semibold">{raffle.topic}</Text>
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
                Manager Dashboard & Draw Controls
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
          Your Status
        </Text>

        {!myParticipant || myParticipant.status === 'invited' ? (
          <View className="py-2">
            <Text className="text-base font-bold text-gray-900 mb-1">
              You are invited to join
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              Accept to be included in the Secret Santa draw.
            </Text>
            <View className="flex-row space-x-3">
              <Button
                title="Decline"
                variant="outline"
                size="md"
                className="flex-1 mr-2"
                loading={actionLoading}
                onPress={handleDeclineInvite}
              />
              <Button
                title="Accept Invitation"
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
                You declined this raffle.
              </Text>
            </View>
            <Button
              title="Rejoin"
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
                  You're in!
                </Text>
              </View>
              {myParticipant.giftGiven ? (
                <View className="bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex-row items-center">
                  <Ionicons name="checkmark" size={12} color="#059669" />
                  <Text className="text-xs font-semibold text-emerald-700 ml-1">
                    Gift Sent
                  </Text>
                </View>
              ) : null}
            </View>

            {isDrawn ? (
              <Button
                title="View My Secret Assignment"
                variant="primary"
                size="md"
                leftIcon={<Ionicons name="gift-outline" size={16} color="#FFFFFF" />}
                onPress={() => router.push(`/raffle/${raffle.id}/assignment` as any)}
              />
            ) : (
              <Text className="text-xs text-gray-500 italic">
                Pairings will be drawn once the organizer starts the raffle.
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
                All Assignments Revealed
              </Text>
              <Text className="text-xs text-violet-700">
                The exchange is complete. Here is who gave to whom:
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
                        {recipient?.name || 'Someone'}
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
            Participants ({participants.length})
          </Text>
          <Text className="text-xs text-gray-400">
            {participants.filter((p) => p.status === 'accepted').length} confirmed
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
                {p.name} {p.userId === user?.uid ? '(You)' : ''}
              </Text>
            </View>
            <StatusBadge status={p.status} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
