import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShop } from '../shop';
import { Button, Screen, colors, s } from '../ui';
export default function Account() {
  const shop = useShop();
  return <Screen title={shop.user ? `Hello, ${shop.user.name.split(' ')[0]}.` : 'One account.\nEverywhere.'} subtitle="YOUR NOVA">
    <View style={s.card}><Ionicons name="person-circle-outline" size={54} color={colors.orange} />
      {shop.user ? <><Text style={s.title}>{shop.user.name}</Text><Text style={s.body}>{shop.user.email}</Text><View style={s.divider} /><Text style={s.body}>Your phone and website share one account and one bag. Your session stays securely saved on this device.</Text><Button secondary disabled={shop.busy} onPress={() => void shop.signOut()}>Sign out on this phone</Button></> : <>
        <Text style={s.title}>Welcome to your NOVA.</Text><Text style={s.body}>Use the same Google account as the website. Your laptop configurations and saved bag will be waiting.</Text>
        {shop.pairing ? <><Text style={s.eyebrow}>MATCH THIS CODE IN YOUR BROWSER</Text><Text style={{ fontSize: 30, letterSpacing: 5, fontWeight: '800' }}>{shop.pairing}</Text><Text style={s.body}>Approve the connection in the browser, then return here. This page will sign in automatically.</Text><Button secondary onPress={shop.cancelSignIn}>Cancel connection</Button></> : <Button onPress={() => void shop.signIn()}>Continue with Google</Button>}
      </>}
    </View>
    <View style={s.card}><Text style={s.title}>Made to move with you.</Text><Text style={s.body}>Configure on your laptop. Pick up on your phone. Every detail, just as you left it.</Text><View style={s.divider} /><Text style={s.tiny}>NOVA Android · Version 1.0 · Student project</Text></View>
  </Screen>;
}
