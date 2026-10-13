import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';

export interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AVATAR_COLORS = [
  '#B91C1C', // Crimson
  '#0369A1', // Steel blue
  '#6D28D9', // Violet
  '#0F766E', // Teal
  '#B45309', // Amber
];

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const getSizeSpecs = () => {
    switch (size) {
      case 'sm':
        return { containerClass: 'w-8 h-8 rounded-full', textClass: 'text-xs font-semibold', dimensions: 32 };
      case 'lg':
        return { containerClass: 'w-14 h-14 rounded-full', textClass: 'text-xl font-semibold', dimensions: 56 };
      case 'md':
      default:
        return { containerClass: 'w-10 h-10 rounded-full', textClass: 'text-sm font-semibold', dimensions: 40 };
    }
  };

  const { containerClass, textClass, dimensions } = getSizeSpecs();
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  if (imageUrl && !imageError) {
    return (
      <View
        className={`overflow-hidden border border-gray-100 ${containerClass} ${className}`}
        style={{ width: dimensions, height: dimensions }}
      >
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-full"
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      className={`items-center justify-center ${containerClass} ${className}`}
      style={{ backgroundColor: bgColor, width: dimensions, height: dimensions }}
    >
      <Text className={`text-white tracking-wide ${textClass}`}>
        {initials}
      </Text>
    </View>
  );
};

export default Avatar;
