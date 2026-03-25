import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const [secilenGorsel, setSecilenGorsel] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState<any>(null);


  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  const fotografSec = async () => {
    let sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!sonuc.canceled) {
      setSecilenGorsel(sonuc.assets[0].uri);
      setSonuc(null); // Yeni fotoğraf seçilince eski sonucu temizle
    }
  };

  const tarifiBul = async () => {
    if (!secilenGorsel) return;

    setYukleniyor(true);
    
    // Fotoğrafı backend'in anlayacağı "form-data" formatına çeviriyoruz
    const formData = new FormData();
    formData.append('file', {
      uri: secilenGorsel,
      name: 'malzeme.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setSonuc(data);
      } else {
        Alert.alert("Hata", "Backend'den bir hata döndü.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Bağlantı Hatası", "Backend'e ulaşılamadı. IP adresini ve sunucunun açık olduğunu kontrol et.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.baslik}>EcoChef 🧑‍🍳</Text>

      {secilenGorsel && (
        <Image source={{ uri: secilenGorsel }} style={styles.gorsel} />
      )}

      <TouchableOpacity style={styles.butonGrisi} onPress={fotografSec}>
        <Text style={styles.butonMetni}>Galeriden Fotoğraf Seç</Text>
      </TouchableOpacity>

      {/* Fotoğraf seçildiyse Analiz Et butonunu göster */}
      {secilenGorsel && (
        <TouchableOpacity style={styles.butonTuruncu} onPress={tarifiBul} disabled={yukleniyor}>
          {yukleniyor ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.butonMetni}>Yapay Zeka ile Analiz Et 🚀</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Backend'den sonuç gelirse ekrana yazdır */}
      {sonuc && (
        <View style={styles.sonucKutusu}>
          <Text style={styles.sonucBaslik}>Bulunan Malzemeler:</Text>
          <Text>{sonuc.tespit_edilen_malzemeler?.join(", ") || "Malzeme bulunamadı."}</Text>
          
          <Text style={[styles.sonucBaslik, {marginTop: 10}]}>Önerilen İlk Tarif:</Text>
          <Text style={{fontWeight: 'bold'}}>
            {sonuc.bulunan_tarifler && sonuc.bulunan_tarifler.length > 0 
              ? sonuc.bulunan_tarifler[0].isim 
              : "Tarif bulunamadı."}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20 },
  baslik: { fontSize: 28, fontWeight: 'bold', color: '#2e7d32', marginBottom: 20 },
  gorsel: { width: 300, height: 225, borderRadius: 15, marginBottom: 20 },
  butonGrisi: { backgroundColor: '#7f8c8d', padding: 15, borderRadius: 25, width: '80%', alignItems: 'center', marginBottom: 15 },
  butonTuruncu: { backgroundColor: '#ff9800', padding: 15, borderRadius: 25, width: '80%', alignItems: 'center', elevation: 3 },
  butonMetni: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sonucKutusu: { marginTop: 20, padding: 15, backgroundColor: '#fff', borderRadius: 10, width: '90%', elevation: 2 },
  sonucBaslik: { fontSize: 16, fontWeight: 'bold', color: '#333' }
});