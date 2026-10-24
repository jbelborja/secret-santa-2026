import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Platform,
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
import { useTranslation } from '@/lib/i18n';
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
  const { t, formatDate } = useTranslation();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [managerName, setManagerName] = useState<string>(t('invite.theOrganizer'));
  const [existingParticipant, setExistingParticipant] = useState<Participant | null>(null);
  const [joinName, setJoinName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvite() {
      if (!code) {
        setError(t('invite.noCode'));
        setLoading(false);
        return;
      }

      try {
        const foundRaffle = await getRaffleByInviteCode(code);
        if (!foundRaffle) {
          setError(t('invite.invalidCode'));
          setLoading(false);
          return;
        }

        setRaffle(foundRaffle);

        // Fetch manager profile name
        try {
          const mSnap = await getDoc(userDoc(foundRaffle.managerId));
          if (mSnap.exists()) {
            setManagerName(mSnap.data().displayName || t('invite.theOrganizer'));
          }
        } catch {}

        // Check if current user is already in participants
        if (user) {
          setJoinName(user.displayName || user.email?.split('@')[0] || '');

          const pColl = participantsCollection(foundRaffle.id);
          const pSnap = await getDocs(pColl);

          let foundPart: Participant | null = null;
          const userEmail = (user.email || '').trim().toLowerCase();
          pSnap.forEach((docSnap) => {
            const p = docSnap.data();
            const partEmail = (p.email || '').trim().toLowerCase();
            if (
              p.userId === user.uid ||
              (userEmail && partEmail && userEmail === partEmail)
            ) {
              foundPart = p;
            }
          });

          setExistingParticipant(foundPart);
        }
      } catch (err: unknown) {
        console.error('Error fetching invite:', err);
        setError(t('invite.verifyError'));
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadInvite();
    }
  }, [code, user, authLoading, t]);

  const handleAccept = async () => {
    if (!raffle || !user) return;

    if (!existingParticipant) {
      const msg = `Tu correo (${user.email || 'desconocido'}) no está en la lista de invitados para este sorteo.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert(t('common.error'), msg);
      }
      return;
    }

    setSubmitting(true);

    try {
      const participantPayload: Record<string, any> = {
        status: 'accepted',
        userId: user.uid,
        name: joinName.trim() || existingParticipant.name,
        joinedAt: new Date(),
      };
      if (user.expoPushToken) {
        participantPayload.expoPushToken = user.expoPushToken;
      }

      // Update existing invited record
      const pRef = participantDoc(raffle.id, existingParticipant.id);
      await updateDoc(pRef, participantPayload);

      router.replace(`/raffle/${raffle.id}` as any);
    } catch (err: unknown) {
      console.error('Error accepting invitation:', err);
      const rawMsg =
        (err as any)?.message ||
        (err instanceof Error ? err.message : '') ||
        (typeof err === 'string' ? err : '');
      const errMsg = rawMsg || t('common.error');
      if (Platform.OS === 'web') {
        window.alert(`Error al unirse: ${errMsg}`);
      } else {
        Alert.alert(t('common.error'), errMsg);
      }
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
    return <LoadingSpinner message={t('invite.loading')} />;
  }

  if (error || !raffle) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-4 border border-red-100">
          <Text className="text-4xl">❌</Text>
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center mb-2">
          {error || t('invite.invalidTitle')}
        </Text>
        <Text className="text-xs text-gray-500 text-center max-w-xs mb-6">
          {t('invite.invalidDesc')}
        </Text>
        <Button
          title={t('invite.goToHome')}
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
        <View className="w-20 h-20 rounded-2xl bg-red-50 border border-red-100 items-center justify-center mb-4 border border-red-100">
          <Ionicons name="gift-outline" size={36} color="#B91C1C" />
        </View>
        <Text className="text-2xl font-black text-gray-900 text-center mb-1">
          {t('invite.signInRequiredTitle')}
        </Text>
        <Text className="text-sm text-gray-600 text-center mb-6">
          {t('invite.signInRequiredDesc', { name: raffle.name })}
        </Text>
        <Button
          title={t('invite.signInToJoin')}
          variant="primary"
          size="lg"
          onPress={() => router.replace(`/(auth)/login?redirect=/invite/${code}` as any)}
          className="w-full"
        />
      </View>
    );
  }

  // If raffle has already been drawn and the user is NOT one of the participants
  const isAlreadyDrawn = raffle.status === 'drawn' || raffle.status === 'completed';
  if (isAlreadyDrawn && !existingParticipant) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-20 h-20 rounded-full bg-amber-50 items-center justify-center mb-4 border border-amber-100">
          <Ionicons name="lock-closed-outline" size={36} color="#D97706" />
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center mb-2">
          {raffle.name}
        </Text>
        <Text className="text-sm text-gray-600 text-center max-w-xs mb-6 leading-5">
          Este sorteo ya ha sido realizado y las parejas de Amigo Invisible ya están asignadas. No es posible unirse a un sorteo cerrado.
        </Text>
        <Button
          title={t('invite.goToHome')}
          variant="primary"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    );
  }

  // Guard: User is logged in, but their email was not invited to this raffle by the organizer
  if (!existingParticipant) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <View className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 items-center justify-center mb-4">
          <Ionicons name="mail-unread-outline" size={36} color="#D97706" />
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center mb-2">
          Correo no invitado
        </Text>
        <Text className="text-xs text-gray-500 text-center mb-1">
          Has iniciado sesión como:
        </Text>
        <Text className="text-sm font-bold text-gray-900 text-center mb-4">
          {user.email || 'Sin correo asociado'}
        </Text>
        <Text className="text-xs text-gray-600 text-center max-w-xs mb-6 leading-5">
          Este correo no está en la lista de invitados para el sorteo <Text className="font-bold text-gray-900">&quot;{raffle.name}&quot;</Text>. Pídele al organizador ({managerName}) que añada tu correo o inicia sesión con la cuenta invitada.
        </Text>
        <Button
          title="Iniciar sesión con otra cuenta"
          variant="primary"
          size="lg"
          onPress={() => router.replace(`/(auth)/login?redirect=/invite/${code}` as any)}
          className="w-full mb-3"
        />
        <Button
          title={t('invite.goToHome')}
          variant="ghost"
          size="md"
          onPress={() => router.replace('/(tabs)')}
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
          {t('invite.youAreInvited')}
        </Text>
        <Text className="text-2xl font-black text-gray-900 text-center mt-1">
          {raffle.name}
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          {t('invite.organizedBy', { name: managerName })}
        </Text>
      </View>

      {/* Raffle Details Card */}
      <Card className="mb-6 bg-white border border-gray-100">
        <View className="space-y-3">
          <View className="flex-row items-center justify-between pb-2.5 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="pricetag-outline" size={16} color="#D97706" />
              <Text className="text-xs text-gray-600 ml-2">{t('invite.budgetLimit')}</Text>
            </View>
            <Text className="text-xs font-bold text-gray-900">
              {raffle.priceLimit} {raffle.currency}
            </Text>
          </View>

          <View className="flex-row items-center justify-between pb-2.5 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="gift-outline" size={16} color="#15803D" />
              <Text className="text-xs text-gray-600 ml-2">{t('invite.exchangeDay')}</Text>
            </View>
            <Text className="text-xs font-bold text-gray-900">
              {formatDate(raffle.giftDate, 'MMMM d, yyyy')}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="sparkles-outline" size={16} color="#B91C1C" />
              <Text className="text-xs text-gray-600 ml-2">{t('invite.theme')}</Text>
            </View>
            <Text className="text-xs font-bold text-gray-900">
              {raffle.topic || t('invite.generalGifts')}
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
                {t('invite.currentStatus')}
              </Text>
              <Text className="text-xs text-gray-600 mt-0.5">
                {t('invite.alreadyRegistered')}
              </Text>
            </View>
            <StatusBadge status={existingParticipant.status} />
          </View>
        </Card>
      ) : null}

      {/* Join As Name Input */}
      <View className="mb-6">
        <Input
          label={t('invite.joinAs')}
          placeholder={t('invite.joinAsPlaceholder')}
          value={joinName}
          onChangeText={setJoinName}
        />
        <Text className="text-[11px] text-gray-400 ml-1">
          {t('invite.joinAsHint')}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3">
        <Button
          title={
            existingParticipant?.status === 'accepted'
              ? t('invite.goToRaffle')
              : t('invite.acceptInvitation')
          }
          variant="secondary"
          size="lg"
          loading={submitting}
          onPress={handleAccept}
          className="mb-3"
        />

        {existingParticipant?.status !== 'accepted' ? (
          <Button
            title={t('invite.decline')}
            variant="ghost"
            size="md"
            onPress={handleDecline}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
