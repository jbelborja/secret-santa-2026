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
        message: `You're invited to join our Secret Santa "${raffleName}".\n\nInvite code: ${inviteCode}\nOpen the app: ${inviteUrl}`,
        url: inviteUrl,
      });
    } catch (error) {
      console.error('Error sharing invite code:', error);
    }
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <View className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm items-center ${className}`}>
      {/* Icon header */}
      <View className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 items-center justify-center mb-4">
        <Ionicons name="share-outline" size={22} color="#B91C1C" />
      </View>

      <Text className="text-lg font-bold text-gray-900 text-center mb-1">
        Invite Participants
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-6 px-2">
        Share this code to let people join "{raffleName}"
      </Text>

      {/* Code display */}
      <Pressable
        onPress={handleCopy}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-6 mb-6 items-center active:opacity-70"
      >
        <Text className="text-2xl font-black tracking-[0.2em] text-gray-900 font-mono">
          {inviteCode}
        </Text>
        <Text className="text-xs text-gray-400 uppercase tracking-wider mt-1.5 font-medium">
          {copied ? 'Copied!' : 'Tap to copy'}
        </Text>
      </Pressable>

      {/* Actions */}
      <View className="w-full gap-2">
        <Button
          title="Share Invite Link"
          onPress={handleShare}
          variant="primary"
          size="lg"
          className="w-full"
          leftIcon={<Ionicons name="share-social-outline" size={18} color="#FFFFFF" />}
        />

        {onClose ? (
          <Button
            title="Done"
            onPress={onClose}
            variant="ghost"
            size="md"
            className="w-full mt-1"
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
        <View className="flex-1 bg-black/50 items-center justify-center p-6">
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
