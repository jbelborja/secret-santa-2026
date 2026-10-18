import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation, SupportedLanguage } from '@/lib/i18n';
import { logOut } from '@/lib/auth';
import { updateDoc, userDoc } from '@/lib/firestore';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>('checking');

  React.useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  React.useEffect(() => {
    async function checkPerms() {
      if (Platform.OS === 'web') {
        setNotificationStatus('web');
        return;
      }
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationStatus(status === 'granted' ? 'enabled' : 'disabled');
    }
    checkPerms();
  }, []);

  const handleSaveName = async () => {
    if (!displayName.trim() || !user?.uid) return;
    setSaving(true);
    try {
      await updateDoc(userDoc(user.uid), {
        displayName: displayName.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.nameUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleRequestNotifications = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token && user?.uid) {
      await updateDoc(userDoc(user.uid), { expoPushToken: token });
      setNotificationStatus('enabled');
    } else {
      setNotificationStatus('disabled');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t('profile.signOutConfirmTitle'),
      t('profile.signOutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logOut();
            } catch (err) {
              console.error('Sign out error:', err);
            }
          },
        },
      ]
    );
  };

  const appVersion =
    Constants.expoConfig?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    '1.0.0';

  const projectId =
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'secret-santa-app';

  return (
    <ScrollView
      className="flex-1 bg-[#FAFAFA]"
      contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
    >
      {/* User Header Profile Card */}
      <View className="items-center mb-6">
        <View className="relative">
          <Avatar
            name={user?.displayName || user?.email || 'User'}
            imageUrl={user?.photoURL}
            size="lg"
            className="w-24 h-24 rounded-full border-4 border-white shadow-md"
          />
        </View>

        {!isEditing ? (
          <View className="items-center mt-3">
            <Text className="text-xl font-bold text-gray-900">
              {user?.displayName || t('profile.participant')}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">{user?.email}</Text>
            <Pressable
              onPress={() => setIsEditing(true)}
              className="mt-2 flex-row items-center bg-gray-100 px-3 py-1 rounded-full active:bg-gray-200"
            >
              <Ionicons name="pencil-outline" size={13} color="#4B5563" />
              <Text className="text-xs font-semibold text-gray-700 ml-1">
                {t('profile.editName')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full mt-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <Input
              label={t('profile.displayName')}
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
            />
            <View className="flex-row space-x-2 mt-2">
              <Button
                title={t('common.cancel')}
                variant="ghost"
                size="sm"
                className="flex-1"
                onPress={() => {
                  setDisplayName(user?.displayName || '');
                  setIsEditing(false);
                }}
              />
              <Button
                title={t('profile.saveName')}
                variant="primary"
                size="sm"
                className="flex-1 ml-2"
                loading={saving}
                onPress={handleSaveName}
              />
            </View>
          </View>
        )}
      </View>

      {/* Language Selection Card */}
      <Card className="mb-4">
        <View className="flex-row items-center mb-3">
          <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mr-3 border border-red-100">
            <Ionicons name="language-outline" size={20} color="#B91C1C" />
          </View>
          <View>
            <Text className="text-base font-semibold text-gray-900">
              {t('profile.language')}
            </Text>
            <Text className="text-xs text-gray-500">
              {language === 'es' ? t('profile.spanish') : t('profile.english')}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2 pt-2 border-t border-gray-100">
          <Pressable
            onPress={() => setLanguage('es')}
            className={`flex-1 py-2.5 px-3 rounded-xl border flex-row items-center justify-center ${
              language === 'es'
                ? 'bg-red-50 border-[#B91C1C]'
                : 'bg-gray-50 border-gray-200 active:bg-gray-100'
            }`}
          >
            <Text className="text-sm mr-1.5">🇪🇸</Text>
            <Text
              className={`text-sm font-bold ${
                language === 'es' ? 'text-[#B91C1C]' : 'text-gray-700'
              }`}
            >
              {t('profile.spanish')}
            </Text>
            {language === 'es' ? (
              <Ionicons name="checkmark-circle" size={16} color="#B91C1C" style={{ marginLeft: 6 }} />
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => setLanguage('en')}
            className={`flex-1 py-2.5 px-3 rounded-xl border flex-row items-center justify-center ${
              language === 'en'
                ? 'bg-red-50 border-[#B91C1C]'
                : 'bg-gray-50 border-gray-200 active:bg-gray-100'
            }`}
          >
            <Text className="text-sm mr-1.5">🇬🇧</Text>
            <Text
              className={`text-sm font-bold ${
                language === 'en' ? 'text-[#B91C1C]' : 'text-gray-700'
              }`}
            >
              {t('profile.english')}
            </Text>
            {language === 'en' ? (
              <Ionicons name="checkmark-circle" size={16} color="#B91C1C" style={{ marginLeft: 6 }} />
            ) : null}
          </Pressable>
        </View>
      </Card>

      {/* Notifications Card */}
      <Card className="mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mr-3 border border-red-100">
              <Ionicons name="notifications-outline" size={20} color="#B91C1C" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {t('profile.notifications')}
              </Text>
              <Text className="text-xs text-gray-500">
                {notificationStatus === 'web'
                  ? t('profile.notificationsWeb')
                  : notificationStatus === 'checking'
                  ? t('profile.notificationsChecking')
                  : notificationStatus === 'enabled'
                  ? `${t('common.enabled')}`
                  : `${t('common.disabled')}`}
              </Text>
            </View>
          </View>

          {notificationStatus === 'disabled' ? (
            <Button
              title={t('common.enable')}
              size="sm"
              variant="outline"
              onPress={handleRequestNotifications}
            />
          ) : null}
        </View>
      </Card>

      {/* App & System Details Card */}
      <Card className="mb-6">
        <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          {t('profile.appInfo')}
        </Text>

        <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
          <Text className="text-sm text-gray-600">{t('profile.appVersion')}</Text>
          <Text className="text-sm font-semibold text-gray-900">{appVersion}</Text>
        </View>

        <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
          <Text className="text-sm text-gray-600">{t('profile.firebaseProject')}</Text>
          <Text className="text-sm font-mono text-gray-700">{projectId}</Text>
        </View>

        <View className="flex-row items-center justify-between py-2">
          <Text className="text-sm text-gray-600">{t('profile.userId')}</Text>
          <Text className="text-xs font-mono text-gray-500" numberOfLines={1}>
            {user?.uid ? `${user.uid.slice(0, 12)}...` : 'N/A'}
          </Text>
        </View>
      </Card>

      {/* Sign Out Button */}
      <Button
        title={t('profile.signOut')}
        variant="danger"
        size="lg"
        onPress={handleSignOut}
        leftIcon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
      />
    </ScrollView>
  );
}
