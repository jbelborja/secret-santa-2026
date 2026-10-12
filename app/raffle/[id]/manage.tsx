import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { writeBatch } from 'firebase/firestore';
import { format, parse, isValid } from 'date-fns';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useRaffle } from '@/hooks/useRaffle';
import { useParticipants } from '@/hooks/useParticipants';
import { raffleDoc, participantDoc } from '@/lib/firestore';
import { runDraw } from '@/lib/draw';
import { sendBatchPushNotifications } from '@/lib/notifications';
import { StatusBadge } from '@/components/raffle/StatusBadge';
import { InviteCodeDisplay } from '@/components/raffle/InviteCodeDisplay';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';

export default function ManageRaffleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { raffle, loading: raffleLoading, updateRaffle } = useRaffle(id);
  const { participants, loading: partsLoading, markGiftGiven } = useParticipants(id);

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editPriceLimit, setEditPriceLimit] = useState('');
  const [editGiftDate, setEditGiftDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  if (raffleLoading || partsLoading) {
    return <LoadingSpinner message="Loading management console..." />;
  }

  if (!raffle) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-lg font-bold text-gray-800">Raffle not found</Text>
      </View>
    );
  }

  // Guard: only manager can access
  if (user && raffle.managerId !== user.uid) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-4xl mb-3">⛔</Text>
        <Text className="text-lg font-bold text-gray-800 text-center">
          Only the organizer can access this page.
        </Text>
        <Button
          title="Back to Raffle"
          onPress={() => router.replace(`/raffle/${raffle.id}` as any)}
          variant="primary"
          className="mt-4"
        />
      </View>
    );
  }

  const invitedCount = participants.filter((p) => p.status === 'invited').length;
  const acceptedCount = participants.filter((p) => p.status === 'accepted').length;
  const declinedCount = participants.filter((p) => p.status === 'declined').length;
  const acceptedParticipants = participants.filter((p) => p.status === 'accepted');

  const startEdit = () => {
    setEditName(raffle.name);
    setEditTopic(raffle.topic);
    setEditPriceLimit(String(raffle.priceLimit));
    setEditGiftDate(format(raffle.giftDate, 'yyyy-MM-dd'));
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    const price = parseFloat(editPriceLimit);
    const parsedGiftDate = parse(editGiftDate, 'yyyy-MM-dd', new Date());

    if (!editName.trim() || isNaN(price) || !isValid(parsedGiftDate)) {
      Alert.alert('Error', 'Please verify your inputs');
      return;
    }

    setSavingEdit(true);
    try {
      await updateRaffle({
        name: editName.trim(),
        topic: editTopic.trim(),
        priceLimit: price,
        giftDate: parsedGiftDate,
      });
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update raffle');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenForInvitations = async () => {
    try {
      await updateRaffle({ status: 'inviting' });
      setInviteModalVisible(true);
    } catch (err) {
      Alert.alert('Error', 'Could not open raffle for invitations');
    }
  };

  const handleExecuteDraw = async () => {
    if (acceptedCount < 2) {
      Alert.alert('Not enough participants', 'At least 2 accepted participants are needed to draw.');
      return;
    }

    Alert.alert(
      'Ready to draw? 🎲',
      `${acceptedCount} accepted participants will be secretly matched. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Draw Names! 🎁',
          style: 'default',
          onPress: async () => {
            setDrawing(true);
            setDrawError(null);

            const result = runDraw(participants);

            if (!result.success || !result.assignments) {
              setDrawError(result.error || 'Failed to draw pairings. Please adjust exclusions.');
              setDrawing(false);
              return;
            }

            try {
              const batch = writeBatch(db);

              // 1. Assign each giver their recipient
              for (const [giverId, recipientId] of Object.entries(result.assignments)) {
                const pDoc = participantDoc(raffle.id, giverId);
                batch.update(pDoc, { assignedTo: recipientId });
              }

              // 2. Update raffle status to 'drawn'
              const rDoc = raffleDoc(raffle.id);
              batch.update(rDoc, { status: 'drawn' });

              await batch.commit();

              // 3. Send batch push notifications
              const tokens = acceptedParticipants
                .map((p) => p.expoPushToken)
                .filter((t): t is string => Boolean(t));

              if (tokens.length > 0) {
                sendBatchPushNotifications(tokens, {
                  title: `Secret Santa: Names Drawn! 🎁`,
                  body: `Your secret match for "${raffle.name}" has been chosen! Tap to reveal.`,
                  data: { raffleId: raffle.id },
                });
              }

              Alert.alert('Success! 🎉', 'Pairings have been generated! Everyone can now view their secret match.');
            } catch (err: unknown) {
              console.error('Error committing draw results:', err);
              setDrawError(err instanceof Error ? err.message : 'Error committing draw');
            } finally {
              setDrawing(false);
            }
          },
        },
      ]
    );
  };

  const handleRevealAssignments = async () => {
    Alert.alert(
      'Reveal All Assignments? 🎊',
      'This will make all giver -> recipient pairings visible to all participants.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reveal to Everyone',
          onPress: async () => {
            try {
              await updateRaffle({ revealed: true, status: 'completed' });
              Alert.alert('Assignments Revealed! 🎁', 'Everyone can now see all matches.');
            } catch (err) {
              Alert.alert('Error', 'Failed to reveal assignments');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      {/* Raffle Summary Card with Inline Editing */}
      <Card className="mb-4 bg-white border border-gray-100">
        <View className="flex-row items-center justify-between mb-2">
          <StatusBadge status={raffle.status} />
          {!editing ? (
            <Pressable
              onPress={startEdit}
              className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-lg active:bg-gray-200"
            >
              <Ionicons name="create-outline" size={14} color="#374151" />
              <Text className="text-xs font-semibold text-gray-700 ml-1">Edit</Text>
            </Pressable>
          ) : null}
        </View>

        {!editing ? (
          <View>
            <Text className="text-2xl font-black text-gray-900 mt-1">{raffle.name}</Text>
            <Text className="text-sm text-gray-600 mt-1">Theme: {raffle.topic || 'General'}</Text>
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <Text className="text-xs font-semibold text-gray-700">
                Budget: {raffle.priceLimit} {raffle.currency}
              </Text>
              <Text className="text-xs font-semibold text-gray-700">
                Gift Date: {format(raffle.giftDate, 'MMM d, yyyy')}
              </Text>
            </View>
          </View>
        ) : (
          <View className="mt-2 space-y-1">
            <Input label="Raffle Name" value={editName} onChangeText={setEditName} />
            <Input label="Theme / Topic" value={editTopic} onChangeText={setEditTopic} />
            <Input
              label="Budget Limit"
              value={editPriceLimit}
              onChangeText={setEditPriceLimit}
              keyboardType="numeric"
            />
            <Input
              label="Gift Date (YYYY-MM-DD)"
              value={editGiftDate}
              onChangeText={setEditGiftDate}
            />
            <View className="flex-row space-x-2 mt-2">
              <Button
                title="Cancel"
                variant="ghost"
                size="sm"
                className="flex-1"
                onPress={() => setEditing(false)}
              />
              <Button
                title="Save Changes"
                variant="primary"
                size="sm"
                className="flex-1 ml-2"
                loading={savingEdit}
                onPress={handleSaveEdit}
              />
            </View>
          </View>
        )}
      </Card>

      {/* Participants Summary Metric */}
      <Card className="mb-4 bg-white border border-gray-100">
        <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Participants Overview
        </Text>

        <View className="flex-row items-center justify-between mb-4">
          <View className="items-center flex-1">
            <Text className="text-2xl font-extrabold text-blue-600">{invitedCount}</Text>
            <Text className="text-xs text-gray-500 font-medium mt-0.5">Invited</Text>
          </View>
          <View className="w-px h-8 bg-gray-200" />
          <View className="items-center flex-1">
            <Text className="text-2xl font-extrabold text-[#15803D]">{acceptedCount}</Text>
            <Text className="text-xs text-gray-500 font-medium mt-0.5">Accepted</Text>
          </View>
          <View className="w-px h-8 bg-gray-200" />
          <View className="items-center flex-1">
            <Text className="text-2xl font-extrabold text-red-600">{declinedCount}</Text>
            <Text className="text-xs text-gray-500 font-medium mt-0.5">Declined</Text>
          </View>
        </View>

        {/* Quick action navigation buttons */}
        <View className="flex-row space-x-2 pt-2 border-t border-gray-100">
          <Button
            title="Manage Participants"
            variant="outline"
            size="md"
            className="flex-1 mr-2"
            onPress={() => router.push(`/raffle/${raffle.id}/participants` as any)}
            leftIcon={<Ionicons name="people-outline" size={16} color="#B91C1C" />}
          />
          <Button
            title="Invite Code"
            variant="outline"
            size="md"
            className="flex-1 ml-2"
            onPress={() => setInviteModalVisible(true)}
            leftIcon={<Ionicons name="share-social-outline" size={16} color="#B91C1C" />}
          />
        </View>
      </Card>

      {/* Draw Error Notice */}
      {drawError ? (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4">
          <View className="flex-row items-center mb-1">
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text className="text-xs font-bold text-red-700 ml-1.5">Draw Issue</Text>
          </View>
          <Text className="text-xs text-red-600 leading-4">{drawError}</Text>
        </View>
      ) : null}

      {/* Status Action Card */}
      <Card elevated className="mb-4 border-2 border-red-100 bg-white">
        <Text className="text-xs font-bold uppercase tracking-wider text-[#B91C1C] mb-2">
          Raffle Progression
        </Text>

        {raffle.status === 'draft' ? (
          <View>
            <Text className="text-base font-bold text-gray-900 mb-1">
              Raffle is currently a Draft
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              Open the raffle for invitations so participants can join and confirm.
            </Text>
            <Button
              title="Open for Invitations 🎄"
              variant="primary"
              size="lg"
              onPress={handleOpenForInvitations}
            />
          </View>
        ) : raffle.status === 'inviting' ? (
          <View>
            <Text className="text-base font-bold text-gray-900 mb-1">
              Invitations Open ({acceptedCount} Ready)
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              When all expected participants have accepted (at least 2 required), run the Secret Santa draw!
            </Text>
            <Button
              title="Run Draw Now 🎲"
              variant="secondary"
              size="lg"
              disabled={acceptedCount < 2}
              loading={drawing}
              onPress={handleExecuteDraw}
            />
            {acceptedCount < 2 ? (
              <Text className="text-[11px] text-amber-600 mt-2 text-center">
                Need at least 2 accepted participants to draw
              </Text>
            ) : null}
          </View>
        ) : raffle.status === 'drawn' ? (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-base font-bold text-purple-900">
                  Draw Complete! 🎲
                </Text>
                <Text className="text-xs text-gray-500">
                  Track who has delivered their gifts below.
                </Text>
              </View>
            </View>

            {/* Gift Delivery Checklist */}
            <View className="my-2 space-y-1">
              {acceptedParticipants.map((p) => (
                <View
                  key={p.id}
                  className="flex-row items-center justify-between p-2.5 bg-gray-50 rounded-xl mb-1.5 border border-gray-100"
                >
                  <View className="flex-row items-center">
                    <Avatar name={p.name} size="sm" />
                    <Text className="text-xs font-semibold text-gray-800 ml-2">
                      {p.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-[11px] text-gray-500 mr-2">
                      {p.giftGiven ? 'Delivered' : 'Pending'}
                    </Text>
                    <Switch
                      value={p.giftGiven}
                      onValueChange={(val) => markGiftGiven(p.id, val)}
                      trackColor={{ false: '#D1D5DB', true: '#15803D' }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Reveal Button */}
            <Button
              title="Reveal All Assignments to Everyone 🎊"
              variant="outline"
              size="md"
              className="mt-3 border-purple-600"
              onPress={handleRevealAssignments}
            />
          </View>
        ) : (
          <View className="items-center py-3">
            <Text className="text-3xl mb-1">🎉</Text>
            <Text className="text-base font-bold text-gray-900">
              Raffle Completed
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              All assignments have been revealed and the holiday event is concluded!
            </Text>
          </View>
        )}
      </Card>

      {/* Invite Code Modal */}
      <InviteCodeDisplay
        inviteCode={raffle.inviteCode}
        raffleName={raffle.name}
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
      />
    </ScrollView>
  );
}
