import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGlass } from '@/context/GlassContext';
import { useLocale } from '@/context/I18nContext';
import { type GlassTokens } from '@/constants/glass';
import type { OgunTipi } from '@/hooks/use-meal-plan';

const GUN_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const OGUNLER: { key: OgunTipi; i18nKey: string; ikon: 'sun' | 'cloud' | 'moon' }[] = [
  { key: 'kahvalti', i18nKey: 'plan.meals.breakfast', ikon: 'sun' },
  { key: 'ogle', i18nKey: 'plan.meals.lunch', ikon: 'cloud' },
  { key: 'aksam', i18nKey: 'plan.meals.dinner', ikon: 'moon' },
];

function haftaBasi(): Date {
  const d = new Date();
  const gun = d.getDay();
  const fark = gun === 0 ? -6 : 1 - gun;
  d.setDate(d.getDate() + fark);
  d.setHours(0, 0, 0, 0);
  return d;
}

function gunTarih(basi: Date, index: number): string {
  const d = new Date(basi);
  d.setDate(d.getDate() + index);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${g}`;
}

function gunEtiket(basi: Date, index: number, locale: string): string {
  const d = new Date(basi);
  d.setDate(d.getDate() + index);
  return d.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' });
}

type Props = {
  gorunur: boolean;
  onKapat: () => void;
  onEkle: (tarih: string, ogun: OgunTipi) => void;
};

export function PlanEkleModal({ gorunur, onKapat, onEkle }: Props) {
  const G = useGlass();
  const styles = useMemo(() => makeStyles(G), [G]);
  const { t, locale } = useLocale();
  const [secilenGun, setSecilenGun] = useState(0);
  const [secilenOgun, setSecilenOgun] = useState<OgunTipi>('ogle');
  const basi = haftaBasi();

  const handleKapat = () => {
    setSecilenGun(0);
    setSecilenOgun('ogle');
    onKapat();
  };

  const handleEkle = () => {
    onEkle(gunTarih(basi, secilenGun), secilenOgun);
    handleKapat();
  };

  return (
    <Modal visible={gorunur} transparent animationType="slide" onRequestClose={handleKapat}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleKapat}>
        <TouchableOpacity style={styles.panel} activeOpacity={1}>
          <View style={styles.handle} />
          <Text style={styles.baslik}>{t('plan.modal.title')}</Text>

          <Text style={styles.altBaslik}>{t('plan.modal.selectDay')}</Text>
          <View style={styles.chipSatiri}>
            {GUN_KEYS.map((key, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.gunChip, secilenGun === i && styles.chipAktif]}
                onPress={() => setSecilenGun(i)}
              >
                <Text style={[styles.gunAdi, secilenGun === i && styles.chipMetinAktif]}>
                  {t(`plan.days.${key}`)}
                </Text>
                <Text style={[styles.gunTarih, secilenGun === i && styles.chipMetinAktif]}>
                  {gunEtiket(basi, i, locale)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.altBaslik}>{t('plan.modal.selectMeal')}</Text>
          <View style={styles.ogunSatiri}>
            {OGUNLER.map((o) => (
              <TouchableOpacity
                key={o.key}
                style={[styles.ogunChip, secilenOgun === o.key && styles.chipAktif]}
                onPress={() => setSecilenOgun(o.key)}
              >
                <Feather name={o.ikon} size={20} color={secilenOgun === o.key ? '#fff' : G.textMid} />
                <Text style={[styles.ogunMetin, secilenOgun === o.key && styles.chipMetinAktif]}>
                  {t(o.i18nKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.ekleButon} onPress={handleEkle}>
            <Text style={styles.ekleButonMetin}>{t('plan.modal.add')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function makeStyles(G: GlassTokens) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    panel: {
      backgroundColor: G.glassWhite,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    handle: {
      width: 40, height: 4, backgroundColor: G.glassBorder,
      borderRadius: 2, alignSelf: 'center', marginBottom: 16,
    },
    baslik: { fontSize: 20, fontWeight: 'bold', color: G.primary, marginBottom: 20, textAlign: 'center' },
    altBaslik: { fontSize: 13, fontWeight: '700', color: G.textLight, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

    chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    gunChip: {
      alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8,
      borderRadius: 12, borderWidth: 1.5, borderColor: G.glassBorder,
      backgroundColor: G.glassGreen, minWidth: 44,
    },
    gunAdi: { fontSize: 13, fontWeight: '700', color: G.textDark },
    gunTarih: { fontSize: 10, color: G.textLight, marginTop: 2 },

    ogunSatiri: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    ogunChip: {
      flex: 1, alignItems: 'center', paddingVertical: 12,
      borderRadius: 14, borderWidth: 1.5, borderColor: G.glassBorder,
      backgroundColor: G.glassGreen,
    },
    ogunMetin: { fontSize: 13, fontWeight: '600', color: G.textDark },

    chipAktif: { backgroundColor: G.primary, borderColor: G.primary },
    chipMetinAktif: { color: '#fff' },

    ekleButon: {
      backgroundColor: G.primary, borderRadius: G.radius.pill, paddingVertical: 14,
      alignItems: 'center',
    },
    ekleButonMetin: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
