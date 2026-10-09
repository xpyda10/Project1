import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ShopProvider, useShop } from '../shop';
import { colors } from '../ui';
function Navigation() {
  const { items } = useShop();
  const count = items.reduce((n, i) => n + i.quantity, 0);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.orange, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.line }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
    <Tabs.Screen name="bag" options={{ title: 'Your bag', tabBarBadge: count || undefined, tabBarBadgeStyle: { backgroundColor: colors.orange }, tabBarIcon: ({ color, size }) => <Ionicons name="bag-handle-outline" size={size} color={color} /> }} />
    <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    <Tabs.Screen name="checkout" options={{ href: null }} />
  </Tabs>;
}
export default function Layout() { return <ShopProvider><StatusBar style="dark" /><Navigation /></ShopProvider>; }
