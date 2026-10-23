import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const ACTIVE = '#176B4D';

export default function TabLayout() {
  const { t } = useLanguage();
  const { userRole } = useAuth();
  const citizen = userRole === 'citizen';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E9E5',
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 7,
          paddingTop: 3,
        },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: '#8B9691',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t('home'), tabBarIcon: ({ color, focused }) => <TabIcon icon="home" color={color} focused={focused} /> }} />
      <Tabs.Screen name="nearby" options={{ href: citizen ? undefined : null, title: t('nearby'), tabBarIcon: ({ color, focused }) => <TabIcon icon="map" color={color} focused={focused} /> }} />
      <Tabs.Screen name="report" options={{ href: userRole === 'collector' || userRole === 'admin' ? null : undefined, title: t('report'), tabBarIcon: ({ color, focused }) => <TabIcon icon="photo_camera" color={color} focused={focused} center={citizen} /> }} />
      <Tabs.Screen name="collect" options={{ href: userRole === 'citizen' || userRole === 'admin' ? null : undefined, title: t('collect'), tabBarIcon: ({ color, focused }) => <TabIcon icon="recycling" color={color} focused={focused} /> }} />
      <Tabs.Screen name="rewards" options={{ href: userRole === 'admin' ? null : undefined, title: t('rewards'), tabBarIcon: ({ color, focused }) => <TabIcon icon="stars" color={color} focused={focused} /> }} />
      <Tabs.Screen name="leaderboard" options={{ href: null, title: t('ranks'), tabBarIcon: ({ color, focused }) => <TabIcon icon="emoji_events" color={color} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('profileTitle'), tabBarIcon: ({ color, focused }) => <TabIcon icon="person" color={color} focused={focused} /> }} />
      <Tabs.Screen name="impact" options={{ href: null, title: t('myImpact'), tabBarIcon: ({ color, focused }) => <TabIcon icon="monitoring" color={color} focused={focused} /> }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: t('notificationsTitle'), tabBarIcon: ({ color, focused }) => <TabIcon icon="notifications" color={color} focused={focused} /> }} />
    </Tabs>
  );
}

function TabIcon({ icon, color, focused, center = false }: { icon: string; color: ColorValue; focused: boolean; center?: boolean }) {
  if (center) {
    return <View style={styles.centerButton}><Text style={styles.centerIcon}>{icon}</Text></View>;
  }
  return (
    <View style={[styles.iconShell, focused && styles.iconShellActive]}>
      <Text style={[styles.iconGlyph, { color, opacity: focused ? 1 : 0.82 }]}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconShell: { minWidth: 35, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  iconShellActive: { backgroundColor: '#DFF7E8' },
  iconGlyph: { fontFamily: 'MaterialSymbols_400Regular', fontSize: 23, lineHeight: 28 },
  centerButton: { width: 58, height: 58, borderRadius: 20, backgroundColor: ACTIVE, alignItems: 'center', justifyContent: 'center', marginTop: -28, borderWidth: 4, borderColor: '#FFFFFF', shadowColor: '#0C4A3C', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 7 },
  centerIcon: { fontFamily: 'MaterialSymbols_400Regular', fontSize: 27, lineHeight: 32, color: Colors.white },
});
