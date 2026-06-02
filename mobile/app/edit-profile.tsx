import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedButton } from '@/components/AnimatedButton';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { Toast } from '@/components/Toast';
import { useToast } from '@/hooks/use-toast';
import { useGlass } from '@/context/GlassContext';
import { type GlassTokens } from '@/constants/glass';
import { useAuth } from '@/context/AuthContext';
import {
  bedenGetir,
  bedenKaydet,
  kaloriHesapla,
  type AktiviteSeviyesi,
  type BedenMetrikleri,
  type Cinsiyet,
} from '@/utils/kalori';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' };

const DIYET_SECENEKLERI = [
  { etiket: 'Vejetaryen', deger: 'vegetarian' },
  { etiket: 'Vegan', deger: 'vegan' },
  { etiket: 'Glutensiz', deger: 'gluten free' },
  { etiket: 'Sütsüz', deger: 'dairy free' },
  { etiket: 'Ketojenik', deger: 'ketogenic' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { kullaniciAdi, token, diyetTercihleri, profilGuncelle } = useAuth();

  const [mevcutSifre, setMevcutSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [diyetYukleniyor, setDiyetYukleniyor] = useState(false);
  const [seciliDiyetler, setSeciliDiyetler] = useState<string[]>(diyetTercihleri);
  const [diyetBasari, setDiyetBasari] = useState<string | null>(null);
  const [diyetHata, setDiyetHata] = useState<string | null>(null);
  const [sifreBasari, setSifreBasari] = useState<string | null>(null);
  const [sifreHata, setSifreHata] = useState<string | null>(null);

  // Fiziksel bilgiler
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>('erkek');
  const [yas, setYas] = useState(25);
  const [boy, setBoy] = useState(170);
  const [kilo, setKilo] = useState(70);
  const [aktivite, setAktivite] = useState<AktiviteSeviyesi>('orta');
  const { toast, goster } = useToast();

  useEffect(() => {
    bedenGetir().then((m) => {
      if (!m) return;
      setCinsiyet(m.cinsiyet);
      setYas(m.yas);
      setBoy(m.boy);
      setKilo(m.kilo);
      setAktivite(m.aktivite);
    });
  }, []);

  const metriks: BedenMetrikleri = { cinsiyet, yas, boy, kilo, aktivite };
  const hesaplanan = kaloriHesapla(metriks);

  const bedenGuncelle = async () => {
    await bedenKaydet(metriks);
    goster(`Günlük hedefiniz ${hesaplanan} kcal olarak güncellendi.`, 'basari');
  };

  const diyetToggle = (deger: string) => {
    setSeciliDiyetler(prev =>
      prev.includes(deger) ? prev.filter(d => d !== deger) : [...prev, deger]
    );
  };

  const diyetKaydet = async () => {
    setDiyetYukleniyor(true);
    setDiyetHata(null);
    setDiyetBasari(null);
    const err = await profilGuncelle(seciliDiyetler);
    setDiyetYukleniyor(false);
    if (err) setDiyetHata(err);
    else setDiyetBasari('Diyet tercihleri güncellendi!');
  };

  const sifreDegistir = async () => {
    setSifreHata(null);
    setSifreBasari(null);

    if (!mevcutSifre || !yeniSifre || !yeniSifreTekrar) {
      setSifreHata('Tüm alanları doldurun.'); return;
    }
    if (yeniSifre.length < 6) {
      setSifreHata('Yeni şifre en az 6 karakter olmalı.'); return;
    }
    if (yeniSifre !== yeniSifreTekrar) {
      setSifreHata('Yeni şifreler eşleşmiyor.'); return;
    }
    if (yeniSifre === mevcutSifre) {
      setSifreHata('Yeni şifre mevcut şifreyle aynı olamaz.'); return;
    }

    setYukleniyor(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/password`, {
        method: 'PUT',
        headers: { ...NGROK_HEADER, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mevcut_sifre: mevcutSifre, yeni_sifre: yeniSifre }),
      });
      const data = await res.json();
      if (res.ok) {
        setSifreBasari('Şifreniz başarıyla güncellendi!');
        setMevcutSifre(''); setYeniSifre(''); setYeniSifreTekrar('');
      } else {
        setSifreHata(data.detail ?? 'Bir hata oluştu.');
      }
    } catch {
      setSifreHata('Sunucuya bağlanılamadı.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <GlassScreen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <AnimatedButton onPress={() => router.back()} style={styles.geriBtn}>
              <Text style={styles.geriMetin}>← Geri</Text>
            </AnimatedButton>
            <Text style={styles.baslik}>Profili Düzenle</Text>
          </View>

          {/* Kullanıcı bilgisi */}
          <GlassCard style={styles.bilgiKart}>
            <View style={styles.avatar}>
              <Text style={styles.avatarMetin}>{kullaniciAdi?.slice(0, 2).toUpperCase() ?? '??'}</Text>
            </View>
            <View>
              <Text style={styles.kullaniciAdi}>{kullaniciAdi}</Text>
              <Text style={styles.kullaniciAlt}>Kullanıcı adı değiştirilemez</Text>
            </View>
          </GlassCard>

          {/* Diyet tercihleri */}
          <GlassCard style={styles.formKart}>
            <Text style={styles.formBaslik}>🥗 Diyet Tercihleri</Text>
            <View style={styles.chipSatiri}>
              {DIYET_SECENEKLERI.map(({ etiket, deger }) => {
                const secili = seciliDiyetler.includes(deger);
                return (
                  <TouchableOpacity
                    key={deger}
                    style={secili ? { ...styles.chip, ...styles.chipSecili } : styles.chip}
                    onPress={() => diyetToggle(deger)}
                  >
                    <Text style={secili ? { ...styles.chipMetin, ...styles.chipMetinSecili } : styles.chipMetin}>
                      {etiket}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {diyetHata && <Text style={styles.hata}>{diyetHata}</Text>}
            {diyetBasari && <Text style={styles.basariMetin}>{diyetBasari}</Text>}
            <AnimatedButton
              style={diyetYukleniyor ? { ...styles.btn, opacity: 0.6 } : styles.btn}
              onPress={diyetKaydet}
              disabled={diyetYukleniyor}
            >
              {diyetYukleniyor
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnMetni}>Tercihleri Kaydet</Text>
              }
            </AnimatedButton>
          </GlassCard>

          {/* Fiziksel Bilgiler */}
          <GlassCard style={{ ...styles.formKart, marginTop: 16 }}>
            <Text style={styles.formBaslik}>Günlük Kalori Hedefi</Text>

            {/* Cinsiyet */}
            <Text style={styles.altBaslik}>Cinsiyet</Text>
            <View style={styles.cinsiyetSatir}>
              {(['erkek', 'kadin'] as Cinsiyet[]).map((c) => {
                const aktif = cinsiyet === c;
                const renk = c === 'erkek' ? '#2196F3' : '#EF7B6B';
                const ikon: React.ComponentProps<typeof Feather>['name'] = c === 'erkek' ? 'user' : 'heart';
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cinsiyetKart, aktif && { borderColor: renk, backgroundColor: renk + '18' }]}
                    onPress={() => setCinsiyet(c)}
                    activeOpacity={0.8}
                  >
                    <Feather name={ikon} size={22} color={aktif ? renk : G.textLight} />
                    <Text style={[styles.cinsiyetMetin, aktif && { color: renk }]}>
                      {c === 'erkek' ? 'Erkek' : 'Kadın'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Yaş / Boy / Kilo */}
            {[
              { label: 'Yaş',        deger: yas,  onChange: setYas,  min: 10, max: 100 },
              { label: 'Boy (cm)',   deger: boy,  onChange: setBoy,  min: 100, max: 250 },
              { label: 'Kilo (kg)',  deger: kilo, onChange: setKilo, min: 30, max: 250 },
            ].map((item) => (
              <View key={item.label} style={styles.olcuSatir}>
                <Text style={styles.olcuLabel}>{item.label}</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => item.onChange(Math.max(item.min, item.deger - 1))}>
                    <Feather name="minus" size={15} color={G.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperDeger}>{item.deger}</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => item.onChange(Math.min(item.max, item.deger + 1))}>
                    <Feather name="plus" size={15} color={G.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Aktivite */}
            <Text style={[styles.altBaslik, { marginTop: 8 }]}>Aktivite Seviyesi</Text>
            <View style={styles.aktiviteGrid}>
              {([
                { key: 'hareketsiz', ikon: 'monitor', etiket: 'Hareketsiz', alt: 'Masa başı' },
                { key: 'az',         ikon: 'wind',    etiket: 'Az Aktif',   alt: 'Haftada 1–3' },
                { key: 'orta',       ikon: 'activity',etiket: 'Orta Aktif', alt: 'Haftada 3–5' },
                { key: 'cok',        ikon: 'zap',     etiket: 'Çok Aktif',  alt: 'Her gün' },
              ] as { key: AktiviteSeviyesi; ikon: React.ComponentProps<typeof Feather>['name']; etiket: string; alt: string }[]).map((a) => {
                const aktif = aktivite === a.key;
                return (
                  <TouchableOpacity
                    key={a.key}
                    style={[styles.aktiviteKart, aktif && styles.aktiviteKartAktif]}
                    onPress={() => setAktivite(a.key)}
                    activeOpacity={0.8}
                  >
                    <Feather name={a.ikon} size={18} color={aktif ? '#fff' : G.textMid} />
                    <Text style={[styles.aktiviteMetin, aktif && { color: '#fff' }]}>{a.etiket}</Text>
                    <Text style={[styles.aktiviteAlt, aktif && { color: 'rgba(255,255,255,0.75)' }]}>{a.alt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sonuç */}
            <LinearGradient
              colors={[G.primary + 'CC', G.primaryLight]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.sonucKart}
            >
              <Feather name="zap" size={16} color="#fff" />
              <Text style={styles.sonucMetin}>Günlük hedefiniz: {hesaplanan} kcal</Text>
            </LinearGradient>

            <AnimatedButton style={styles.btn} onPress={bedenGuncelle}>
              <Text style={styles.btnMetni}>Kalori Hedefini Güncelle</Text>
            </AnimatedButton>
          </GlassCard>

          {/* Şifre değiştirme */}
          <GlassCard style={{ ...styles.formKart, marginTop: 16 }}>
            <Text style={styles.formBaslik}>🔒 Şifre Değiştir</Text>

            <TextInput
              style={styles.input}
              placeholder="Mevcut şifre"
              placeholderTextColor={G.textLight}
              value={mevcutSifre}
              onChangeText={setMevcutSifre}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Yeni şifre (en az 6 karakter)"
              placeholderTextColor={G.textLight}
              value={yeniSifre}
              onChangeText={setYeniSifre}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Yeni şifre tekrar"
              placeholderTextColor={G.textLight}
              value={yeniSifreTekrar}
              onChangeText={setYeniSifreTekrar}
              secureTextEntry
            />

            {sifreHata && <Text style={styles.hata}>{sifreHata}</Text>}
            {sifreBasari && <Text style={styles.basariMetin}>{sifreBasari}</Text>}

            <AnimatedButton
              style={yukleniyor ? { ...styles.btn, opacity: 0.6 } : styles.btn}
              onPress={sifreDegistir}
              disabled={yukleniyor}
            >
              {yukleniyor
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnMetni}>Şifreyi Güncelle</Text>
              }
            </AnimatedButton>
          </GlassCard>

        </ScrollView>
      </KeyboardAvoidingView>
      <Toast mesaj={toast.mesaj} tip={toast.tip} gorunur={toast.gorunur} />
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    container: { padding: 20, paddingTop: 56, paddingBottom: 48 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    geriBtn: { paddingVertical: 4, paddingRight: 8 },
    geriMetin: { fontSize: 16, color: G.primary, fontWeight: '600' },
    baslik: { fontSize: 22, fontWeight: '800', color: G.textDark },

    bilgiKart: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, marginBottom: 16 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: G.glassGreenStrong, alignItems: 'center', justifyContent: 'center' },
    avatarMetin: { color: '#fff', fontSize: 20, fontWeight: '800' },
    kullaniciAdi: { fontSize: 17, fontWeight: '700', color: G.textDark },
    kullaniciAlt: { fontSize: 12, color: G.textLight, marginTop: 2 },

    formKart: { padding: 20 },
    formBaslik: { fontSize: 16, fontWeight: '700', color: G.textDark, marginBottom: 16 },

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
    basariMetin: { color: G.primary, fontSize: 13, fontWeight: '600', marginBottom: 10, textAlign: 'center' },

    btn: { backgroundColor: G.primary, borderRadius: G.radius.pill, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    btnMetni: { color: '#fff', fontSize: 15, fontWeight: '700' },

    chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: G.radius.pill, borderWidth: 1, borderColor: G.glassBorder, backgroundColor: G.glassGreen },
    chipSecili: { backgroundColor: G.primary, borderColor: G.primary },
    chipMetin: { fontSize: 13, color: G.textMid, fontWeight: '600' },
    chipMetinSecili: { color: '#fff' },

    altBaslik: { fontSize: 12, fontWeight: '700', color: G.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

    cinsiyetSatir: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    cinsiyetKart: { flex: 1, borderRadius: G.radius.lg, borderWidth: 1.5, borderColor: G.glassBorder, backgroundColor: G.glassGreen, paddingVertical: 14, alignItems: 'center', gap: 6 },
    cinsiyetMetin: { fontSize: 14, fontWeight: '700', color: G.textMid },

    olcuSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: G.glassGreen, borderRadius: G.radius.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: G.glassBorder, marginBottom: 8 },
    olcuLabel: { fontSize: 14, fontWeight: '600', color: G.textDark },

    stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    stepperBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: G.primaryMuted, alignItems: 'center', justifyContent: 'center' },
    stepperDeger: { width: 42, textAlign: 'center', fontSize: 17, fontWeight: '800', color: G.primary },

    aktiviteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    aktiviteKart: { width: '47%', borderRadius: G.radius.md, borderWidth: 1.5, borderColor: G.glassBorder, backgroundColor: G.glassGreen, padding: 12, alignItems: 'center', gap: 3 },
    aktiviteKartAktif: { backgroundColor: G.primary, borderColor: G.primary },
    aktiviteMetin: { fontSize: 12, fontWeight: '700', color: G.textDark, textAlign: 'center' },
    aktiviteAlt: { fontSize: 11, color: G.textLight, textAlign: 'center' },

    sonucKart: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: G.radius.md, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 14 },
    sonucMetin: { fontSize: 14, fontWeight: '700', color: '#fff' },
  });
}
