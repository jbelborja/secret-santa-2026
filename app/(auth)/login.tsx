import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithApple,
  useGoogleAuth,
  formatAuthError,
} from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { t, language, setLanguage } = useTranslation();

  const navigateAfterAuth = () => {
    if (redirect) {
      router.replace(redirect as any);
    } else {
      router.replace('/(tabs)');
    }
  };
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    signIn: signInWithGoogle,
    loading: googleLoading,
    isConfigured: isGoogleConfigured,
    error: googleError,
  } = useGoogleAuth();

  const handleEmailAuth = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.fillEmailPassword'));
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setError(t('auth.provideName'));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      navigateAfterAuth();
    } catch (err: unknown) {
      console.error('Auth error:', err);
      setError(formatAuthError(err, language));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithApple();
      navigateAfterAuth();
    } catch (err: unknown) {
      console.error('Apple Sign In error:', err);
      if ((err as any)?.code !== 'ERR_REQUEST_CANCELED') {
        setError(err instanceof Error ? err.message : t('auth.appleError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (result) {
        navigateAfterAuth();
      }
    } catch (err: unknown) {
      console.error('Google Sign In error:', err);
      setError(formatAuthError(err, language));
    }
  };

  const displayError = error || googleError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        className="px-6 py-12 justify-center"
      >
        {/* Language Quick Switcher */}
        <View className="items-end mb-2">
          <View className="flex-row items-center bg-gray-100 rounded-full p-1 border border-gray-200">
            <Pressable
              onPress={() => setLanguage('es')}
              className={`px-2.5 py-1 rounded-full flex-row items-center ${
                language === 'es' ? 'bg-white shadow-xs' : ''
              }`}
            >
              <Text className="text-xs mr-1">🇪🇸</Text>
              <Text
                className={`text-xs font-bold ${
                  language === 'es' ? 'text-[#B91C1C]' : 'text-gray-500'
                }`}
              >
                ES
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-full flex-row items-center ${
                language === 'en' ? 'bg-white shadow-xs' : ''
              }`}
            >
              <Text className="text-xs mr-1">🇬🇧</Text>
              <Text
                className={`text-xs font-bold ${
                  language === 'en' ? 'text-[#B91C1C]' : 'text-gray-500'
                }`}
              >
                EN
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Header */}
        <View className="items-center mb-8">
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 80, height: 80, borderRadius: 20 }}
            className="mb-4 shadow-sm"
            resizeMode="cover"
          />
          <Text className="text-3xl font-black text-gray-900 tracking-tight">
            {t('auth.appName')}
          </Text>
          <Text className="text-sm text-gray-500 mt-1.5 text-center">
            {t('auth.subtitle')}
          </Text>
        </View>

        {/* Error Alert */}
        {displayError ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex-row items-center">
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text className="text-sm text-red-700 ml-2.5 flex-1 font-medium">
              {displayError}
            </Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View className="space-y-1 mb-4">
          {isSignUp ? (
            <Input
              label={t('auth.fullName')}
              placeholder={t('auth.fullNamePlaceholder')}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              leftIcon={<Ionicons name="person-outline" size={18} color="#9CA3AF" />}
            />
          ) : null}

          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={18} color="#9CA3AF" />}
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />}
          />
        </View>

        {/* Primary Action Button */}
        <Button
          title={isSignUp ? t('auth.createAccount') : t('auth.signIn')}
          onPress={handleEmailAuth}
          variant="primary"
          size="lg"
          loading={loading}
          className="mb-4"
        />

        {/* Toggle Mode Link */}
        <Pressable
          onPress={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          className="py-2 items-center mb-6"
        >
          <Text className="text-sm text-gray-600">
            {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
            <Text className="font-bold text-[#B91C1C]">
              {isSignUp ? t('auth.signIn') : t('auth.createAccount')}
            </Text>
          </Text>
        </Pressable>

        {/* Social Logins Divider */}
        <View className="flex-row items-center my-4">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t('auth.orContinueWith')}
          </Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Apple Sign In (iOS only) */}
        {Platform.OS === 'ios' ? (
          <Button
            title={t('auth.signInApple')}
            onPress={handleAppleAuth}
            variant="outline"
            size="md"
            className="mb-3 border-gray-900 bg-black"
            leftIcon={<Ionicons name="logo-apple" size={18} color="#FFFFFF" />}
          />
        ) : null}

        {/* Google Sign In */}
        <Button
          title={t('auth.signInGoogle')}
          onPress={handleGoogleAuth}
          variant="outline"
          size="md"
          loading={googleLoading}
          className="border-gray-300"
          leftIcon={<Ionicons name="logo-google" size={18} color="#EA4335" />}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
