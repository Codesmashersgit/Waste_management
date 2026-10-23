import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container} accessibilityRole="tablist" accessibilityLabel="Choose language">
      {(['en', 'hi'] as const).map((item) => {
        const selected = language === item;
        const label = item === 'en' ? 'English' : 'हिंदी';
        return (
          <TouchableOpacity
            key={item}
            onPress={() => setLanguage(item)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            style={[styles.option, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 3, borderRadius: 14, borderColor: Colors.cardBorder, borderWidth: 1, backgroundColor: Colors.primaryMid },
  option: { minHeight: 36, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 11 },
  selected: { backgroundColor: Colors.primary },
  label: { color: Colors.textMuted, fontWeight: '700', fontSize: 12 },
  selectedLabel: { color: Colors.white },
});
