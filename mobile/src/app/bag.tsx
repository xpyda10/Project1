import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { configured, keyOf, money, SITE, useShop } from '../shop';
import { Button, Screen, colors, s } from '../ui';
export default function Bag() {
  const shop = useShop();
  const lines = shop.items.flatMap(i => { const p = shop.products.find(p => p.id === i.id); return p ? [{ ...i, product: p, build: configured(p, i.config) }] : []; });
  const subtotal = lines.reduce((n, l) => n + l.build.price * l.quantity, 0);
  return <Screen title="Good choices." subtitle="YOUR BAG">
    <Text style={s.body}>{shop.user ? 'The same bag, wherever you shop. Changes appear automatically on your website and phone.' : 'Sign in with the same Google account you use on NOVA to see your saved bag.'}</Text>
    {!shop.user ? <Button onPress={() => router.push('/account')}>Sign in to your account</Button> : !lines.length ? <View style={s.card}><Ionicons name="bag-handle-outline" size={44} color={colors.orange} /><Text style={s.title}>Room for possibility.</Text><Text style={s.body}>Find your next laptop and make it yours.</Text><Button onPress={() => router.push('/')}>Explore laptops</Button></View> : <>
      {lines.map(l => <View key={keyOf(l)} style={s.card}>
        <Image source={{ uri: SITE + l.product.image }} style={{ width: '100%', height: 150 }} resizeMode="contain" />
        <Text style={s.title}>{l.product.name}</Text><Text style={s.body}>{l.build.labels.join(' · ')}</Text>
        <View style={s.row}><View style={[s.row, { borderWidth: 1, borderColor: colors.line, borderRadius: 12, gap: 5 }]}>
          <Pressable accessibilityLabel="Decrease quantity" disabled={shop.busy} onPress={() => void shop.save(shop.items.flatMap(i => keyOf(i) !== keyOf(l) ? [i] : i.quantity > 1 ? [{ ...i, quantity: i.quantity - 1 }] : []))} style={{ padding: 14 }}><Ionicons name={l.quantity === 1 ? 'trash-outline' : 'remove'} size={18} /></Pressable>
          <Text>{l.quantity}</Text><Pressable accessibilityLabel="Increase quantity" disabled={shop.busy || l.quantity >= 10} onPress={() => void shop.save(shop.items.map(i => keyOf(i) === keyOf(l) ? { ...i, quantity: i.quantity + 1 } : i))} style={{ padding: 14 }}><Ionicons name="add" size={18} /></Pressable>
        </View><Text style={s.price}>{money(l.build.price * l.quantity)}</Text></View>
      </View>)}
      <View style={s.card}><View style={s.row}><Text style={s.body}>Subtotal</Text><Text style={s.price}>{money(subtotal)}</Text></View><Text style={s.body}>Delivery calculated at checkout.</Text><Button disabled={shop.busy} onPress={() => router.push('/checkout')}>Continue to checkout →</Button><Text style={s.tiny}>Demo checkout. No payment or physical shipment.</Text></View>
    </>}
  </Screen>;
}
