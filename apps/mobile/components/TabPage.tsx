import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { LanguageToggle } from './LanguageToggle';

export function TabPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brand}>WASTE-CHAiN</Text>
          <LanguageToggle />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function InfoCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export const pageStyles = StyleSheet.create({
  bodyText: { color: Colors.textMuted, fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 22 },
  cardTitle: { color: Colors.text, fontFamily: 'Manrope_700Bold', fontSize: 19, letterSpacing: -0.25, marginBottom: 4 },
  muted: { color: Colors.textDim, fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 20 },
  pill: { borderRadius: 15, backgroundColor: Colors.primary, paddingVertical: 15, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  pillText: { color: Colors.white, fontFamily: 'Manrope_700Bold', fontSize: 15, letterSpacing: 0.1 },
  input: { color: Colors.text, backgroundColor: Colors.primaryMid, borderColor: Colors.cardBorder, borderWidth: 1, borderRadius: 14, minHeight: 52, paddingHorizontal: 15, fontFamily: 'DMSans_600SemiBold', fontSize: 14 },
  label: { color: Colors.textMuted, fontFamily: 'Manrope_700Bold', fontSize: 12, letterSpacing: 0.35, marginBottom: 7, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primaryDeep },
  content: { paddingHorizontal: 21, paddingTop: 14, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  brand: { color: Colors.primaryLight, fontFamily: 'Manrope_800ExtraBold', letterSpacing: 1.4, fontSize: 12 },
  title: { color: Colors.text, fontFamily: 'Manrope_700Bold', fontSize: 29, lineHeight: 37, letterSpacing: -0.45 },
  subtitle: { color: Colors.textDim, fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 21, marginTop: 4 },
  body: { gap: 14, marginTop: 21 },
  card: { backgroundColor: Colors.card, borderColor: Colors.cardBorder, borderWidth: 1, borderRadius: 21, padding: 17, gap: 10 },
});
