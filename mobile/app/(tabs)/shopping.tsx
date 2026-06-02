import Feather from '@expo/vector-icons/Feather';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedButton } from '@/components/AnimatedButton';
import { GlassCard } from '@/components/GlassCard';
import { GlassScreen } from '@/components/GlassScreen';
import { useGlass } from '@/context/GlassContext';
import { type GlassTokens } from '@/constants/glass';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { useLocale } from '@/context/I18nContext';

const MARKETLER = [
  { isim: 'Migros',   renk: '#F26522', logo: require('@/assets/images/migros.png'),   url: (q: string) => `https://www.migros.com.tr/arama?q=${encodeURIComponent(q)}` },
  { isim: 'Trendyol', renk: '#F27A1A', logo: require('@/assets/images/trendyol.png'), url: (q: string) => `https://www.trendyolmarket.com/arama?q=${encodeURIComponent(q)}` },
  { isim: 'Getir',    renk: '#5C2D91', logo: require('@/assets/images/getir.png'),    url: (q: string) => `https://getir.com/market/search?q=${encodeURIComponent(q)}` },
  { isim: 'A101',     renk: '#E30613', logo: require('@/assets/images/a101.png'),     url: (q: string) => `https://www.a101.com.tr/search?q=${encodeURIComponent(q)}` },
];

