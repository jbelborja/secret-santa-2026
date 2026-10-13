import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { differenceInDays } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useRaffle } from '@/hooks/useRaffle';
import { useParticipants } from '@/hooks/useParticipants';
import { participantDoc, updateDoc } from '@/lib/firestore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Avatar } from '@/components/ui/Avatar';

export default function AssignmentRevealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { raffle, loading: raffleLoading } = useRaffle(id);
  const { participants, loading: partsLoading, markGiftGiven } = useParticipants(id);

  const [marking, setMarking] = useState(false);

  // Confetti / reveal animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  if (raffleLoading || partsLoading) {
    return <LoadingSpinner message="Opening your secret envelope... ✉️" />;
  }

  if (!raffle) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-lg font-bold text-gray-800">Raffle not found</Text>
      </View>
    );
  }

  // Guard: post-draw only
  if (raffle.status !== 'drawn' && raffle.status !== 'completed') {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-16 h-16 rounded-2xl bg-amber-50 items-center justify-center mb-4 border border-amber-100">
          <Ionicons name="time-outline" size={32} color="#D97706" />
        </View>
        <Text className="text-lg font-bold text-gray-800 text-center">
          The Secret Santa draw has not taken place yet!
        </Text>
        <Text className="text-xs text-gray-500 text-center mt-1 mb-4">
          Wait for your organizer to draw names.
        </Text>
        <Button
          title="Back to Raffle"
          onPress={() => router.back()}
          variant="primary"
        />
      </View>
    );
  }

  // Current user's participant doc
  const myParticipant = participants.find(
    (p) => p.userId === user?.uid || (user?.email && p.email.toLowerCase() === user.email.toLowerCase())
  );

  const recipientParticipant = myParticipant?.assignedTo
    ? participants.find((p) => p.id === myParticipant.assignedTo)
    : null;

  const now = new Date();
  const giftDate = raffle.giftDate instanceof Date ? raffle.giftDate : new Date(raffle.giftDate);
  const daysLeft = Math.max(0, differenceInDays(giftDate, now));

  const handleToggleGiftGiven = async () => {
    if (!myParticipant) return;
    setMarking(true);
    try {
      await markGiftGiven(myParticipant.id, !myParticipant.giftGiven);
      Alert.alert(
        !myParticipant.giftGiven ? 'Marked as Delivered' : 'Status Updated',
        !myParticipant.giftGiven
          ? 'Great job completing your gift delivery!'
          : 'Gift status marked as pending.'
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to update gift status');
    } finally {
      setMarking(false);
    }
  };

  const confettiTranslate = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <ScrollView
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      {/* Decorative Header */}
      <Animated.View
        style={{
          transform: [{ translateY: confettiTranslate }],
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <View className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 items-center justify-center">
          <Ionicons name="gift-outline" size={28} color="#B91C1C" />
        </View>
      </Animated.View>

      {/* Secret Card */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Card
          elevated
          className="border-2 border-red-200 bg-white p-6 rounded-3xl shadow-lg mb-6 items-center"
        >
          <View className="bg-red-50 px-3 py-1 rounded-full mb-3">
            <Text className="text-xs font-bold text-[#B91C1C] uppercase tracking-wider">
              Secret Assignment
            </Text>
          </View>

          <Text className="text-sm text-gray-500 font-medium">You are gifting to:</Text>

          {recipientParticipant ? (
            <View className="items-center my-4">
              <Avatar
                name={recipientParticipant.name}
                size="lg"
                className="w-20 h-20 rounded-full border-4 border-red-100 mb-3"
              />
              <Text className="text-3xl font-black text-gray-900 text-center tracking-tight">
                {recipientParticipant.name}
              </Text>
            </View>
          ) : (
            <View className="my-4 items-center">
              <Text className="text-2xl font-bold text-gray-400">
                Unassigned
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                Contact your raffle organizer
              </Text>
            </View>
          )}

          {/* Details Pill Box */}
          <View className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 my-2 space-y-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-gray-500 font-medium">Theme:</Text>
              <Text className="text-xs font-bold text-gray-800">
                {raffle.topic || 'General gifts'}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-gray-500 font-medium">Budget Limit:</Text>
              <Text className="text-xs font-bold text-[#D97706]">
                {raffle.priceLimit} {raffle.currency}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-gray-500 font-medium">Exchange Countdown:</Text>
              <Text className="text-xs font-bold text-[#15803D]">
                {daysLeft === 0 ? 'Gift day is today!' : `Gift day in ${daysLeft} days`}
              </Text>
            </View>
          </View>

          {/* Mark as Given Button */}
          {myParticipant ? (
            <Button
              title={
                myParticipant.giftGiven
                  ? 'Mark as Not Given'
                  : 'Mark Gift as Given'
              }
              variant={myParticipant.giftGiven ? 'outline' : 'secondary'}
              size="lg"
              loading={marking}
              onPress={handleToggleGiftGiven}
              className="w-full mt-4"
            />
          ) : null}
        </Card>
      </Animated.View>

      {/* Group Reveal Section (If Manager has set revealed=true) */}
      {raffle.revealed ? (
        <Card className="p-5 bg-violet-50/70 border border-violet-200 rounded-2xl">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-lg bg-violet-100 items-center justify-center mr-2 border border-violet-200">
              <Ionicons name="sparkles" size={16} color="#7C3AED" />
            </View>
            <View>
              <Text className="text-base font-bold text-violet-900">
                Everyone's Matches Revealed
              </Text>
              <Text className="text-xs text-violet-700">
                The exchange has completed!
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
                    className="flex-row items-center justify-between bg-white p-3 rounded-xl border border-purple-100 mb-1.5"
                  >
                    <View className="flex-row items-center">
                      <Avatar name={giver.name} size="sm" />
                      <Text className="text-xs font-bold text-gray-800 ml-2">
                        {giver.name}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color="#8B5CF6" />
                    <View className="flex-row items-center">
                      <Text className="text-xs font-bold text-[#B91C1C] mr-2">
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
    </ScrollView>
  );
}
