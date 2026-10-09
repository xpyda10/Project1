import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SITE, configured, defaults, keyOf, money, useShop, type Product, type Configuration } from '../shop';
import { Button, Screen, colors, s } from '../ui';
export default function Discover() {
  const shop = useShop();
  const [series, setSeries] = useState('All');
  const [product, setProduct] = useState<Product | null>(null);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [message, setMessage] = useState('');
  async function add() {
    if (!product || !config) return;
    if (!shop.user) { setProduct(null); router.push('/account'); return; }
    const next = { id: product.id, quantity: 1, config };
    const found = shop.items.find(i => keyOf(i) === keyOf(next));
    if (found && found.quantity >= 10) { setMessage('You can add up to 10 of each build.'); return; }
    const items = found ? shop.items.map(i => keyOf(i) === keyOf(next) ? { ...i, quantity: i.quantity + 1 } : i) : [...shop.items, next];
    if (await shop.save(items)) { setProduct(null); router.push('/bag'); }
    else setMessage('Your bag could not be saved. Close this panel to see the details, then try again.');
  }
  return <Screen title={'Your next chapter.\nYour next laptop.'} subtitle="BUILT AROUND YOU">
    <Text style={s.body}>Considered design. Serious performance. A laptop that fits the way you work.</Text>
    <View style={{ backgroundColor: '#222a25', borderRadius: 24, overflow: 'hidden', padding: 22 }}>
      <Text style={{ color: '#b9c6b8', fontSize: 10, letterSpacing: 2 }}>MEET THE NOVA COLLECTION</Text>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 14 }}>Less ordinary.{ '\n' }More possibility.</Text>
      {shop.products[0] && <Image source={{ uri: SITE + shop.products[0].image }} style={{ height: 190, width: '100%', marginVertical: 8 }} resizeMode="contain" />}
      <View style={s.row}><Text style={{ color: '#cbd6c9', fontSize: 12 }}>Configure it. Make it yours.</Text><Ionicons name="arrow-forward" size={22} color="#fff" /></View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {['All', 'Air', 'Studio', 'Arc'].map(value => <Pressable key={value} onPress={() => setSeries(value)} style={[s.pill, series === value && { backgroundColor: colors.ink, borderColor: colors.ink }]}><Text style={{ color: series === value ? '#fff' : colors.ink, fontWeight: '600' }}>{value === 'All' ? 'All laptops' : value}</Text></Pressable>)}
    </ScrollView>
    {shop.products.filter(p => series === 'All' || p.series === series).map(p => <View key={p.id} style={s.card}>
      <View style={s.row}><Text style={[s.eyebrow, { marginTop: 0 }]}>{p.series.toUpperCase()} SERIES</Text><Text style={s.tiny}>{p.display}</Text></View>
      <Image source={{ uri: SITE + p.image }} style={{ width: '100%', height: 185, backgroundColor: '#f7f8f3', borderRadius: 14 }} resizeMode="contain" />
      <Text style={s.title}>{p.name}</Text><Text style={s.body}>{p.tagline}</Text>
      <View style={s.row}><View><Text style={s.tiny}>Starting at</Text><Text style={s.price}>{money(p.price)}</Text></View><Button onPress={() => { setProduct(p); setConfig(defaults(p)); setMessage(''); }}>Build yours ↗</Button></View>
    </View>)}
    <Text style={[s.tiny, { textAlign: 'center', lineHeight: 19 }]}>Designed for your everyday extraordinary.{ '\n' }Bootcamp demo · Sample laptops · No payment collected</Text>
    <Modal visible={!!product} animationType="slide" onRequestClose={() => !shop.busy && setProduct(null)}>
      <SafeAreaView style={s.screen}>
        <View style={s.top}><Text style={s.brand}>Make it yours.</Text><Pressable accessibilityLabel="Close configurator" onPress={() => !shop.busy && setProduct(null)} style={{ padding: 10 }}><Ionicons name="close" size={26} /></Pressable></View>
        {product && config && <ScrollView contentContainerStyle={s.content}>
          <Image source={{ uri: SITE + product.image }} style={{ width: '100%', height: 200 }} resizeMode="contain" />
          <Text style={s.title}>{product.name}</Text><Text style={s.body}>{product.description}</Text>
          {(['cpu', 'memory', 'storage'] as const).map((key, index) => <View key={key} style={{ gap: 9 }}>
            <Text style={s.eyebrow}>0{index + 1} / {key === 'cpu' ? 'PROCESSOR' : key === 'memory' ? 'MEMORY' : 'STORAGE'}</Text>
            {product.options[key].map(o => <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ selected: config[key] === o.id }} onPress={() => setConfig({ ...config, [key]: o.id })} style={[s.card, { padding: 16, borderColor: config[key] === o.id ? colors.orange : colors.line, backgroundColor: config[key] === o.id ? '#fff2ec' : '#fff' }]}>
              <View style={s.row}><Text style={{ fontWeight: '700', flex: 1 }}>{o.label}</Text><Text style={s.tiny}>{o.delta ? '+' + money(o.delta) : 'Included'}</Text><Ionicons name={config[key] === o.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={config[key] === o.id ? colors.orange : colors.muted} /></View><Text style={s.tiny}>{o.detail}</Text>
            </Pressable>)}
          </View>)}
          {!!message && <Text style={{ color: '#962f20' }}>{message}</Text>}
          <View style={s.row}><Text style={s.body}>Your build</Text><Text style={s.price}>{money(configured(product, config).price)}</Text></View>
          <Button onPress={() => void add()} disabled={shop.busy}>{shop.busy ? 'Saving your build…' : shop.user ? 'Add to your bag' : 'Sign in to save your build'}</Button>
        </ScrollView>}
      </SafeAreaView>
    </Modal>
  </Screen>;
}
