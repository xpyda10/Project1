import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { money, useShop } from '../shop';
import { Button, Screen, s } from '../ui';
export default function Checkout() {
  const shop = useShop();
  const [details, setDetails] = useState<Record<string, string>>({ email: shop.user?.email || '', name: shop.user?.name || '', address: '', city: '', postalCode: '', country: '' });
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ id: string; total: number; emailStatus: string } | null>(null);
  const key = useRef('');
  async function submit() {
    key.current ||= Crypto.randomUUID(); setError('');
    try { setResult(await shop.checkout(details, key.current)); }
    catch (e) { setError((e as Error).message); }
  }
  return <Screen title={result ? 'All yours.' : 'The final details.'} subtitle={result ? 'ORDER RECEIVED' : 'DEMO CHECKOUT'}>
    {result ? <View style={s.card}><Text style={s.title}>Thank you for your order.</Text><Text style={s.body}>Reference {result.id.slice(0, 8).toUpperCase()}</Text><Text style={s.price}>{money(result.total)}</Text><Text style={s.body}>{result.emailStatus === 'sent' ? 'Your confirmation email has been sent.' : 'Your order is saved. Email confirmation is pending or unavailable.'}</Text><Text style={s.body}>This is a student demonstration. No payment was collected and nothing will be shipped.</Text><Button onPress={() => router.push('/')}>Back to the collection</Button></View> : <>
      <Text style={s.body}>No payment will be collected. Use a fictional delivery address for your class demonstration.</Text>
      {(['name', 'email', 'address', 'city', 'postalCode', 'country'] as const).map(field => <View key={field} style={{ gap: 6 }}><Text style={s.body}>{field === 'postalCode' ? 'Postal code' : field[0].toUpperCase() + field.slice(1)}</Text><TextInput accessibilityLabel={field} value={details[field]} onChangeText={value => setDetails({ ...details, [field]: value })} style={s.input} autoCapitalize={field === 'email' ? 'none' : 'words'} keyboardType={field === 'email' ? 'email-address' : 'default'} maxLength={field === 'email' ? 254 : 200} /></View>)}
      {!!error && <Text style={{ color: '#962f20' }}>{error}</Text>}
      <Button onPress={() => void submit()} disabled={shop.busy || !shop.items.length || !shop.user}>{shop.busy ? 'Placing your order…' : 'Place demo order'}</Button>
    </>}
  </Screen>;
}
