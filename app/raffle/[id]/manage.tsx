import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format, parse, isValid } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { useRaffle } from '@/hooks/useRaffle';
import { useParticipants } from '@/hooks/useParticipants';
import {
  raffleDoc,
  participantDoc,
  executeRaffleDraw,
  completeRaffleExchange,
} from '@/lib/firestore';
import { sendBatchPushNotifications } from '@/lib/notifications';
import { sendDrawEmails } from '@/lib/email';
import { StatusBadge } from '@/components/raffle/StatusBadge';
import { InviteCodeDisplay } from '@/components/raffle/InviteCodeDisplay';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { PageContainer } from '@/components/ui/PageContainer';

export default function ManageRaffleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t, formatDate } = useTranslation();
  const { raffle, loading: raffleLoading, updateRaffle, deleteRaffle } = useRaffle(id);
  const { participants, loading: partsLoading } = useParticipants(id);

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editPriceLimit, setEditPriceLimit] = useState('');
  const [editGiftDate, setEditGiftDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [concluding, setConcluding] = useState(false);

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
    } catch (err: unknown) {
      const msg = (err as any)?.message || t('common.error');
      if (Platform.OS === 'web') window.alert(`${t('common.error')}: ${msg}`);
      else Alert.alert(t('common.error'), msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenForInvitations = async () => {
    try {
      await updateRaffle({ status: 'inviting' });
      setInviteModalVisible(true);
    } catch (err: unknown) {
      const msg = (err as any)?.message || t('common.error');
      if (Platform.OS === 'web') window.alert(`${t('common.error')}: ${msg}`);
      else Alert.alert(t('common.error'), msg);
    }
  };

  const performDraw = async (isAuto = false) => {
    setDrawing(true);
    setDrawError(null);

    try {
      const result = await executeRaffleDraw(raffle.id, participants);

      if (!result.success || !result.assignments) {
        const translatedError = result.errorCode
          ? t(`manageRaffle.drawErrors.${result.errorCode}`, result.errorParams)
          : result.error || t('manageRaffle.drawIssue');
        setDrawError(translatedError);
        setDrawing(false);
        return;
      }

      // Send draw emails (fire-and-forget)
      const participantNameMap = new Map(
        participants.map((p) => [p.id, p.name])
      );
      const emailParticipants = acceptedParticipants
        .filter((p) => p.email && result.assignments![p.id])
        .map((p) => ({
          name: p.name,
          email: p.email,
          recipientName: participantNameMap.get(result.assignments![p.id]) || '',
        }));

      if (emailParticipants.length > 0) {
        sendDrawEmails({
          raffleId: raffle.id,
          raffleName: raffle.name,
          topic: raffle.topic,
          priceLimit: raffle.priceLimit,
          currency: raffle.currency,
          giftDate: raffle.giftDate ? raffle.giftDate.toISOString() : null,
          participants: emailParticipants,
        }).catch((err) => console.warn('Draw emails failed (non-fatal):', err));
      }

      // Send batch push notifications
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

      if (!isAuto) {
        if (Platform.OS === 'web') {
          window.alert(t('manageRaffle.drawSuccessDesc'));
        } else {
          Alert.alert(t('manageRaffle.drawSuccessTitle'), t('manageRaffle.drawSuccessDesc'));
        }
      }
    } catch (err: unknown) {
      console.error('Error committing draw results:', err);
      const msg = (err as any)?.message || (err instanceof Error ? err.message : t('common.error'));
      setDrawError(msg);
      if (!isAuto) {
        if (Platform.OS === 'web') window.alert(`${t('common.error')}: ${msg}`);
        else Alert.alert(t('common.error'), msg);
      }
    } finally {
      setDrawing(false);
    }
  };

  const isDrawDatePassed = new Date() >= new Date(raffle.raffleDate);
  const allResponded = invitedCount === 0;
  const canTriggerDraw = (allResponded || isDrawDatePassed) && acceptedCount >= 2;

  const handleExecuteDraw = async () => {
    if (!canTriggerDraw) {
      const reason =
        acceptedCount < 2
          ? t('manageRaffle.needTwoParticipants')
          : t('manageRaffle.waitingForResponses', { count: invitedCount });
      if (Platform.OS === 'web') {
        window.alert(reason);
      } else {
        Alert.alert(t('manageRaffle.drawIssue'), reason);
      }
      return;
    }

    if (Platform.OS === 'web') {
      if (window.confirm(t('manageRaffle.confirmDrawDesc', { count: acceptedCount }))) {
        performDraw(false);
      }
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
          onPress: () => performDraw(false),
        },
      ]
    );
  };

  const performCompleteExchange = async () => {
    setConcluding(true);
    try {
      await completeRaffleExchange(raffle.id);
      if (Platform.OS === 'web') {
        window.alert(t('manageRaffle.autoConcludedDesc'));
      } else {
        Alert.alert(t('manageRaffle.completedTitle'), t('manageRaffle.autoConcludedDesc'));
      }
    } catch (err: unknown) {
      console.error('Error completing gift exchange:', err);
      const msg = (err as any)?.message || (err instanceof Error ? err.message : t('common.error'));
      if (Platform.OS === 'web') window.alert(`${t('common.error')}: ${msg}`);
      else Alert.alert(t('common.error'), msg);
    } finally {
      setConcluding(false);
    }
  };

  const handleCompleteGiftExchange = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('manageRaffle.confirmDeliverAllDesc'))) {
        performCompleteExchange();
      }
      return;
    }

    Alert.alert(
      t('manageRaffle.confirmDeliverAllTitle'),
      t('manageRaffle.confirmDeliverAllDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('manageRaffle.deliverAllGiftsBtn'),
          style: 'default',
          onPress: performCompleteExchange,
        },
      ]
    );
  };

  // Automatic date checks:
  // 1. If status is 'inviting' and draw date has passed -> auto-execute draw
  // 2. If status is 'drawn' and gift exchange date has passed -> auto-complete exchange
  useEffect(() => {
    if (!raffle || partsLoading) return;
    const now = Date.now();
    const raffleTime = new Date(raffle.raffleDate).getTime();
    const giftTime = new Date(raffle.giftDate).getTime();

    if (raffle.status === 'inviting' && now >= raffleTime && acceptedCount >= 2 && !drawing) {
      performDraw(true);
    } else if (raffle.status === 'drawn' && now >= giftTime && !concluding) {
      completeRaffleExchange(raffle.id).catch((err) =>
        console.warn('Auto complete gift exchange notice:', err)
      );
    }
  }, [raffle?.status, raffle?.raffleDate, raffle?.giftDate, acceptedCount, partsLoading]);

  const handleDeleteRaffle = () => {
    const doDelete = async () => {
      setDeleting(true);
      try {
        await deleteRaffle();
        router.replace('/(tabs)');
      } catch (err: unknown) {
        console.error('Error deleting raffle:', err);
        const rawMsg =
          (err as any)?.message ||
          (err instanceof Error ? err.message : '') ||
          t('common.error');
        if (Platform.OS === 'web') {
          window.alert(`${t('common.error')}: ${rawMsg}`);
        } else {
          Alert.alert(t('common.error'), rawMsg);
        }
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('manageRaffle.deleteConfirmDesc', { name: raffle.name }))) {
        doDelete();
      }
      return;
    }

    Alert.alert(
      t('manageRaffle.deleteConfirmTitle'),
      t('manageRaffle.deleteConfirmDesc', { name: raffle.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: doDelete,
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ paddingVertical: 20, paddingBottom: 60 }}
    >
      <PageContainer maxWidth={880} className="px-4 sm:px-6">
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
            <Text className="text-xs text-gray-500 mb-3">
              {t('manageRaffle.invitingDesc')}
            </Text>

            {!canTriggerDraw && !isDrawDatePassed ? (
              <View className="mb-3.5 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="time-outline" size={16} color="#D97706" />
                  <Text className="text-xs font-bold text-amber-900 ml-1.5">
                    {t('manageRaffle.waitingForResponses', { count: invitedCount })}
                  </Text>
                </View>
                <Text className="text-[11px] text-amber-800 leading-4">
                  {t('manageRaffle.drawUnlocksWhenAllRespond', {
                    date: formatDate(raffle.raffleDate, 'PPP'),
                  })}
                </Text>
              </View>
            ) : isDrawDatePassed && acceptedCount >= 2 ? (
              <View className="mb-3.5 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="sparkles" size={16} color="#2563EB" />
                  <Text className="text-xs font-bold text-blue-900 ml-1.5">
                    {t('manageRaffle.autoDrawDatePassed')}
                  </Text>
                </View>
              </View>
            ) : null}

            <Button
              title={t('manageRaffle.runDrawNow')}
              variant="secondary"
              size="lg"
              disabled={!canTriggerDraw}
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
            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-base font-bold text-violet-900">
                  {t('manageRaffle.drawCompleteTitle')}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {t('assignment.groupExchangeNotice', {
                    date: formatDate(raffle.giftDate, 'PPP'),
                  })}
                </Text>
              </View>
            </View>

            <View className="p-3 bg-violet-50 rounded-xl border border-violet-200 mb-4">
              <View className="flex-row items-center mb-1">
                <Ionicons name="gift-outline" size={17} color="#7C3AED" />
                <Text className="text-xs font-bold text-violet-900 ml-1.5">
                  {t('manageRaffle.deliverAllGiftsDesc')}
                </Text>
              </View>
            </View>

            <Button
              title={t('manageRaffle.deliverAllGiftsBtn')}
              variant="secondary"
              size="lg"
              loading={concluding}
              onPress={handleCompleteGiftExchange}
              leftIcon={<Ionicons name="gift-outline" size={18} color="#FFFFFF" />}
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

      {/* Danger Zone: Delete Raffle */}
      <Card className="mt-4 mb-4 bg-red-50/50 border border-red-200">
        <View className="flex-row items-center mb-1.5">
          <View className="w-8 h-8 rounded-lg bg-red-100 items-center justify-center mr-2.5">
            <Ionicons name="trash-outline" size={17} color="#DC2626" />
          </View>
          <Text className="text-base font-bold text-red-900">
            {t('manageRaffle.dangerZoneTitle')}
          </Text>
        </View>

        <Text className="text-xs text-red-700/80 mb-3.5 leading-4">
          {t('manageRaffle.deleteRaffleDesc')}
        </Text>

        <Button
          title={t('manageRaffle.deleteRaffleBtn')}
          onPress={handleDeleteRaffle}
          variant="danger"
          size="md"
          loading={deleting}
          leftIcon={<Ionicons name="trash-outline" size={16} color="#FFFFFF" />}
        />
      </Card>

      {/* Invite Code Modal */}
      <InviteCodeDisplay
        inviteCode={raffle.inviteCode}
        raffleName={raffle.name}
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
      />
      </PageContainer>
    </ScrollView>
  );
}
