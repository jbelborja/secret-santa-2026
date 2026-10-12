import React, { useState } from 'react';
import { View, Text, Pressable, Share, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '../ui/Button';

export interface InviteCodeDisplayProps {
  inviteCode: string;
  raffleName: string;
  visible?: boolean;
  onClose?: () => void;
  className?: string;
}

export const InviteCodeDisplay: React.FC<InviteCodeDisplayProps> = ({
  inviteCode,
  raffleName,
  visible = true,
  onClose,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `secretsanta://invite/${inviteCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Join our Secret Santa: ${raffleName}`,
        message: `🎄 You're invited to join our Secret Santa "${raffleName}"!\n\nUse invite code: ${inviteCode}\nOr open the app: ${inviteUrl}`,
        url: inviteUrl,
      });
    } catch (error) {
      console.error('Error sharing invite code:', error);
    }
  };

  const handleCopy = () => {
    // In React Native without clipboard dependency, simulate quick copy feedback
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <View className={`bg-white rounded-3xl p-6 border border-red-100 shadow-xl items-center ${className}`}>
      {/* Decorative Santa icon */}
      <View className="w-16 h-16 rounded-full bg-red-50 border border-red-200 items-center justify-center mb-4">
        <Text className="text-3xl">🎅</Text>
      </View>

      <Text className="text-xl font-bold text-gray-900 text-center mb-1">
        Invite Your Friends!
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-5 px-2">
        Share this code to let participants join "{raffleName}"
      </Text>

      {/* Big code display */}
      <View className="bg-red-50/80 border-2 border-dashed border-[#B91C1C]/40 rounded-2xl py-4 px-8 mb-6 items-center">
        <Text className="text-3xl font-black tracking-widest text-[#B91C1C]">
          {inviteCode}
        </Text>
        <Text className="text-[11px] font-semibold text-gray-500 uppercase mt-1">
          Shareable Code
        </Text>
      </View>

      {/* Action buttons */}
      <View className="w-full space-y-2.5">
        <Button
          title="Share Invite Link 🎁"
          onPress={handleShare}
          variant="primary"
          size="lg"
          className="w-full"
        />

        {onClose ? (
          <Button
            title="Done"
            onPress={onClose}
            variant="ghost"
            size="md"
            className="w-full mt-2"
          />
        ) : null}
      </View>
    </View>
  );

  if (onClose) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="w-full max-w-sm">
            {content}
          </View>
        </View>
      </Modal>
    );
  }

  return content;
};

export default InviteCodeDisplay;
