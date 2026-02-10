import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface CustomBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function CustomBadge({ children, variant = 'default', size = 'md', style }: CustomBadgeProps) {
  const variantStyles = {
    default: styles.defaultVariant,
    outline: styles.outlineVariant,
    success: styles.successVariant,
    warning: styles.warningVariant,
    error: styles.errorVariant,
    info: styles.infoVariant,
  };

  const textVariantStyles = {
    default: styles.defaultText,
    outline: styles.outlineText,
    success: styles.successText,
    warning: styles.warningText,
    error: styles.errorText,
    info: styles.infoText,
  };

  const sizeStyles = size === 'sm' ? styles.small : styles.medium;
  const textSizeStyles = size === 'sm' ? styles.smallText : styles.mediumText;

  return (
    <View style={[styles.badge, variantStyles[variant], sizeStyles, style]}>
      <Text style={[styles.text, textVariantStyles[variant], textSizeStyles]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 11,
  },
  mediumText: {
    fontSize: 12,
  },
  defaultVariant: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  defaultText: {
    color: '#374151',
  },
  outlineVariant: {
    backgroundColor: 'transparent',
    borderColor: '#E5E7EB',
  },
  outlineText: {
    color: '#6B7280',
  },
  successVariant: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  successText: {
    color: '#065F46',
  },
  warningVariant: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  warningText: {
    color: '#92400E',
  },
  errorVariant: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
  },
  infoVariant: {
    backgroundColor: '#DBEAFE',
    borderColor: '#BFDBFE',
  },
  infoText: {
    color: '#1E40AF',
  },
});
