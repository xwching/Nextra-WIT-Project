// Modern Color Theme for GatherLah
export const AppColors = {
  // Primary Brand Colors - Vibrant Purple/Blue Gradient
  primary: {
    main: '#7C3AED', // Vibrant Purple
    light: '#A78BFA',
    dark: '#5B21B6',
    gradient: ['#7C3AED', '#3B82F6'] as const, // Purple to Blue
  },

  // Secondary Colors - Energetic Orange/Pink
  secondary: {
    main: '#F59E0B', // Warm Orange
    light: '#FCD34D',
    dark: '#D97706',
    gradient: ['#F59E0B', '#EF4444'] as const, // Orange to Red
  },

  // Accent Colors - Fresh Teal/Green
  accent: {
    main: '#10B981', // Emerald Green
    light: '#6EE7B7',
    dark: '#059669',
    gradient: ['#10B981', '#06B6D4'] as const, // Green to Cyan
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FE', // Soft Purple Tint
    tertiary: '#F0F4FF', // Light Blue Tint
    dark: '#1F2937',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    light: '#FFFFFF',
    purple: '#7C3AED',
    blue: '#3B82F6',
  },

  // Status Colors
  status: {
    online: '#10B981',
    away: '#F59E0B',
    busy: '#EF4444',
    offline: '#9CA3AF',
  },

  // Card Gradients
  gradients: {
    purple: ['#7C3AED', '#A78BFA'] as const,
    blue: ['#3B82F6', '#60A5FA'] as const,
    pink: ['#EC4899', '#F472B6'] as const,
    orange: ['#F59E0B', '#FBBF24'] as const,
    green: ['#10B981', '#34D399'] as const,
    teal: ['#06B6D4', '#22D3EE'] as const,
    sunset: ['#F59E0B', '#EC4899', '#7C3AED'] as const,
    ocean: ['#06B6D4', '#3B82F6', '#7C3AED'] as const,
  },

  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },

  // Shadow Colors
  shadow: {
    light: 'rgba(124, 58, 237, 0.1)',
    medium: 'rgba(124, 58, 237, 0.2)',
    dark: 'rgba(124, 58, 237, 0.3)',
  },
};

// Category Colors - Vibrant & Distinct
export const CategoryColors = {
  creative: {
    main: '#EC4899', // Pink
    bg: '#FCE7F3',
    light: '#FBCFE8',
  },
  tech: {
    main: '#3B82F6', // Blue
    bg: '#DBEAFE',
    light: '#BFDBFE',
  },
  games: {
    main: '#8B5CF6', // Purple
    bg: '#EDE9FE',
    light: '#DDD6FE',
  },
  social: {
    main: '#10B981', // Green
    bg: '#D1FAE5',
    light: '#A7F3D0',
  },
  learning: {
    main: '#F59E0B', // Orange
    bg: '#FEF3C7',
    light: '#FDE68A',
  },
  activity: {
    main: '#EF4444', // Red
    bg: '#FEE2E2',
    light: '#FECACA',
  },
  community: {
    main: '#06B6D4', // Cyan
    bg: '#CFFAFE',
    light: '#A5F3FC',
  },
};
