import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
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

export default function LoginScreen() {
  const router = useRouter();
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
      setError('Please fill in both email and password.');
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setError('Please provide your name.');
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
      router.replace('/(tabs)');
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const message =
        err instanceof Error ? err.message : 'An error occurred during authentication.';
      setError(message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      console.error('Apple Sign In error:', err);
      if ((err as any)?.code !== 'ERR_REQUEST_CANCELED') {
        setError(err instanceof Error ? err.message : 'Apple Sign In failed');
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
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      console.error('Google Sign In error:', err);
      setError(formatAuthError(err));
    }
  };

  const displayError = error || googleError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="px-6 py-12 justify-center"
      >
        {/* Festive Header */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-red-50 border-2 border-red-200 items-center justify-center mb-3 shadow-sm">
            <Text className="text-5xl">🎅</Text>
          </View>
          <Text className="text-3xl font-black text-[#B91C1C] tracking-tight">
            Secret Santa
          </Text>
          <Text className="text-base text-gray-600 mt-1.5 text-center">
            Create or join a Secret Santa raffle 🎄
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
              label="Your Full Name"
              placeholder="e.g. Santa Claus"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              leftIcon={<Ionicons name="person-outline" size={18} color="#9CA3AF" />}
            />
          ) : null}

          <Input
            label="Email Address"
            placeholder="santa@northpole.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={18} color="#9CA3AF" />}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />}
          />
        </View>

        {/* Primary Action Button */}
        <Button
          title={isSignUp ? 'Create Account 🎁' : 'Sign In 🎄'}
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
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Text className="font-bold text-[#B91C1C]">
              {isSignUp ? 'Sign In' : 'Create Account'}
            </Text>
          </Text>
        </Pressable>

        {/* Social Logins Divider */}
        {(Platform.OS === 'ios' || isGoogleConfigured) ? (
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Or continue with
            </Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>
        ) : null}

        {/* Apple Sign In (iOS only) */}
        {Platform.OS === 'ios' ? (
          <Button
            title="Sign in with Apple"
            onPress={handleAppleAuth}
            variant="outline"
            size="md"
            className="mb-3 border-gray-900 bg-black"
            leftIcon={<Ionicons name="logo-apple" size={18} color="#FFFFFF" />}
          />
        ) : null}

        {/* Google Sign In */}
        {isGoogleConfigured ? (
          <Button
            title="Sign in with Google"
            onPress={handleGoogleAuth}
            variant="outline"
            size="md"
            loading={googleLoading}
            className="border-gray-300"
            leftIcon={<Ionicons name="logo-google" size={18} color="#EA4335" />}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
