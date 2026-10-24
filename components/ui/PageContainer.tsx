import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';

export interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
  className?: string;
}

/**
 * Responsive PageContainer that centers content on web/desktop viewports
 * with a sensible maximum width, while allowing full-width behavior on mobile.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 1140,
  style,
  className = '',
}) => {
  return (
    <View
      style={[
        styles.base,
        Platform.OS === 'web' ? { maxWidth } : null,
        style,
      ]}
      className={`w-full ${className}`}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    marginHorizontal: 'auto',
  },
});

export default PageContainer;
