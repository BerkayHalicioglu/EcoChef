import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function bildirimIzniIste(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

const ogunTurkce: Record<string, string> = {
  kahvalti: 'kahvaltıda',
  ogle: 'öğlede',
  aksam: 'akşamda',
};

// Her öğün için hatırlatıcı saati: [saat, dakika]
const ogunSaati: Record<string, [number, number]> = {
  kahvalti: [7, 30],
  ogle: [11, 30],
  aksam: [18, 0],
};

export async function ogunBildirimiZamanla(tarih: string, ogun: string, tarifAdi: string) {
  const [yil, ay, gun] = tarih.split('-').map(Number);
  const [saat, dakika] = ogunSaati[ogun] ?? [8, 0];
  const bildirimZamani = new Date(yil, ay - 1, gun, saat, dakika, 0);
  if (bildirimZamani <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🍽 Bugünkü yemek planın hazır!',
      body: `${ogunTurkce[ogun] ?? ogun} ${tarifAdi} var. Afiyet olsun!`,
      data: { tarih, ogun },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: bildirimZamani,
    },
  });
}