export default function AlisverisSayfasi() {
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { liste, ekle, tamamlaToggle, kaldir, duzenle, tamamlananlarisil, tumunuSil, bekleyenSayisi } = useShoppingList();
  const [yeniMalzeme, setYeniMalzeme] = useState('');
  const [marketModalAcik, setMarketModalAcik] = useState(false);
  const [duzenleIsim, setDuzenleIsim] = useState<string | null>(null);
  const [duzenleMetin, setDuzenleMetin] = useState('');
  const inputRef = useRef<TextInput>(null);

  const duzenleyiBaslat = (isim: string) => {
    setDuzenleIsim(isim);
    setDuzenleMetin(isim);
  };

  const duzenleyiKaydet = () => {
    if (duzenleIsim && duzenleMetin.trim()) {
      duzenle(duzenleIsim, duzenleMetin.trim());
    }
    setDuzenleIsim(null);
  };

  const duzenleyiIptal = () => setDuzenleIsim(null);
  const { t } = useLocale();

  const bekleyenler = liste.filter((m) => !m.tamamlandi);
  const tamamlananlar = liste.filter((m) => m.tamamlandi);

  const manuelEkle = () => {
    const temiz = yeniMalzeme.trim();
    if (!temiz) return;
    ekle([temiz]);
    setYeniMalzeme('');
    Keyboard.dismiss();
  };

  const listeyiPaylas = async () => {
    if (bekleyenler.length === 0) return;
    const satirlar = bekleyenler.map((m) => `• ${m.isim}`).join('\n');
    await Share.share({
      message: `🛒 EcoChef Alışveriş Listem\n\n${satirlar}`,
      title: t('shopping.title'),
    });
  };

  const marketteAc = (marketUrl: string) => {
    Linking.openURL(marketUrl).catch(() => {});
  };

  return (
    <GlassScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.baslikSatiri}>
          <View>
            <Text style={styles.baslik}>{t('shopping.title')}</Text>
            <Text style={styles.altBaslik}>
              {bekleyenSayisi > 0 ? t('shopping.pending', { count: bekleyenSayisi }) : t('shopping.empty')}
            </Text>
          </View>
          <View style={styles.aksiyon}>
            {bekleyenler.length > 0 && (
              <AnimatedButton style={styles.paylasButon} onPress={listeyiPaylas}>
                <Text style={styles.paylasMetin}>{t('shopping.share')}</Text>
              </AnimatedButton>
            )}
            {tamamlananlar.length > 0 && (
              <AnimatedButton style={styles.temizleButon} onPress={tamamlananlarisil}>
                <Text style={styles.temizleMetin}>{t('shopping.clearDone')}</Text>
              </AnimatedButton>
            )}
            {liste.length > 0 && (
              <AnimatedButton style={styles.silButon} onPress={() => {
                Alert.alert(t('shopping.deleteConfirm'), t('shopping.deleteQuestion'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: 'Sil', style: 'destructive', onPress: tumunuSil },
                ]);
              }}>
                <Text style={styles.silMetin}>{t('shopping.deleteAll')}</Text>
              </AnimatedButton>
            )}
          </View>
        </View>

        {/* Manuel malzeme ekleme */}
        <GlassCard style={styles.ekleKutu}>
          <TextInput
            ref={inputRef}
            style={styles.ekleInput}
            placeholder={t('shopping.addItem')}
            placeholderTextColor={G.textLight}
            value={yeniMalzeme}
            onChangeText={setYeniMalzeme}
            onSubmitEditing={manuelEkle}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.ekleButon, !yeniMalzeme.trim() && styles.ekleButonPasif]}
            onPress={manuelEkle}
            disabled={!yeniMalzeme.trim()}
          >
            <Text style={styles.ekleButonMetni}>+</Text>
          </TouchableOpacity>
        </GlassCard>

        {liste.length === 0 && (
          <GlassCard style={styles.bos}>
            <Text style={styles.bosIkon}>🛒</Text>
            <Text style={styles.bosMetin}>{t('shopping.emptyCard')}</Text>
            <Text style={styles.bosAlt}>{t('shopping.emptyHint')}</Text>
          </GlassCard>
        )}

        {bekleyenler.map((m) => (
          <GlassCard key={m.isim} style={styles.satir}>
            {duzenleIsim === m.isim ? (
              <>
                <TextInput
                  style={styles.duzenleInput}
                  value={duzenleMetin}
                  onChangeText={setDuzenleMetin}
                  onSubmitEditing={duzenleyiKaydet}
                  returnKeyType="done"
                  autoFocus
                />
                <TouchableOpacity onPress={duzenleyiKaydet} style={styles.duzenleButon}>
                  <Feather name="check" size={18} color={G.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={duzenleyiIptal} style={styles.duzenleButon}>
                  <Feather name="x" size={18} color={G.textLight} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.checkKutu} onPress={() => tamamlaToggle(m.isim)}>
                  <View style={styles.checkBos} />
                </TouchableOpacity>
                <Text style={styles.malzemeAdi}>{m.isim}</Text>
                <TouchableOpacity onPress={() => duzenleyiBaslat(m.isim)} style={styles.kaldirButon}>
                  <Feather name="edit-2" size={15} color={G.textLight} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => kaldir(m.isim)} style={styles.kaldirButon}>
                  <Feather name="x" size={16} color={G.textLight} />
                </TouchableOpacity>
              </>
            )}
          </GlassCard>
        ))}

        {tamamlananlar.length > 0 && (
          <>
            <Text style={styles.tamamlananBaslik}>{t('shopping.inCart')}</Text>
            {tamamlananlar.map((m) => (
              <GlassCard key={m.isim} style={{ ...styles.satir, ...styles.satirTamamlandi }}>
                <TouchableOpacity style={styles.checkKutu} onPress={() => tamamlaToggle(m.isim)}>
                  <View style={styles.checkDolu}>
                    <Text style={styles.checkTik}>✓</Text>
                  </View>
                </TouchableOpacity>
                <Text style={{ ...styles.malzemeAdi, ...styles.malzemeAdiTamamlandi }}>{m.isim}</Text>
                <TouchableOpacity onPress={() => kaldir(m.isim)} style={styles.kaldirButon}>
                  <Feather name="x" size={16} color={G.textLight} />
                </TouchableOpacity>
              </GlassCard>
            ))}
          </>
        )}

        {bekleyenler.length > 0 && (
          <AnimatedButton style={styles.marketCTA} onPress={() => setMarketModalAcik(true)}>
            <View style={styles.marketCTAIc}>
              <View style={styles.marketCTALogolar}>
                {MARKETLER.map((m) => (
                  <Image key={m.isim} source={m.logo} style={styles.marketCTALogo} />
                ))}
              </View>
              <View style={styles.marketCTAMetinler}>
                <Text style={styles.marketCTABaslik}>{t('shopping.market')}</Text>
                <Text style={styles.marketCTAAlt}>
                  {t('shopping.itemCount', { count: bekleyenler.length })}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={G.primary} />
            </View>
          </AnimatedButton>
        )}
      </ScrollView>

      {/* Market Ara Modal */}
      <Modal
        visible={marketModalAcik}
        transparent
        animationType="slide"
        onRequestClose={() => setMarketModalAcik(false)}
      >
        <TouchableOpacity style={styles.modalArkaplan} activeOpacity={1} onPress={() => setMarketModalAcik(false)}>
          <View style={styles.modalKutu} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalBaslik}>{t('shopping.marketSearch')}</Text>
            <Text style={styles.modalAltBaslik}>
              {t('shopping.marketDesc')}
            </Text>

            {/* Market butonları */}
            <View style={styles.marketGrid}>
              {MARKETLER.map((market) => (
                <TouchableOpacity
                  key={market.isim}
                  style={[styles.marketKart, { borderColor: market.renk + '40' }]}
                  onPress={() => {
                    setMarketModalAcik(false);
                    bekleyenler.forEach((m, i) => {
                      setTimeout(() => marketteAc(market.url(m.isim)), i * 400);
                    });
                  }}
                >
                  <Image source={market.logo} style={styles.marketLogo} />
                  <Text style={[styles.marketIsim, { color: market.renk }]}>{market.isim}</Text>
                  <Text style={styles.marketAciklama}>{t('shopping.itemCount', { count: bekleyenler.length })}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tek tek ara bölümü */}
            <Text style={styles.tekilBaslik}>{t('shopping.searchPerItem')}</Text>
            <ScrollView style={styles.tekilListe} showsVerticalScrollIndicator={false}>
              {bekleyenler.map((m) => (
                <View key={m.isim} style={styles.tekilSatir}>
                  <Text style={styles.tekilMalzeme}>{m.isim}</Text>
                  <View style={styles.tekilMarketler}>
                    {MARKETLER.map((market) => (
                      <TouchableOpacity
                        key={market.isim}
                        style={[styles.tekilMarketButon, { backgroundColor: market.renk + '18' }]}
                        onPress={() => marketteAc(market.url(m.isim))}
                      >
                        <Text style={[styles.tekilMarketMetin, { color: market.renk }]}>{market.isim}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.kapat} onPress={() => setMarketModalAcik(false)}>
              <Text style={styles.kapatMetin}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </GlassScreen>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    container: { padding: 20, paddingTop: 60, paddingBottom: 48 },

    baslikSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
    baslik: { fontSize: 32, fontWeight: '800', color: G.primary, marginBottom: 2 },
    altBaslik: { fontSize: 13, color: G.textMid },
    aksiyon: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 200 },

    paylasButon: { backgroundColor: G.glassGreen, borderRadius: G.radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
    paylasMetin: { color: G.primary, fontSize: 12, fontWeight: '700' },
    marketCTA: {
      marginTop: 20,
      borderRadius: G.radius.lg,
      overflow: 'hidden',
      backgroundColor: G.glassGreen,
      borderWidth: 1,
      borderColor: G.glassBorder,
    },
    marketCTAIc: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 18,
      gap: 14,
    },
    marketCTALogolar: { flexDirection: 'row', gap: -8 },
    marketCTALogo: { width: 32, height: 32, borderRadius: 8, borderWidth: 2, borderColor: G.glassWhite },
    marketCTAMetinler: { flex: 1 },
    marketCTABaslik: { fontSize: 15, fontWeight: '800', color: G.textDark },
    marketCTAAlt: { fontSize: 12, color: G.textMid, marginTop: 2 },
    temizleButon: { backgroundColor: G.glassGreen, borderRadius: G.radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
    temizleMetin: { color: G.primary, fontSize: 12, fontWeight: '700' },
    silButon: { backgroundColor: G.primaryMuted, borderRadius: G.radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
    silMetin: { color: G.danger, fontSize: 12, fontWeight: '700' },

    bos: { padding: 40, alignItems: 'center', marginTop: 40 },
    bosIkon: { fontSize: 56, marginBottom: 16 },
    bosMetin: { fontSize: 16, color: G.textDark, fontWeight: '600', marginBottom: 8 },
    bosAlt: { fontSize: 13, color: G.textLight, textAlign: 'center', lineHeight: 20 },

    satir: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 14, gap: 12 },
    satirTamamlandi: { opacity: 0.55 },
    checkKutu: { width: 26, height: 26, justifyContent: 'center', alignItems: 'center' },
    checkBos: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: G.glassBorderDim },
    checkDolu: { width: 22, height: 22, borderRadius: 11, backgroundColor: G.primary, justifyContent: 'center', alignItems: 'center' },
    checkTik: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    malzemeAdi: { flex: 1, fontSize: 15, color: G.textDark, fontWeight: '500' },
    malzemeAdiTamamlandi: { textDecorationLine: 'line-through', color: G.textLight },
    kaldirButon: { paddingHorizontal: 8, paddingVertical: 4 },
    kaldirMetin: { color: G.textLight, fontSize: 14, fontWeight: '700' },

    duzenleInput: { flex: 1, fontSize: 15, color: G.textDark, fontWeight: '500', paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: G.primary },
    duzenleButon: { paddingHorizontal: 6, paddingVertical: 4 },

    tamamlananBaslik: { fontSize: 13, color: G.textLight, fontWeight: '600', marginTop: 16, marginBottom: 8, marginLeft: 4 },

    ekleKutu: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4, paddingVertical: 4, gap: 8 },
    ekleInput: { flex: 1, fontSize: 15, color: G.textDark, paddingHorizontal: 12, paddingVertical: 10 },
    ekleButon: { width: 40, height: 40, borderRadius: 20, backgroundColor: G.primary, alignItems: 'center', justifyContent: 'center' },
    ekleButonPasif: { backgroundColor: G.glassBorder },
    ekleButonMetni: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },

    // Modal
    modalArkaplan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalKutu: {
      backgroundColor: G.glassWhiteStrong,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 36,
      maxHeight: '85%',
      borderTopWidth: 1,
      borderColor: G.glassBorder,
    },
    modalHandle: { width: 40, height: 4, backgroundColor: G.glassBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalBaslik: { fontSize: 20, fontWeight: '800', color: G.textDark, marginBottom: 4 },
    modalAltBaslik: { fontSize: 13, color: G.textMid, marginBottom: 20, lineHeight: 18 },

    marketGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    marketKart: {
      width: '47%',
      borderWidth: 1.5,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 12,
      alignItems: 'center',
      gap: 8,
      backgroundColor: G.glassGreen,
    },
    marketLogo: { width: 56, height: 56, borderRadius: 14 },
    marketIsim: { fontSize: 14, fontWeight: '800', color: G.textDark },
    marketAciklama: { fontSize: 12, color: G.textLight },

    tekilBaslik: { fontSize: 14, fontWeight: '700', color: G.textMid, marginBottom: 10 },
    tekilListe: { maxHeight: 220 },
    tekilSatir: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: G.glassBorder,
      gap: 8,
    },
    tekilMalzeme: { flex: 1, fontSize: 14, color: G.textDark, fontWeight: '500' },
    tekilMarketler: { flexDirection: 'row', gap: 6 },
    tekilMarketButon: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    tekilMarketMetin: { fontSize: 11, fontWeight: '700' },

    kapat: { marginTop: 16, backgroundColor: G.glassGreen, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: G.glassBorder },
    kapatMetin: { fontSize: 15, fontWeight: '600', color: G.textMid },
  });
}
