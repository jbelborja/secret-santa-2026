import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import {
  getRaffleByInviteCode,
  participantsCollection,
  participantDoc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  getDoc,
  userDoc,
} from '@/lib/firestore';
import { Raffle, Participant } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/raffle/StatusBadge';

export default function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [managerName, setManagerName] = useState<string>('The Organizer');
  const [existingParticipant, setExistingParticipant] = useState<Participant | null>(null);
  const [joinName, setJoinName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvite() {
      if (!code) {
        setError('No invite code provided.');
        setLoading(false);
        return;
      }

      try {
        const foundRaffle = await getRaffleByInviteCode(code);
        if (!foundRaffle) {
          setError('Invalid or expired invite link. Please check the code.');
          setLoading(false);
          return;
        }

        setRaffle(foundRaffle);

        // Fetch manager profile name
        try {
          const mSnap = await getDoc(userDoc(foundRaffle.managerId));
          if (mSnap.exists()) {
            setManagerName(mSnap.data().displayName || 'The Organizer');
          }
        } catch {}

        // Check if current user is already in participants
        if (user) {
          setJoinName(user.displayName || user.email?.split('@')[0] || '');

          const pColl = participantsCollection(foundRaffle.id);
          const pSnap = await getDocs(pColl);

          let foundPart: Participant | null = null;
          pSnap.forEach((docSnap) => {
            const p = docSnap.data();
            if (
              p.userId === user.uid ||
              (user.email && p.email.toLowerCase() === user.email.toLowerCase())
            ) {
              foundPart = p;
            }
          });

          setExistingParticipant(foundPart);
        }
      } catch (err: unknown) {
        console.error('Error fetching invite:', err);
        setError('Could not verify invite link.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadInvite();
    }
  }, [code, user, authLoading]);

  const handleAccept = async () => {
    if (!raffle || !user) return;
    setSubmitting(true);

    try {
      if (existingParticipant) {
        // Update existing record
        const pRef = participantDoc(raffle.id, existingParticipant.id);
        await updateDoc(pRef, {
          status: 'accepted',
          userId: user.uid,
          name: joinName.trim() || existingParticipant.name,
          joinedAt: new Date(),
          expoPushToken: user.expoPushToken,
        });
      } else {
        // Create new participant record
        const pColl = participantsCollection(raffle.id);
        await addDoc(pColl, {
          id: '',
          raffleId: raffle.id,
          userId: user.uid,
          name: joinName.trim() || user.displayName || 'Santa Fan',
          email: user.email || '',
          status: 'accepted',
          exclusions: [],
          giftGiven: false,
          expoPushToken: user.expoPushToken,
          joinedAt: new Date(),
        });
      }

      router.replace(`/raffle/${raffle.id}` as any);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!raffle || !user) return;

    if (existingParticipant) {
      try {
        const pRef = participantDoc(raffle.id, existingParticipant.id);
        await updateDoc(pRef, {
          status: 'declined',
        });
      } catch {}
    }
    router.replace('/(tabs)');
  };

  if (loading || authLoading) {
    return <LoadingSpinner message="Checking invitation code..." />;
  }

  if (error || !raffle) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-4 border border-red-100">
          <Text className="text-4xl">❌</Text>
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center mb-2">
          {error || 'Invalid invite link'}
        </Text>
        <Text className="text-xs text-gray-500 text-center max-w-xs mb-6">
          This invite code may be incorrect or the raffle may have ended.
        </Text>
        <Button
          title="Go to Home"
          variant="primary"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    );
  }

  // If user is not logged in, prompt sign in first
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-20 h-20 rounded-2xl bg-red-50 items-center justify-center mb-4 border border-red-100">
          <Ionicons name="gift-outline" size={36} color="#B91C1C" />
        </View>
        <Text className="text-2xl font-black text-gray-900 text-center mb-1">
          Secret Santa Invitation
        </Text>
        <Text className="text-sm text-gray-600 text-center mb-6">
          You've been invited to join <Text className="font-bold">{raffle.name}</Text>. Please sign in or create an account to join the raffle!
        </Text>
        <Button
          title="Sign In to Join"
          variant="primary"
          size="lg"
          onPress={() => router.replace('/(auth)/login')}
          className="w-full"
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      <View className="items-center mb-6">
        <View className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 items-center justify-center mb-3">
          <Ionicons name="mail-open-outline" size={30} color="#B91C1C" />
        </View>
        <Text className="text-xs font-bold uppercase tracking-wider text-[#B91C1C]">
          You're Invited
        </Text>
        <Text className="text-2xl font-black text-gray-900 text-center mt-1">
          {raffle.name}
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          Organized by <Text className="font-semibold text-gray-700">{managerName}</Text>
        </Text>
      </View>

      {/* Raffle Details Card */}
      <Card className="mb-6 bg-white border border-gray-100">
        <View className="space-y-3">
          <View className="flex-row items-center justify-between pb-2.5 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="pricetag-outline" size={16} color="#D97706" />
              <Text className="text-xs text-gray-600 ml-2">Budget Limit</Text>
            </View>
            <Text className="text-xs font-bold text-gray-900">
              {raffle.priceLimit} {raffle.currency}
            </Text>
          </View>

          <View className="flex-row items-center justify-between pb-2.5 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="gift-outline" size={16} color="#15803D" />
              <Text className="text-xs text-gray-600 ml-2">Exchange Day</Text>
            </View>
            <Text className="text-xs font-bold text-gray-900">
              {format(raffle.giftDate, 'MMMM d, yyyy')}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="sparkles-outline" size={16} color="#B91C1C" />
              <Text className="text-xs text-gray-600 ml-2">Theme</Text>
            </View>
            <Text className="text-xs font-bold text-gray-900">
              {raffle.topic || 'General gifts'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Existing status indicator */}
      {existingParticipant ? (
        <Card className="mb-6 bg-emerald-50/70 border border-emerald-200">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold text-[#15803D]">
                Your Current Status
              </Text>
              <Text className="text-xs text-gray-600 mt-0.5">
                Already registered in this raffle
              </Text>
            </View>
            <StatusBadge status={existingParticipant.status} />
          </View>
        </Card>
      ) : null}

      {/* Join As Name Input */}
      <View className="mb-6">
        <Input
          label="Join As"
          placeholder="Your name for Secret Santa"
          value={joinName}
          onChangeText={setJoinName}
        />
        <Text className="text-[11px] text-gray-400 ml-1">
          This is the name your Secret Santa and other participants will see.
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3">
        <Button
          title={
            existingParticipant?.status === 'accepted'
              ? 'Go to Raffle'
              : 'Accept Invitation'
          }
          variant="secondary"
          size="lg"
          loading={submitting}
          onPress={handleAccept}
          className="mb-3"
        />

        {existingParticipant?.status !== 'accepted' ? (
          <Button
            title="Decline"
            variant="ghost"
            size="md"
            onPress={handleDecline}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
