import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format, parse, isValid, addDays } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import {
  addDoc,
  rafflesCollection,
  generateInviteCode,
  participantsCollection,
} from '@/lib/firestore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CAD', 'AUD'];

export default function CreateRaffleScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const tomorrow = addDays(new Date(), 7);
  const nextMonth = addDays(new Date(), 21);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [priceLimit, setPriceLimit] = useState('20');
  const [currency, setCurrency] = useState('EUR');
  const [raffleDateStr, setRaffleDateStr] = useState(format(tomorrow, 'yyyy-MM-dd'));
  const [giftDateStr, setGiftDateStr] = useState(format(nextMonth, 'yyyy-MM-dd'));
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverImageUrl(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error picking cover image:', err);
    }
  };

  const handleCreate = async () => {
    if (!user) {
      setError('You must be signed in to create a raffle.');
      return;
    }

    if (!name.trim()) {
      setError('Please provide a raffle name.');
      return;
    }

    const price = parseFloat(priceLimit);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price limit.');
      return;
    }

    const raffleDate = parse(raffleDateStr, 'yyyy-MM-dd', new Date());
    const giftDate = parse(giftDateStr, 'yyyy-MM-dd', new Date());

    if (!isValid(raffleDate) || !isValid(giftDate)) {
      setError('Please enter valid dates formatted as YYYY-MM-DD.');
      return;
    }

    if (giftDate.getTime() <= raffleDate.getTime()) {
      setError('Gift exchange date must be after the draw date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const inviteCode = generateInviteCode(6);

      const docRef = await addDoc(rafflesCollection(), {
        id: '',
        name: name.trim(),
        topic: topic.trim() || 'General Holiday Gifts',
        priceLimit: price,
        currency,
        raffleDate,
        giftDate,
        status: 'draft',
        managerId: user.uid,
        createdAt: new Date(),
        inviteCode,
        coverImageUrl: coverImageUrl || undefined,
        revealed: false,
      });

      // Also add manager as the first participant
      await addDoc(participantsCollection(docRef.id), {
        id: '',
        raffleId: docRef.id,
        userId: user.uid,
        name: user.displayName || 'Manager',
        email: user.email || '',
        status: 'accepted',
        exclusions: [],
        giftGiven: false,
        expoPushToken: user.expoPushToken,
        joinedAt: new Date(),
      });

      router.replace(`/raffle/${docRef.id}/manage` as any);
    } catch (err: unknown) {
      console.error('Error creating raffle:', err);
      setError(err instanceof Error ? err.message : 'Failed to create raffle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner / Cover Picker */}
        <Pressable
          onPress={pickImage}
          className="w-full h-40 bg-red-50 rounded-2xl border-2 border-dashed border-red-200 items-center justify-center overflow-hidden mb-6"
        >
          {coverImageUrl ? (
            <Image
              source={{ uri: coverImageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="items-center">
              <View className="w-12 h-12 rounded-full bg-white items-center justify-center mb-2 shadow-xs">
                <Ionicons name="image-outline" size={24} color="#B91C1C" />
              </View>
              <Text className="text-sm font-semibold text-[#B91C1C]">
                Add Cover Photo (Optional)
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                Tap to pick from camera roll
              </Text>
            </View>
          )}
        </Pressable>

        {/* Error message */}
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex-row items-center">
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text className="text-xs text-red-600 font-semibold ml-2 flex-1">
              {error}
            </Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View className="space-y-1">
          <Input
            label="Raffle Name *"
            placeholder="e.g. Office Secret Santa 2026"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="Theme or Topic"
            placeholder="e.g. Books, Board Games, Funny Mugs"
            value={topic}
            onChangeText={setTopic}
          />

          <View className="flex-row space-x-3 mb-3">
            <View className="flex-1">
              <Input
                label="Budget Limit *"
                placeholder="25"
                value={priceLimit}
                onChangeText={setPriceLimit}
                keyboardType="numeric"
              />
            </View>

            <View className="w-32 ml-3">
              <Text className="text-sm font-semibold text-gray-700 mb-1.5 ml-0.5">
                Currency
              </Text>
              <View className="flex-row border border-gray-200 rounded-xl p-1 bg-gray-50/50 justify-around">
                {CURRENCIES.slice(0, 3).map((curr) => (
                  <Pressable
                    key={curr}
                    onPress={() => setCurrency(curr)}
                    className={`px-2.5 py-2 rounded-lg ${
                      currency === curr ? 'bg-[#B91C1C]' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        currency === curr ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {curr}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Date pickers (standard ISO YYYY-MM-DD input with calendar icons) */}
          <View className="flex-row space-x-3 mb-2">
            <View className="flex-1">
              <Input
                label="Draw Date (YYYY-MM-DD) *"
                placeholder="2026-12-15"
                value={raffleDateStr}
                onChangeText={setRaffleDateStr}
                leftIcon={<Ionicons name="calendar-outline" size={16} color="#9CA3AF" />}
              />
            </View>
            <View className="flex-1 ml-3">
              <Input
                label="Gift Day (YYYY-MM-DD) *"
                placeholder="2026-12-25"
                value={giftDateStr}
                onChangeText={setGiftDateStr}
                leftIcon={<Ionicons name="gift-outline" size={16} color="#9CA3AF" />}
              />
            </View>
          </View>
          <Text className="text-xs text-gray-400 mb-6 ml-1">
            Draw date is when pairings are made. Gift day is when gifts are given.
          </Text>
        </View>

        {/* Submit */}
        <Button
          title="Create Secret Santa 🎄"
          onPress={handleCreate}
          variant="primary"
          size="lg"
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
