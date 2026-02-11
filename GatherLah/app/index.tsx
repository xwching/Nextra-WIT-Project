import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { AppColors } from '@/constants/colors';

export default function IndexScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Direct auth state check with timeout fallback
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/sign-in');
      }
      setReady(true);
    });

    // Fallback: if auth state never fires, go to sign-in after 3 seconds
    const timeout = setTimeout(() => {
      if (!ready) {
        console.warn('Auth state check timed out, redirecting to sign-in');
        router.replace('/auth/sign-in');
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={AppColors.primary.main} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
