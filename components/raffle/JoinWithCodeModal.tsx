import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useTranslation } from '@/lib/i18n';

export interface JoinWithCodeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const JoinWithCodeModal: React.FC<JoinWithCodeModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = () => {
    let cleanCode = code.trim().toUpperCase();
    if (cleanCode.includes('/INVITE/')) {
      cleanCode = cleanCode.split('/INVITE/').pop()?.split('?')[0]?.split('#')[0]?.trim() || cleanCode;
    }
    // Clean any trailing non-alphanumeric characters
    cleanCode = cleanCode.replace(/[^A-Z0-9]/g, '');

    if (!cleanCode) {
      setError(t('home.joinCodeRequired'));
      return;
    }

    setError(null);
    setCode('');
    onClose();
    router.push(`/invite/${cleanCode}` as any);
  };

  const handleClose = () => {
    setError(null);
    setCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/50 items-center justify-center p-5">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="w-full max-w-sm"
          >
            <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg items-center">
              {/* Header Icon */}
              <View className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 items-center justify-center mb-3">
                <Ionicons name="ticket-outline" size={24} color="#B91C1C" />
              </View>

              <Text className="text-lg font-bold text-gray-900 text-center mb-1">
                {t('home.joinModalTitle')}
              </Text>
              <Text className="text-xs text-gray-500 text-center mb-5 px-1 leading-4">
                {t('home.joinModalSubtitle')}
              </Text>

              {/* Code Input */}
              <Input
                value={code}
                onChangeText={(text) => {
                  setCode(text.toUpperCase());
                  if (error) setError(null);
                }}
                placeholder={t('home.joinCodePlaceholder')}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={10}
                className="mb-1"
                style={{
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: '800',
                  letterSpacing: 4,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                }}
                error={error || undefined}
                returnKeyType="go"
                onSubmitEditing={handleJoin}
              />

              {/* Action Buttons */}
              <View className="w-full gap-2 mt-4">
                <Button
                  title={t('home.joinSubmitBtn')}
                  onPress={handleJoin}
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!code.trim()}
                  leftIcon={<Ionicons name="enter-outline" size={18} color="#FFFFFF" />}
                />
                <Button
                  title={t('home.joinCancelBtn')}
                  onPress={handleClose}
                  variant="ghost"
                  size="md"
                  className="w-full"
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default JoinWithCodeModal;
