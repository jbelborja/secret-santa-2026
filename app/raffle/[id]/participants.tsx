import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/hooks/useAuth';
import { useRaffle } from '@/hooks/useRaffle';
import { useParticipants } from '@/hooks/useParticipants';
import { ParticipantRow } from '@/components/raffle/ParticipantRow';
import { ExclusionPicker } from '@/components/raffle/ExclusionPicker';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';

export default function ParticipantsManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { raffle, loading: raffleLoading } = useRaffle(id);
  const {
    participants,
    loading: partsLoading,
    addParticipant,
    removeParticipant,
    toggleExclusion,
  } = useParticipants(id);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);

  if (raffleLoading || partsLoading) {
    return <LoadingSpinner message="Loading participants..." />;
  }

  if (!raffle) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-lg font-bold text-gray-800">Raffle not found</Text>
      </View>
    );
  }

  // Guard: manager only
  if (user && raffle.managerId !== user.uid) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-16 h-16 rounded-2xl bg-red-50 items-center justify-center mb-4 border border-red-100">
          <Ionicons name="ban-outline" size={32} color="#DC2626" />
        </View>
        <Text className="text-lg font-bold text-gray-800">Manager access only</Text>
      </View>
    );
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      Alert.alert('Missing info', 'Please provide both a name and an email address.');
      return;
    }

    setAdding(true);
    try {
      await addParticipant(newName.trim(), newEmail.trim());
      setNewName('');
      setNewEmail('');
    } catch (err: unknown) {
      console.error('Error adding participant:', err);
      Alert.alert('Error', 'Failed to add participant');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (participantId: string, name: string) => {
    Alert.alert(
      'Remove Participant',
      `Are you sure you want to remove ${name} from this Secret Santa?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeParticipant(participantId);
            } catch (err) {
              Alert.alert('Error', 'Failed to remove participant');
            }
          },
        },
      ]
    );
  };

  const toggleExpand = (participantId: string) => {
    setExpandedParticipantId((prev) => (prev === participantId ? null : participantId));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#FAFAFA]"
    >
      <FlatList
        data={participants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        ListHeaderComponent={
          <View className="mb-4">
            {/* Add Participant Card */}
            <Card className="mb-4 bg-white border border-gray-100">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center mr-2">
                  <Ionicons name="person-add" size={16} color="#B91C1C" />
                </View>
                <Text className="text-base font-bold text-gray-900">
                  Add Participant
                </Text>
              </View>

              <View className="space-y-1">
                <Input
                  placeholder="Participant name (e.g. John Doe)"
                  value={newName}
                  onChangeText={setNewName}
                />
                <Input
                  placeholder="Email (for record keeping only, no emails sent)"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Button
                title="Add to Raffle"
                onPress={handleAdd}
                variant="primary"
                size="md"
                loading={adding}
                className="mt-1"
              />
            </Card>

            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Current Participants ({participants.length})
              </Text>
              <Text className="text-xs text-gray-400">
                Tap row to configure exclusions
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedParticipantId === item.id;

          return (
            <View className="mb-2">
              <Pressable onPress={() => toggleExpand(item.id)}>
                <ParticipantRow
                  participant={item}
                  allParticipants={participants}
                  isManager
                  onRemove={() => handleRemove(item.id, item.name)}
                />
              </Pressable>

              {/* Exclusion Picker expanded under row */}
              {isExpanded ? (
                <View className="mb-2 ml-2 pl-3 border-l-2 border-red-300">
                  <ExclusionPicker
                    participant={item}
                    allParticipants={participants}
                    onToggle={(targetId) => toggleExclusion(item.id, targetId)}
                  />
                </View>
              ) : null}
            </View>
          );
        }}
        ListFooterComponent={
          <View className="mt-6 p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 items-center">
            <Ionicons name="information-circle-outline" size={20} color="#D97706" />
            <Text className="text-xs text-amber-800 text-center mt-1 leading-5">
              After adding participants, go back and share the invite code or link so they can accept their invitation.
            </Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}
