import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { MaterialSymbols_400Regular } from '@expo-google-fonts/material-symbols';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    MaterialSymbols_400Regular,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#15803d" /></View>;
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.primaryDeep } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </LanguageProvider>
  );
}
