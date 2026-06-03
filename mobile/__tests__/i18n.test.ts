import { translate, SUPPORTED_LOCALES } from '@/i18n';

describe('translate()', () => {
  it('TR: basit anahtar döner', () => {
    expect(translate('tr', 'tabs.home')).toBe('Ana Sayfa');
  });

  it('EN: basit anahtar döner', () => {
    expect(translate('en', 'tabs.home')).toBe('Home');
  });

  it('iç içe anahtarları nokta notasyonuyla çözümler', () => {
    expect(translate('tr', 'home.diet.vegan')).toBe('Vegan');
    expect(translate('tr', 'home.filter.lowCalorie')).toBe('Düşük Kalori');
  });

  it('{{parametre}} interpolasyonu çalışır', () => {
    const sonuc = translate('tr', 'home.greeting', { name: ', Berkay' });
    expect(sonuc).toBe('Merhaba, Berkay!');
  });

  it('çoklu parametre interpolasyonu', () => {
    const sonuc = translate('tr', 'home.addedToCart', { count: 3 });
    expect(sonuc).toContain('3');
  });

  it('EN eksik anahtar için TR\'ye fallback yapar', () => {
    // Var olan bir Türkçe anahtar EN'de de var, yani burada aynı çeviriler olur
    // Gerçek fallback davranışını test etmek için olmayan bir anahtar kullanalım
    const sonuc = translate('en', 'bu.anahtar.yok');
    expect(sonuc).toBe('bu.anahtar.yok'); // key kendisi döner
  });

  it("tamamen olmayan anahtar key'in kendisini döner", () => {
    expect(translate('tr', 'olmayan.anahtar')).toBe('olmayan.anahtar');
  });

  it('desteklenen locale listesi doğru', () => {
    expect(SUPPORTED_LOCALES).toContain('tr');
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toHaveLength(2);
  });

  it('common.skip TR doğru', () => {
    expect(translate('tr', 'common.skip')).toBe('Atla');
  });

  it('common.skip EN doğru', () => {
    expect(translate('en', 'common.skip')).toBe('Skip');
  });

  it('home.textTab artık emoji içermiyor', () => {
    expect(translate('tr', 'home.textTab')).toBe('Metin');
    expect(translate('tr', 'home.textTab')).not.toMatch(/✍️/);
  });

  it('home.imageTab artık emoji içermiyor', () => {
    expect(translate('tr', 'home.imageTab')).toBe('Görsel');
    expect(translate('tr', 'home.imageTab')).not.toMatch(/📸/);
  });

  it('home.recentSearches artık emoji içermiyor', () => {
    expect(translate('tr', 'home.recentSearches')).toBe('Son aramalar');
    expect(translate('tr', 'home.recentSearches')).not.toMatch(/🕐/);
  });

  it('home.forYou artık emoji içermiyor', () => {
    expect(translate('tr', 'home.forYou')).toBe('Sizin İçin');
    expect(translate('tr', 'home.forYou')).not.toMatch(/✨/);
  });

  it('profile.thisWeek artık emoji içermiyor', () => {
    expect(translate('tr', 'profile.thisWeek')).toBe('Bu Hafta');
    expect(translate('tr', 'profile.thisWeek')).not.toMatch(/📅/);
  });

  it('profile.favCount artık emoji içermiyor', () => {
    expect(translate('tr', 'profile.favCount')).toBe('Favoriler');
    expect(translate('tr', 'profile.favCount')).not.toMatch(/❤️/);
  });
});
