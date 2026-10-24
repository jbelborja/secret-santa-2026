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
import { useTranslation } from '@/lib/i18n';
import { useRaffle } from '@/hooks/useRaffle';
import { useParticipants } from '@/hooks/useParticipants';
import { ParticipantRow } from '@/components/raffle/ParticipantRow';
import { ExclusionPicker } from '@/components/raffle/ExclusionPicker';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { sendInviteEmail } from '@/lib/email';

export default function ParticipantsManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
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
    return <LoadingSpinner message={t('participantsScreen.loading')} />;
  }

  if (!raffle) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-lg font-bold text-gray-800">{t('participantsScreen.notFound')}</Text>
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
        <Text className="text-lg font-bold text-gray-800">{t('participantsScreen.managerAccessOnly')}</Text>
      </View>
    );
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      Alert.alert(t('participantsScreen.missingInfoTitle'), t('participantsScreen.missingInfoDesc'));
      return;
    }

    setAdding(true);
    try {
      await addParticipant(newName.trim(), newEmail.trim());
      setNewName('');
      setNewEmail('');

      // Send invite email (fire-and-forget — don't block UI on email failure)
      if (raffle) {
        sendInviteEmail({
          participantEmail: newEmail.trim(),
          participantName: newName.trim(),
          organizerName: user?.displayName || user?.email || t('invite.theOrganizer'),
          raffleName: raffle.name,
          inviteCode: raffle.inviteCode,
          topic: raffle.topic,
          priceLimit: raffle.priceLimit,
          currency: raffle.currency,
          giftDate: raffle.giftDate ? raffle.giftDate.toISOString() : null,
        }).catch((err) => console.warn('Invite email failed (non-fatal):', err));
      }
    } catch (err: unknown) {
      console.error('Error adding participant:', err);
      const rawMsg =
        (err as any)?.message ||
        (err instanceof Error ? err.message : '') ||
        (typeof err === 'string' ? err : '');
      const errMsg = rawMsg || t('common.error');
      if (Platform.OS === 'web') {
        window.alert(`${t('common.error')}: ${errMsg}`);
      } else {
        Alert.alert(t('common.error'), errMsg);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (participantId: string, name: string) => {
    const doRemove = async () => {
      try {
        await removeParticipant(participantId);
      } catch (err: unknown) {
        const rawMsg =
          (err as any)?.message ||
          (err instanceof Error ? err.message : '') ||
          (typeof err === 'string' ? err : '');
        const errMsg = rawMsg || t('common.error');
        if (Platform.OS === 'web') {
          window.alert(`${t('common.error')}: ${errMsg}`);
        } else {
          Alert.alert(t('common.error'), errMsg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('participantsScreen.removeDesc', { name }))) {
        doRemove();
      }
      return;
    }

    Alert.alert(
      t('participantsScreen.removeTitle'),
      t('participantsScreen.removeDesc', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: doRemove,
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
                  {t('participantsScreen.addTitle')}
                </Text>
              </View>

              <View className="space-y-1">
                <Input
                  placeholder={t('participantsScreen.namePlaceholder')}
                  value={newName}
                  onChangeText={setNewName}
                />
                <Input
                  placeholder={t('participantsScreen.emailPlaceholder')}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Button
                title={t('participantsScreen.addButton')}
                onPress={handleAdd}
                variant="primary"
                size="md"
                loading={adding}
                className="mt-1"
              />
            </Card>

            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold uppercase tracking-wider text-gray-500">
                {t('participantsScreen.currentTitle', { count: participants.length })}
              </Text>
              <Text className="text-xs text-gray-400">
                {t('participantsScreen.tapToExcludeHint')}
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
              {t('participantsScreen.footerHint')}
            </Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}
