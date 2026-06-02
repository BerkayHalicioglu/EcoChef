import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { AnimatedButton } from '@/components/AnimatedButton';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { useGlass } from '@/context/GlassContext';
import { type GlassTokens } from '@/constants/glass';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/I18nContext';

export default function LoginScreen() {
  const router = useRouter();
  const { girisYap, kayitOl } = useAuth();
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { t } = useLocale();

  const [mod, setMod] = useState<'giris' | 'kayit'>('giris');
  const [kadi, setKadi] = useState('');
  const [sifre, setSifre] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const gonder = async () => {
    if (!kadi.trim() || !sifre.trim()) {
      setHata(t('auth.errors.empty'));
      return;
    }
    setYukleniyor(true);
    setHata(null);
    const err = mod === 'giris'
      ? await girisYap(kadi.trim(), sifre)
      : await kayitOl(kadi.trim(), sifre);
    setYukleniyor(false);
    if (err) setHata(err);
    else router.replace('/(tabs)');
  };

  return (
    <GlassScreen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
          <View style={styles.logoKutu}>
            <Feather name="feather" size={52} color={G.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.logoMetin}>EcoChef</Text>
            <Text style={styles.logoAlt}>{t('auth.subtitle')}</Text>
          </View>

          <GlassCard style={styles.kart}>
            <View style={styles.toggle}>
              {(['giris', 'kayit'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={mod === m ? { ...styles.toggleBtn, ...styles.toggleAktif } : styles.toggleBtn}
                  onPress={() => { setMod(m); setHata(null); }}
                >
                  <Text style={mod === m ? { ...styles.toggleMetin, ...styles.toggleMetinAktif } : styles.toggleMetin}>
                    {m === 'giris' ? t('auth.loginTab') : t('auth.registerTab')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder={t('auth.username')}
              placeholderTextColor={G.textLight}
              value={kadi}
              onChangeText={setKadi}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor={G.textLight}
              value={sifre}
              onChangeText={setSifre}
              secureTextEntry
            />

            {hata && <Text style={styles.hata}>{hata}</Text>}

            <AnimatedButton
              style={yukleniyor ? { ...styles.btn, ...styles.btnDisabled } : styles.btn}
              onPress={gonder}
              disabled={yukleniyor}
            >
              {yukleniyor
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnMetni}>{mod === 'giris' ? t('auth.login') : t('auth.register')}</Text>
              }
            </AnimatedButton>
          </GlassCard>

          <TouchableOpacity style={styles.misafir} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.misafirMetni}>{t('auth.guest')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    flex: { flex: 1 },
    center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

    logoKutu: { alignItems: 'center', marginBottom: 32 },
    logoIkon: {},
    logoMetin: { fontSize: 38, fontWeight: '800', color: G.primary, letterSpacing: 1 },
    logoAlt: { fontSize: 14, color: G.textMid, marginTop: 4 },

    kart: { width: '100%', padding: 24, marginBottom: 20 },

    toggle: {
      flexDirection: 'row',
      backgroundColor: G.glassGreen,
      borderRadius: G.radius.pill,
      padding: 4,
      marginBottom: 20,
    },
    toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: G.radius.pill, alignItems: 'center' },
    toggleAktif: { backgroundColor: G.primary },
    toggleMetin: { fontSize: 14, fontWeight: '600', color: G.textMid },
    toggleMetinAktif: { color: '#fff' },

    input: {
      backgroundColor: G.glassGreen,
      borderWidth: 1,
      borderColor: G.glassBorder,
      borderRadius: G.radius.md,
      padding: 14,
      marginBottom: 12,
      fontSize: 15,
      color: G.textDark,
    },

    hata: { color: G.danger, fontSize: 13, marginBottom: 10, textAlign: 'center' },

    btn: {
      backgroundColor: G.glassGreenStrong,
      borderRadius: G.radius.pill,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    btnDisabled: { opacity: 0.6 },
    btnMetni: { color: '#fff', fontSize: 16, fontWeight: '700' },

    misafir: { marginTop: 8 },
    misafirMetni: { color: G.textMid, fontSize: 13 },
  });
}
