import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from './shop';
export const colors = { ink: '#202321', muted: '#727771', orange: '#f15b35', paper: '#f5f5ef', line: '#e0e3da' };
export function Button({ children, onPress, disabled, secondary = false }: { children: React.ReactNode; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && { backgroundColor: colors.ink }, { opacity: disabled ? .45 : pressed ? .75 : 1 }]}><Text style={s.buttonText}>{children}</Text></Pressable>;
}
export function Screen({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const shop = useShop();
  return <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
    <View style={s.top}><Text style={s.brand}>nova<Text style={{ color: colors.orange }}>®</Text></Text><View style={s.status}><View style={[s.dot, { backgroundColor: shop.connected ? '#52875e' : '#b2b6ab' }]} /><Text style={s.tiny}>{shop.user ? shop.connected ? 'Bag connected' : 'Reconnecting…' : 'Made for you'}</Text></View></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>{subtitle}</Text><Text style={s.heading}>{title}</Text>
      {!!shop.error && <View style={s.error}><Text style={{ color: '#962f20' }}>{shop.error}</Text><Pressable onPress={() => void shop.refresh().catch(() => {})}><Text style={[s.link, { marginTop: 8 }]}>Try refreshing</Text></Pressable></View>}
      {shop.loading ? <ActivityIndicator size="large" color={colors.orange} /> : children}
    </ScrollView>
  </SafeAreaView>;
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.line },
  brand: { fontSize: 34, fontWeight: '900', letterSpacing: -2, color: colors.ink },
  status: { flexDirection: 'row', alignItems: 'center', gap: 7 }, dot: { width: 6, height: 6, borderRadius: 3 }, tiny: { color: colors.muted, fontSize: 11 },
  content: { padding: 24, paddingBottom: 38, gap: 16 },
  eyebrow: { color: colors.orange, letterSpacing: 2, fontSize: 10, fontWeight: '800', marginTop: 8 },
  heading: { color: colors.ink, fontSize: 40, lineHeight: 43, fontWeight: '800', letterSpacing: -1.7, marginBottom: 4 },
  title: { color: colors.ink, fontSize: 24, fontWeight: '700', letterSpacing: -.6 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 20, gap: 14, borderWidth: 1, borderColor: '#e9eae4' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  button: { minHeight: 52, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.orange, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  link: { color: colors.orange, fontWeight: '700', fontSize: 14 },
  price: { color: colors.ink, fontSize: 25, fontWeight: '700', letterSpacing: -.7 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 6 },
  pill: { borderWidth: 1, borderColor: colors.line, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  error: { borderRadius: 12, backgroundColor: '#ffe8e1', padding: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 14, color: colors.ink, fontSize: 16 },
});
