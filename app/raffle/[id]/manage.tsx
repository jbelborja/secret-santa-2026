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
import { useTranslation } from '@/lib/i18n';
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
  const { t, formatDate } = useTranslation();
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
    return <LoadingSpinner message={t('manageRaffle.loading')} />;
  }

  if (!raffle) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-lg font-bold text-gray-800">{t('manageRaffle.notFound')}</Text>
      </View>
    );
  }

  // Guard: only manager can access
  if (user && raffle.managerId !== user.uid) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-16 h-16 rounded-2xl bg-red-50 items-center justify-center mb-4 border border-red-100">
          <Ionicons name="ban-outline" size={32} color="#DC2626" />
        </View>
        <Text className="text-lg font-bold text-gray-800 text-center">
          {t('manageRaffle.onlyOrganizer')}
        </Text>
        <Button
          title={t('manageRaffle.backToRaffle')}
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
      Alert.alert(t('common.error'), t('manageRaffle.inputValidation'));
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
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenForInvitations = async () => {
    try {
      await updateRaffle({ status: 'inviting' });
      setInviteModalVisible(true);
    } catch (err) {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const handleExecuteDraw = async () => {
    if (acceptedCount < 2) {
      Alert.alert(t('manageRaffle.drawIssue'), t('manageRaffle.needTwoParticipants'));
      return;
    }

    Alert.alert(
      t('manageRaffle.confirmDrawTitle'),
      t('manageRaffle.confirmDrawDesc', { count: acceptedCount }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('manageRaffle.drawNamesBtn'),
          style: 'default',
          onPress: async () => {
            setDrawing(true);
            setDrawError(null);

            const result = runDraw(participants);

            if (!result.success || !result.assignments) {
              setDrawError(result.error || t('manageRaffle.drawIssue'));
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
                  title: t('manageRaffle.notificationTitle'),
                  body: t('manageRaffle.notificationBody', { name: raffle.name }),
                  data: { raffleId: raffle.id },
                });
              }

              Alert.alert(t('manageRaffle.drawSuccessTitle'), t('manageRaffle.drawSuccessDesc'));
            } catch (err: unknown) {
              console.error('Error committing draw results:', err);
              setDrawError(err instanceof Error ? err.message : t('common.error'));
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
      t('manageRaffle.revealConfirmTitle'),
      t('manageRaffle.revealConfirmDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('manageRaffle.revealConfirmBtn'),
          onPress: async () => {
            try {
              await updateRaffle({ revealed: true, status: 'completed' });
              Alert.alert(t('manageRaffle.revealedAlertTitle'), t('manageRaffle.revealedAlertDesc'));
            } catch (err) {
              Alert.alert(t('common.error'), t('common.error'));
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
              <Text className="text-xs font-semibold text-gray-700 ml-1">{t('manageRaffle.edit')}</Text>
            </Pressable>
          ) : null}
        </View>

        {!editing ? (
          <View>
            <Text className="text-2xl font-black text-gray-900 mt-1">{raffle.name}</Text>
            <Text className="text-sm text-gray-600 mt-1">
              {t('raffleDetail.themePrefix')}{raffle.topic || t('manageRaffle.generalTopic')}
            </Text>
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <Text className="text-xs font-semibold text-gray-700">
                {t('manageRaffle.budgetPrefix')}{raffle.priceLimit} {raffle.currency}
              </Text>
              <Text className="text-xs font-semibold text-gray-700">
                {t('manageRaffle.giftDatePrefix')}{formatDate(raffle.giftDate, 'MMM d, yyyy')}
              </Text>
            </View>
          </View>
        ) : (
          <View className="mt-2 space-y-1">
            <Input label={t('createRaffle.nameLabel')} value={editName} onChangeText={setEditName} />
            <Input label={t('createRaffle.themeLabel')} value={editTopic} onChangeText={setEditTopic} />
            <Input
              label={t('createRaffle.budgetLabel')}
              value={editPriceLimit}
              onChangeText={setEditPriceLimit}
              keyboardType="numeric"
            />
            <Input
              label={t('createRaffle.giftDateLabel')}
              value={editGiftDate}
              onChangeText={setEditGiftDate}
            />
            <View className="flex-row space-x-2 mt-2">
              <Button
                title={t('common.cancel')}
                variant="ghost"
                size="sm"
                className="flex-1"
                onPress={() => setEditing(false)}
              />
              <Button
                title={t('manageRaffle.saveChanges')}
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
          {t('manageRaffle.overviewTitle')}
        </Text>

        <View className="flex-row items-center justify-between mb-4">
          <View className="items-center flex-1">
            <Text className="text-2xl font-extrabold text-blue-600">{invitedCount}</Text>
            <Text className="text-xs text-gray-500 font-medium mt-0.5">{t('manageRaffle.invited')}</Text>
          </View>
          <View className="w-px h-8 bg-gray-200" />
          <View className="items-center flex-1">
            <Text className="text-2xl font-extrabold text-[#15803D]">{acceptedCount}</Text>
            <Text className="text-xs text-gray-500 font-medium mt-0.5">{t('manageRaffle.accepted')}</Text>
          </View>
          <View className="w-px h-8 bg-gray-200" />
          <View className="items-center flex-1">
            <Text className="text-2xl font-extrabold text-red-600">{declinedCount}</Text>
            <Text className="text-xs text-gray-500 font-medium mt-0.5">{t('manageRaffle.declined')}</Text>
          </View>
        </View>

        {/* Quick action navigation buttons */}
        <View className="flex-row space-x-2 pt-2 border-t border-gray-100">
          <Button
            title={t('manageRaffle.manageParticipantsBtn')}
            variant="outline"
            size="md"
            className="flex-1 mr-2"
            onPress={() => router.push(`/raffle/${raffle.id}/participants` as any)}
            leftIcon={<Ionicons name="people-outline" size={16} color="#B91C1C" />}
          />
          <Button
            title={t('manageRaffle.inviteCodeBtn')}
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
            <Text className="text-xs font-bold text-red-700 ml-1.5">{t('manageRaffle.drawIssue')}</Text>
          </View>
          <Text className="text-xs text-red-600 leading-4">{drawError}</Text>
        </View>
      ) : null}

      {/* Status Action Card */}
      <Card elevated className="mb-4 border-2 border-red-100 bg-white">
        <Text className="text-xs font-bold uppercase tracking-wider text-[#B91C1C] mb-2">
          {t('manageRaffle.progressionTitle')}
        </Text>

        {raffle.status === 'draft' ? (
          <View>
            <Text className="text-base font-bold text-gray-900 mb-1">
              {t('manageRaffle.draftTitle')}
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              {t('manageRaffle.draftDesc')}
            </Text>
            <Button
              title={t('manageRaffle.openForInvitations')}
              variant="primary"
              size="lg"
              onPress={handleOpenForInvitations}
            />
          </View>
        ) : raffle.status === 'inviting' ? (
          <View>
            <Text className="text-base font-bold text-gray-900 mb-1">
              {t('manageRaffle.invitingTitle', { count: acceptedCount })}
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              {t('manageRaffle.invitingDesc')}
            </Text>
            <Button
              title={t('manageRaffle.runDrawNow')}
              variant="secondary"
              size="lg"
              disabled={acceptedCount < 2}
              loading={drawing}
              onPress={handleExecuteDraw}
            />
            {acceptedCount < 2 ? (
              <Text className="text-[11px] text-amber-600 mt-2 text-center">
                {t('manageRaffle.needTwoParticipants')}
              </Text>
            ) : null}
          </View>
        ) : raffle.status === 'drawn' ? (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-base font-bold text-violet-900">
                  {t('manageRaffle.drawCompleteTitle')}
                </Text>
                <Text className="text-xs text-gray-500">
                  {t('manageRaffle.drawCompleteDesc')}
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
                      {p.giftGiven ? t('manageRaffle.delivered') : t('manageRaffle.pending')}
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
              title={t('manageRaffle.revealAllBtn')}
              variant="outline"
              size="md"
              className="mt-3 border-violet-600"
              onPress={handleRevealAssignments}
            />
          </View>
        ) : (
          <View className="items-center py-3">
            <View className="w-12 h-12 rounded-xl bg-violet-100 items-center justify-center mb-2 border border-violet-200">
              <Ionicons name="sparkles" size={24} color="#7C3AED" />
            </View>
            <Text className="text-base font-bold text-gray-900">
              {t('manageRaffle.completedTitle')}
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              {t('manageRaffle.completedDesc')}
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
