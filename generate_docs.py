"""
EcoChef Teknik Dokümantasyon Üretici
Projedeki tüm dosyaların teknik altyapısını ve amacını açıklayan Word belgesi oluşturur.
"""

from docx import Document
from docx.shared import Pt, RGBColor, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import datetime

doc = Document()

# ─── Sayfa kenar boşlukları ───────────────────────────────────────────────────
section = doc.sections[0]
section.top_margin    = Cm(2.5)
section.bottom_margin = Cm(2.5)
section.left_margin   = Cm(3)
section.right_margin  = Cm(2.5)

# ─── Stil yardımcıları ────────────────────────────────────────────────────────
def set_heading(paragraph, level=1, text="", color=None):
    paragraph.clear()
    run = paragraph.add_run(text)
    run.bold = True
    sizes = {1: 20, 2: 16, 3: 13, 4: 12}
    run.font.size = Pt(sizes.get(level, 12))
    if color:
        run.font.color.rgb = RGBColor(*color)
    else:
        default = {1: (0,100,60), 2: (0,120,80), 3: (20,80,60), 4: (40,40,40)}
        run.font.color.rgb = RGBColor(*default.get(level, (0,0,0)))
    paragraph.paragraph_format.space_before = Pt(14 if level==1 else 10)
    paragraph.paragraph_format.space_after  = Pt(6)
    return paragraph

def add_h1(text):
    p = doc.add_paragraph()
    set_heading(p, 1, text)
    return p

def add_h2(text):
    p = doc.add_paragraph()
    set_heading(p, 2, text)
    return p

def add_h3(text):
    p = doc.add_paragraph()
    set_heading(p, 3, text)
    return p

def add_h4(text):
    p = doc.add_paragraph()
    set_heading(p, 4, text, (50,50,150))
    return p

def add_body(text, bold_start=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.font.size = Pt(11)
    return p

def add_bullet(text, level=0):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.left_indent = Cm(1 + level * 0.6)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(text)
    run.font.size = Pt(10.5)
    return p

def add_code(text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent  = Cm(1)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after  = Pt(2)
    run = p.add_run(text)
    run.font.name = "Courier New"
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(30, 30, 150)
    # gri arka plan
    rPr = run._r.get_or_add_rPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  'F0F0F0')
    rPr.append(shd)
    return p

def add_note(text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.8)
    run = p.add_run("📝  " + text)
    run.font.size = Pt(10)
    run.font.italic = True
    run.font.color.rgb = RGBColor(100, 100, 100)
    return p

def add_hr():
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'),   'single')
    bottom.set(qn('w:sz'),    '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '00A860')
    pBdr.append(bottom)
    pPr.append(pBdr)
    return p

def add_table(headers, rows):
    table = doc.add_table(rows=1+len(rows), cols=len(headers))
    table.style = "Table Grid"
    # header
    hrow = table.rows[0]
    for i, h in enumerate(headers):
        c = hrow.cells[i]
        c.text = h
        r = c.paragraphs[0].runs[0]
        r.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255,255,255)
        tc = c._tc
        tcPr = tc.get_or_add_tcPr()
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'),   'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'),  '007040')
        tcPr.append(shd)
    # rows
    for ri, row_data in enumerate(rows):
        for ci, cell_text in enumerate(row_data):
            table.rows[ri+1].cells[ci].text = str(cell_text)
            table.rows[ri+1].cells[ci].paragraphs[0].runs[0].font.size = Pt(10)
    doc.add_paragraph()
    return table

# ═══════════════════════════════════════════════════════════════════════════════
#  KAPAK SAYFASI
# ═══════════════════════════════════════════════════════════════════════════════
doc.add_paragraph()
doc.add_paragraph()
title_p = doc.add_paragraph()
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
tr = title_p.add_run("EcoChef")
tr.bold = True
tr.font.size = Pt(36)
tr.font.color.rgb = RGBColor(0, 130, 70)

subtitle_p = doc.add_paragraph()
subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
sr = subtitle_p.add_run("Teknik Dokümantasyon Raporu")
sr.font.size = Pt(18)
sr.font.color.rgb = RGBColor(60, 60, 60)

doc.add_paragraph()
desc_p = doc.add_paragraph()
desc_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
dr = desc_p.add_run("Yapay Zeka Destekli Akıllı Mutfak Asistanı\nTüm Dosyaların Teknik Altyapısı ve İşlevsel Açıklamaları")
dr.font.size = Pt(13)
dr.font.color.rgb = RGBColor(80, 80, 80)
dr.font.italic = True

doc.add_paragraph()
doc.add_paragraph()
date_p = doc.add_paragraph()
date_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
date_r = date_p.add_run(f"Hazırlanma Tarihi: {datetime.date.today().strftime('%d %B %Y')}")
date_r.font.size = Pt(11)
date_r.font.color.rgb = RGBColor(120,120,120)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════════════════
#  İÇİNDEKİLER
# ═══════════════════════════════════════════════════════════════════════════════
add_h1("İÇİNDEKİLER")
toc_items = [
    ("1", "Projeye Genel Bakış"),
    ("2", "Proje Mimarisi ve Teknoloji Yığını"),
    ("3", "Backend — FastAPI Uygulaması"),
    ("  3.1", "main.py — Ana Uygulama Girişi"),
    ("  3.2", "core/config.py — Konfigürasyon Yönetimi"),
    ("  3.3", "core/database.py — Veritabanı Katmanı"),
    ("  3.4", "core/auth.py — Kimlik Doğrulama Modülü"),
    ("  3.5", "core/orchestrator.py — İş Akışı Orkestratörü"),
    ("  3.6", "core/ingredient_translator.py — Malzeme Çevirici"),
    ("  3.7", "core/translator.py — Metin Çeviri Motoru"),
    ("  3.8", "core/logger.py — Loglama Sistemi"),
    ("  3.9", "core/request_context.py — İstek Bağlamı"),
    ("  3.10", "agents/vision_agent.py — Görüntü Tanıma Ajanı"),
    ("  3.11", "agents/nlp_agent.py — Doğal Dil İşleme Ajanı"),
    ("  3.12", "connectors/spoonacular.py — Spoonacular API Bağlayıcısı"),
    ("  3.13", "connectors/themealdb.py — TheMealDB API Bağlayıcısı"),
    ("  3.14", "schemas/ — Veri Modelleri"),
    ("  3.15", "requirements.txt — Bağımlılıklar"),
    ("  3.16", "Dockerfile — Backend Konteyner"),
    ("4", "Mobile — React Native / Expo Uygulaması"),
    ("  4.1", "app.json — Expo Konfigürasyonu"),
    ("  4.2", "package.json — Paket Yönetimi"),
    ("  4.3", "app/_layout.tsx — Kök Düzen"),
    ("  4.4", "app/(tabs)/_layout.tsx — Sekme Navigasyonu"),
    ("  4.5", "app/(tabs)/index.tsx — Ana Ekran"),
    ("  4.6", "app/(tabs)/explore.tsx — Keşfet Ekranı"),
    ("  4.7", "app/(tabs)/favorites.tsx — Favoriler Ekranı"),
    ("  4.8", "app/(tabs)/plan.tsx — Yemek Planı Ekranı"),
    ("  4.9", "app/(tabs)/shopping.tsx — Alışveriş Listesi"),
    ("  4.10", "app/(tabs)/profile.tsx — Profil Ekranı"),
    ("  4.11", "app/recipe/[id].tsx — Tarif Detayı"),
    ("  4.12", "app/login.tsx — Giriş / Kayıt Ekranı"),
    ("  4.13", "app/onboarding.tsx — Karşılama Ekranı"),
    ("  4.14", "app/live-scan.tsx — Canlı Kamera Tarama"),
    ("  4.15", "app/hybrid.tsx — Hibrit Mod Ekranı"),
    ("  4.16", "app/search-history.tsx — Arama Geçmişi"),
    ("  4.17", "app/edit-profile.tsx — Profil Düzenleme"),
    ("  4.18", "context/ — Global Durum Yönetimi"),
    ("  4.19", "hooks/ — Özel React Hooks"),
    ("  4.20", "components/ — Yeniden Kullanılabilir UI Bileşenleri"),
    ("  4.21", "utils/api.ts — API Yardımcı Katmanı"),
    ("  4.22", "locales/ & i18n/ — Çok Dilli Destek"),
    ("  4.23", "constants/ — Uygulama Sabitleri"),
    ("  4.24", "Dockerfile — Mobile Konteyner"),
    ("5", "Docker & Altyapı"),
    ("  5.1", "docker-compose.yml — Servis Orkestrasyonu"),
    ("  5.2", ".env Dosyaları — Ortam Değişkenleri"),
    ("6", "Veritabanı Şeması"),
    ("7", "API Endpoint Haritası"),
    ("8", "Güvenlik Mimarisi"),
    ("9", "Özet Tablo: Tüm Dosyalar"),
]
for num, title in toc_items:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    indent = 0 if not num.startswith(" ") else Cm(0.8)
    p.paragraph_format.left_indent = indent
    r1 = p.add_run(num.strip() + ".  ")
    r1.bold = True
    r1.font.size = Pt(10.5)
    r2 = p.add_run(title)
    r2.font.size = Pt(10.5)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════════════════
#  BÖLÜM 1 — PROJEYE GENEL BAKIŞ
# ═══════════════════════════════════════════════════════════════════════════════
add_h1("1. PROJEYE GENEL BAKIŞ")

add_body(
    "EcoChef, kullanıcıların ellerindeki malzemeleri kameraya göstererek veya metin olarak "
    "girerek yapay zeka destekli tarif önerileri almasını sağlayan bir mutfak asistanı uygulamasıdır. "
    "Proje; bir Python/FastAPI backend'i, bir React Native/Expo mobil uygulaması ve bir React/Vite "
    "web tanıtım sayfasından oluşmaktadır. Tüm bileşenler Docker Compose ile container'lara alınmıştır."
)

add_h2("Temel Özellikler")
for f in [
    "Görsel analiz ile buzdolabı içeriğini otomatik tanıma (YOLO v8)",
    "Metin tabanlı malzeme girişi ile tarif arama",
    "Hibrit mod: görsel + NLP modellerini birlikte kullanma",
    "Spoonacular (365.000+ tarif) ve TheMealDB API entegrasyonu",
    "Çevrimdışı (offline) mod: yerel Llama GGUF modeli",
    "Kullanıcı kaydı, JWT kimlik doğrulama, oturum yönetimi",
    "Favoriler, haftalık yemek planı, alışveriş listesi",
    "Türkçe / İngilizce tam dil desteği (i18n)",
    "Diyet filtresi (vejetaryen, vegan, glutensiz, vs.)",
    "Beslenme değeri filtreleme (kalori, protein, karbonhidrat, yağ)",
    "Tarif puanlama ve arama geçmişi",
    "Yemek planı push bildirimleri",
]:
    add_bullet(f)

add_h2("Proje Dizin Yapısı — Üst Düzey")
for line in [
    "EcoChef/",
    "├── backend/          → FastAPI REST API (Python 3.12)",
    "├── mobile/           → React Native Expo uygulaması",
    "├── models/           → AI model dosyaları (.pt, .gguf)",
    "├── docker-compose.yml→ Tüm servislerin orkestrasyonu",
    "└── .env              → Ortam değişkenleri",
]:
    add_code(line)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════════════════
#  BÖLÜM 2 — MİMARİ
# ═══════════════════════════════════════════════════════════════════════════════
add_h1("2. MİMARİ VE TEKNOLOJİ YIĞINI")

add_body(
    "EcoChef üç katmanlı bir mimari kullanır: sunum katmanı (mobil uygulama), "
    "iş mantığı katmanı (FastAPI backend) ve veri katmanı (MySQL veritabanı). "
    "AI modelleri backend içinde çalışır ve internet gerektirmeyen yerel çıkarım yapabilir."
)

add_h2("Teknoloji Yığını Tablosu")
add_table(
    ["Bileşen", "Teknoloji", "Versiyon", "Rol"],
    [
        ["Backend Çerçevesi", "FastAPI", "0.135.2", "REST API sunucusu"],
        ["Backend Dili", "Python", "3.12", "Uygulama mantığı"],
        ["ORM", "SQLAlchemy", "2.0.49", "Veritabanı etkileşimi"],
        ["Veri Doğrulama", "Pydantic", "2.12.5", "Request/response şeması"],
        ["Veritabanı", "MySQL", "8.4", "Kalıcı veri depolama"],
        ["ASGI Sunucu", "Uvicorn", "0.42.0", "HTTP sunucusu"],
        ["Görüntü Tanıma", "YOLO v8 (Ultralytics)", "8.4.26", "Malzeme tespiti"],
        ["Yerel LLM", "Llama GGUF (llama-cpp)", "0.3.18", "NLP önerileri"],
        ["Çeviri", "deep-translator", "1.11.4", "Google Translate wrapper"],
        ["Auth", "python-jose (JWT)", "3.5.0", "Token bazlı kimlik doğrulama"],
        ["Rate Limiting", "slowapi", "0.1.9", "API istek sınırlama"],
        ["Derin Öğrenme", "PyTorch", "2.5.1", "YOLO için inference"],
        ["Mobile Framework", "React Native / Expo", "0.81 / SDK 54", "Cross-platform mobil"],
        ["Mobile Dili", "TypeScript", "5.9", "Tip güvenli frontend"],
        ["Mobile Router", "Expo Router", "~6.0.23", "Dosya bazlı navigasyon"],
        ["Güvenli Depolama", "Expo SecureStore", "~15.0.8", "JWT güvenli saklama"],
        ["Yerel Depolama", "AsyncStorage", "2.2.0", "Önbellek / offline veri"],
        ["Bildirimler", "Expo Notifications", "~0.31.0", "Push bildirimleri"],
        ["Lokalizasyon", "i18n-js", "^4.5.3", "Çok dilli destek"],
        ["Container", "Docker + Compose", "güncel", "Servis izolasyonu"],
    ]
)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════════════════
#  BÖLÜM 3 — BACKEND
# ═══════════════════════════════════════════════════════════════════════════════
add_h1("3. BACKEND — FastAPI Uygulaması")

add_body(
    "Backend; Python 3.12 ve FastAPI çerçevesiyle geliştirilmiş, 42 REST endpoint sunan "
    "bir yapay zeka destekli tarif öneri API'sidir. YOLO v8 ve Llama GGUF modelleri "
    "backend içinde çalışır; MySQL veritabanı tüm kullanıcı verilerini depolar."
)

# 3.1 main.py
add_hr()
add_h2("3.1  main.py — Ana Uygulama Girişi")
add_body(
    "main.py, FastAPI uygulamasının başlangıç noktasıdır (548 satır). Tüm route'lar, "
    "middleware'ler ve startup/shutdown event'leri burada tanımlanır."
)

add_h3("Teknik Altyapı")
for item in [
    "FastAPI() instance'ı oluşturulur; başlık, versiyon ve Swagger/OpenAPI desteği yapılandırılır.",
    "CORSMiddleware: Tüm origin'lere izin verir (geliştirme ortamı için). Credentials, method ve header ayarları belirtilir.",
    "SlowAPI rate limiter: Limiter nesnesine bağlanır, app.state.limiter'a atanır. 429 yanıtları otomatik işlenir.",
    "Locale middleware: Her istekte Accept-Language başlığı okunur; ContextVar'a tr/en değeri yazılır.",
    "@app.on_event('startup'): init_db() çağrılır → SQLAlchemy tüm tabloları oluşturur veya migrate eder.",
    "Bağımlılık enjeksiyonu (Depends): get_current_user() decorator'ı ile korumalı endpoint'ler JWT doğrular.",
    "get_current_user(): Authorization başlığından Bearer token alır, blacklist kontrolü yapar, kullanıcı ID'sini döner.",
]:
    add_bullet(item)

add_h3("Endpoint Grupları (42 rota)")
add_table(
    ["Grup", "Method", "Yol", "Açıklama"],
    [
        ["Auth", "POST", "/auth/register", "Yeni kullanıcı kaydı (PBKDF2 şifre hash)"],
        ["Auth", "POST", "/auth/login", "Kullanıcı girişi → JWT token döner"],
        ["Auth", "GET",  "/auth/me", "Mevcut oturum bilgisi"],
        ["Auth", "PUT",  "/auth/profile", "Diyet tercihlerini güncelle"],
        ["Auth", "PUT",  "/auth/password", "Şifre değiştir"],
        ["Auth", "POST", "/auth/logout", "Token'ı blacklist'e ekle"],
        ["Pipeline", "POST", "/detect-ingredients/", "Görsel → YOLO → tarifler (10/dk limit)"],
        ["Pipeline", "POST", "/analyze-text-ingredients/", "Metin → tarifler (20/dk limit)"],
        ["Pipeline", "POST", "/hybrid-suggest/", "Görsel + NLP hibrit öneri"],
        ["Keşfet", "GET",  "/recipes/random", "Rastgele tarif öner"],
        ["Keşfet", "GET",  "/recipes/discover", "Mutfak bazlı keşfet"],
        ["Keşfet", "GET",  "/recipes/{id}", "Tarif detayı"],
        ["Keşfet", "GET",  "/recipes/meal/{meal_id}", "TheMealDB detayı"],
        ["Favoriler", "GET", "/favorites", "Kullanıcının favorileri"],
        ["Favoriler", "POST", "/favorites", "Favoriye ekle"],
        ["Favoriler", "DELETE", "/favorites/{recipe_id}", "Favoriden çıkar"],
        ["Meal Plan", "GET", "/meal-plan", "Haftalık plan"],
        ["Meal Plan", "POST", "/meal-plan", "Plana tarif ekle"],
        ["Meal Plan", "DELETE", "/meal-plan/{plan_id}", "Plandan sil"],
        ["Puanlama", "POST", "/ratings", "Tarif puanla (1-5)"],
        ["Puanlama", "GET", "/ratings/{recipe_id}", "Tarif puanlarını getir"],
        ["Geçmiş", "GET", "/search-history", "Arama geçmişi"],
        ["Geçmiş", "POST", "/search-history", "Arama kaydet"],
        ["Geçmiş", "DELETE", "/search-history/{id}", "Tek kayıt sil"],
        ["Geçmiş", "DELETE", "/search-history", "Tüm geçmişi temizle"],
    ]
)

add_h3("Görüntü İşleme Akışı (/detect-ingredients/)")
for step in [
    "1. UploadFile alınır, byte'lara okunur.",
    "2. vision_agent.detect() çağrılır → YOLO malzeme listesi döner.",
    "3. Malzeme listesi orchestrator.image_pipeline() fonksiyonuna verilir.",
    "4. Spoonacular API ile tarif arama; bulunamazsa TheMealDB'ye fallback.",
    "5. Sonuçlar ImagePipelineResponse şemasına dönüştürülür ve döner.",
]:
    add_bullet(step)

# 3.2 config.py
add_hr()
add_h2("3.2  core/config.py — Konfigürasyon Yönetimi")
add_body(
    "Pydantic BaseSettings ile ortam değişkenlerini tip-güvenli biçimde yönetir. "
    ".env dosyasından veya Docker ortam değişkenlerinden otomatik okuma yapar."
)
add_h3("Yapılandırma Alanları")
add_table(
    ["Alan", "Tip", "Varsayılan", "Açıklama"],
    [
        ["spoonacular_api_key", "str", "—", "Spoonacular API anahtarı"],
        ["spoonacular_base_url", "str", "https://api.spoonacular.com/...", "API temel URL"],
        ["yolo_model_path", "Path", "yolov8n.pt", "YOLO model dosya yolu"],
        ["yolo_confidence", "float", "0.40", "Tespit güven eşiği"],
        ["yolo_food_only", "bool", "True", "Yalnızca yiyecek sınıflarına filtre"],
        ["mysql_host", "str", "localhost", "Veritabanı sunucu adresi"],
        ["mysql_port", "int", "3306", "MySQL port numarası"],
        ["mysql_user", "str", "ecochef", "DB kullanıcısı"],
        ["mysql_password", "str", "—", "DB şifresi"],
        ["mysql_db", "str", "ecochef", "Veritabanı adı"],
        ["jwt_secret", "str", "—", "JWT imzalama anahtarı (min 32 karakter)"],
        ["jwt_expire_days", "int", "30", "Token geçerlilik süresi"],
        ["translate_recipes", "bool", "True", "Tarif isimlerini çevirme"],
        ["llm_model_path", "Path", "model.gguf", "Llama model dosya yolu"],
        ["llm_n_ctx", "int", "2048", "Llama bağlam penceresi (token)"],
        ["llm_verbose", "bool", "False", "Llama debug çıktısı"],
    ]
)
add_note("Settings nesnesi modül seviyesinde settings = Settings() ile tek sefer oluşturulur; "
         "tüm modüller from core.config import settings ile erişir.")

# 3.3 database.py
add_hr()
add_h2("3.3  core/database.py — Veritabanı Katmanı")
add_body(
    "SQLAlchemy 2.0 declarative API kullanarak MySQL şemasını tanımlar ve "
    "veritabanı bağlantı havuzunu (connection pool) yönetir."
)
add_h3("SQLAlchemy Kurulumu")
for item in [
    "create_engine(): MySQL+PyMySQL dialect. pool_pre_ping=True ile bağlantı sağlığı kontrol edilir.",
    "SessionLocal: sessionmaker ile oluşturulur; autocommit=False, autoflush=False.",
    "Base = declarative_base(): Tüm model sınıfları buradan türer.",
    "get_db(): Generator fonksiyon; FastAPI Depends sisteminde kullanılır. finally bloğunda session kapatılır.",
    "init_db(): app startup'da çağrılır; Base.metadata.create_all() ile eksik tablolar yaratılır.",
]:
    add_bullet(item)

add_h3("Veri Modelleri")
add_table(
    ["Model", "Tablo", "Alanlar", "Açıklama"],
    [
        ["UserModel", "users", "id, kullanici_adi*, sifre_hash, dietary_preferences", "Kullanıcı kaydı"],
        ["FavoriteModel", "favorites", "id, user_id→users, recipe_id, recipe_isim, recipe_gorsel, kaydedilme_tarihi", "Favori tarifler"],
        ["MealPlanModel", "meal_plans", "id, user_id→users, tarih, ogun, recipe_id, recipe_isim, recipe_gorsel", "Haftalık yemek planı"],
        ["RecipeRatingModel", "recipe_ratings", "id, user_id→users, recipe_id, recipe_isim, puan(1-5), tarih", "Tarif puanlaması"],
        ["SearchHistoryModel", "search_history", "id, user_id→users, sorgu, mod(metin/gorsel), tarih", "Arama geçmişi"],
        ["RevokedTokenModel", "revoked_tokens", "id, token*, iptal_tarihi", "JWT blacklist"],
    ]
)
add_note("dietary_preferences JSON string olarak saklanır. Migration güvenliği için init_db() içinde "
         "ADD COLUMN IF NOT EXISTS sorgusu çalıştırılır.")

# 3.4 auth.py
add_hr()
add_h2("3.4  core/auth.py — Kimlik Doğrulama Modülü")
add_body(
    "JWT tabanlı kimlik doğrulama ve PBKDF2-SHA256 şifre hashleme işlemlerini içerir. "
    "Token blacklist mekanizması ile oturum iptali desteklenir."
)
for item in [
    "sifrele(sifre): hashlib.pbkdf2_hmac('sha256', ...) — 260.000 iteration, 16 byte random salt. "
     "salt:hash formatında döner.",
    "sifre_dogrula(sifre, sifre_hash): hmac.compare_digest() ile zamanlama saldırısına karşı güvenli karşılaştırma.",
    "token_olustur(user_id, kullanici_adi): jose.jwt.encode() — HS256 algoritması. "
     "exp claim: now + jwt_expire_days gün.",
    "token_coz(token): jose.jwt.decode() — imza ve süre doğrulama. Hatalı token → 401.",
    "token_iptal_et(token, db): RevokedTokenModel veritabanına ekler.",
    "token_iptal_mi(token, db): SELECT EXISTS sorgusu ile blacklist kontrolü.",
    "kullanici_bul(kullanici_adi, db): Username ile kullanıcı sorgular.",
    "kullanici_olustur(kullanici_adi, sifre, db): Şifreyi hashler, UserModel kaydeder.",
]:
    add_bullet(item)

# 3.5 orchestrator.py
add_hr()
add_h2("3.5  core/orchestrator.py — İş Akışı Orkestratörü")
add_body(
    "Üç farklı yapay zeka pipeline'ını koordine eder (270 satır). Her pipeline, "
    "AI modellerini ve dış API'leri belirli bir sırayla çağırır."
)

add_h3("Pipeline 1: image_pipeline (Görsel)")
for s in [
    "vision_agent.detect(image_bytes) → detected_ingredients: List[str]",
    "Diyet filtresi ve beslenme parametreleri uygulanır.",
    "spoonacular.find_recipes_by_ingredients() çağrılır.",
    "Spoonacular başarısız → themealdb.search_by_ingredient() fallback.",
    "Tarif isimleri ve malzemeler Türkçeye çevrilir.",
    "ImagePipelineResponse döner.",
]:
    add_bullet(s)

add_h3("Pipeline 2: text_pipeline (Metin)")
for s in [
    "ingredient_translator.parse_and_translate(text) → İngilizce malzeme listesi",
    "ThreadPoolExecutor ile Spoonacular + TheMealDB paralel çağrısı yapılır.",
    "Sonuçlar NLPSuggestion formatına dönüştürülür.",
    "TextPipelineResponse döner.",
]:
    add_bullet(s)

add_h3("Pipeline 3: hybrid_pipeline (Hibrit)")
for s in [
    "vision_agent.detect() → görsel malzeme tespiti",
    "nlp_agent.suggest() → Llama GGUF ile metin önerileri (çevrimdışı çalışır)",
    "İki kaynaktan gelen öneriler birleştirilir.",
    "HybridPipelineResponse döner.",
]:
    add_bullet(s)

# 3.6 ingredient_translator.py
add_hr()
add_h2("3.6  core/ingredient_translator.py — Malzeme Çevirici")
add_body(
    "İngilizce-Türkçe malzeme sözlüğü (80+ giriş) ve Türkçe serbest metin parçalayıcısı içerir. "
    "YOLO'nun İngilizce çıktısını Türkçeye çevirir; kullanıcı Türkçe metnini İngilizce malzeme listesine dönüştürür."
)
for item in [
    "EN_TO_TR: dict — 'tomato'→'domates', 'chicken'→'tavuk' gibi 80+ çift.",
    "TR_TO_EN: EN_TO_TR'nin terslenmiş hali, dinamik oluşturulur.",
    "parse_and_translate(text): Virgül/noktalı virgül ile böler → her parçayı normalize eder "
     "→ TR_TO_EN sözlüğünde arar → bulunamazsa Google Translate çağırır.",
    "translate_to_turkish(ingredient): EN_TO_TR'de ara → bulunamazsa translator.cevir() ile çevir.",
    "is_food_class(name): COCO dataset food sınıfları listesinde arar; YOLO non-food "
     "tespitlerini filtreler.",
    "COCO_FOOD_CLASSES: ['apple', 'banana', 'broccoli', 'carrot', ...] — 20+ yiyecek sınıfı.",
]:
    add_bullet(item)

# 3.7 translator.py
add_hr()
add_h2("3.7  core/translator.py — Metin Çeviri Motoru")
add_body(
    "deep-translator kütüphanesi üzerine kurulu, LRU cache ile performanslı çeviri sağlar."
)
for item in [
    "@lru_cache(maxsize=512): Aynı (metin, kaynak_dil, hedef_dil) kombinasyonu ikinci kez "
     "istendiğinde ağ çağrısı yapmaz.",
    "cevir(text, source, target): GoogleTranslator(source=source, target=target).translate(text). "
     "Exception → orijinal text döner (graceful fallback).",
    "translate_ingredient_to_english(text): Türkçe → İngilizce malzeme çevirisi.",
    "translate_recipe_name(text, lang): Tarif ismini kullanıcı diline çevirir.",
]:
    add_bullet(item)

# 3.8 logger.py
add_hr()
add_h2("3.8  core/logger.py — Loglama Sistemi")
add_body(
    "Python standart logging modülü üzerine yapılandırılmış, modüler log sistemi. "
    "Tüm log çıktıları formatlanmış zaman damgası, seviye ve modül adını içerir."
)
for item in [
    "get_logger(name): 'ecochef.' prefix'i ile hiyerarşik logger döner. "
     "Örn: get_logger('agents.vision') → 'ecochef.agents.vision'",
    "Formatter: '%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s' formatı.",
    "StreamHandler: Tüm loglar stdout'a yazar (Docker log koleksiyonu için).",
    "log_duration(): Context manager. with log_duration(logger, 'YOLO detect'): ... "
     "bloğu tamamlandığında geçen süreyi ms cinsinden loglar.",
    "log_call(): Decorator. Fonksiyon girişinde ve çıkışında DEBUG log atar; "
     "exception'ları ERROR seviyesinde yakalar ve yeniden fırlatır.",
]:
    add_bullet(item)

# 3.9 request_context.py
add_hr()
add_h2("3.9  core/request_context.py — İstek Bağlamı")
add_body(
    "Python ContextVar ile her HTTP isteğine özgü bağlam bilgisi saklar. "
    "Async thread-safe veri paylaşımını sağlar."
)
for item in [
    "locale_var: ContextVar[str] — Varsayılan 'tr'. Her istek için Accept-Language'den set edilir.",
    "user_id_var: ContextVar[int | None] — JWT doğrulandıktan sonra kullanıcı ID'si yazılır.",
    "get_locale() / set_locale(lang): Locale ContextVar erişim yardımcıları.",
    "get_user_id() / set_user_id(uid): Kullanıcı ID erişim yardımcıları.",
]:
    add_bullet(item)

# 3.10 vision_agent.py
add_hr()
add_h2("3.10  agents/vision_agent.py — Görüntü Tanıma Ajanı")
add_body(
    "YOLOv8 modelini kullanarak görsel içindeki yiyecekleri tespit eder. "
    "Singleton pattern ile model bir kez yüklenir, sonraki isteklerde bellekten kullanılır."
)
for item in [
    "VisionAgent sınıfı: _model sınıf değişkeni (None başlar). load() bir kez çağrılır, sonraki detect() çağrıları cache'i kullanır.",
    "load(): YOLO(settings.yolo_model_path) — Ultralytics kütüphanesi ile model yükleme. "
     "İlk yüklemede yolov8n.pt internetten indirilir (~6MB).",
    "detect(image_bytes) → List[str]:",
    "  1. io.BytesIO → PIL Image → numpy array dönüşümü.",
    "  2. model.predict(img_array, conf=settings.yolo_confidence) inference.",
    "  3. result.boxes.cls → sınıf ID listesi → model.names ile etiket ismine çeviri.",
    "  4. yolo_food_only=True ise is_food_class() filtresi uygulanır.",
    "  5. list(set(...)) ile tekrarlar kaldırılır, küçük harfe çevrilir.",
    "Güven eşiği (confidence threshold): 0.40 (varsayılan). Düşük güvenli tespitler atlanır.",
]:
    add_bullet(item)

add_note("GPU desteği yoksa PyTorch CPU modunda çalışır. İlk inference ~500ms, sonrakiler ~150ms.")

# 3.11 nlp_agent.py
add_hr()
add_h2("3.11  agents/nlp_agent.py — Doğal Dil İşleme Ajanı")
add_body(
    "Llama GGUF modelini yerel olarak çalıştırarak Türk yemekleri önerir. "
    "İnternet bağlantısı gerektirmez; çevrimdışı modun temel bileşenidir."
)
for item in [
    "NLPAgent sınıfı: _llm sınıf değişkeni (singleton). load(): Llama(model_path=..., n_ctx=2048, verbose=False).",
    "suggest(ingredients: List[str]) → List[dict]:",
    "  1. Few-shot prompt oluşturulur: 3 örnek (input→output çiftleri) + gerçek malzemeler.",
    "  2. llm(prompt, max_tokens=512, temperature=0.7, stop=['```']) inference yapılır.",
    "  3. JSON bloğu regex ile çıkarılır.",
    "  4. json.loads() ile parse edilir.",
    "  5. Başarısız → temperature 0.9'a çıkarılır, max 2 deneme daha.",
    "Output formatı: [{'isim': 'Tavuk Sote', 'neden': 'Elinizdeki tavuk ve sebzeler...'}]",
    "Few-shot örnekler: 3 temsili (malzeme → Türk yemeği) çifti hardcoded olarak prompt'a eklenir.",
]:
    add_bullet(item)

# 3.12 spoonacular.py
add_hr()
add_h2("3.12  connectors/spoonacular.py — Spoonacular API Bağlayıcısı")
add_body(
    "Spoonacular'ın 365.000+ tarif veritabanına HTTP istekleri atar. "
    "Ana tarif kaynağıdır; tüm beslenme filtresi seçenekleri buradan sağlanır."
)
add_h3("Fonksiyonlar")
for fn in [
    "find_recipes_by_ingredients(ingredients, diet, max_calories, min_protein, max_carbs, max_fat): "
     "Basit mod: /findByIngredients. Filtre varsa: /complexSearch (daha yavaş ama zengin).",
    "get_random_recipes(number, diet): /recipes/random. Günlük keşfet özelliği için.",
    "search_by_cuisine(cuisine, diet): /complexSearch?cuisine=turkish gibi mutfak bazlı arama.",
    "get_recipe_detail(recipe_id): /recipes/{id}/information. Malzeme, talimat, beslenme değeri.",
    "get_recipe_steps(recipe_id): /recipes/{id}/analyzedInstructions. Adım adım pişirme talimatları.",
    "_parse_nutrition(data): JSON yanıtından kalori, protein, karbonhidrat, yağ çıkarır.",
    "_to_recipe(raw): Ham API yanıtını Recipe Pydantic modeline dönüştürür.",
]:
    add_bullet(fn)
add_note("API anahtarı isteklere ?apiKey=... olarak eklenir. Ücretsiz plan: 150 istek/gün.")

# 3.13 themealdb.py
add_hr()
add_h2("3.13  connectors/themealdb.py — TheMealDB API Bağlayıcısı")
add_body(
    "Ücretsiz TheMealDB API'sini kullanan ikincil tarif kaynağıdır. "
    "Spoonacular kota dolduğunda veya başarısız olduğunda devreye girer."
)
for fn in [
    "search_by_ingredient(ingredient): /filter.php?i={ingredient}. Malzemeye göre tarif listesi.",
    "search_by_area(area): /filter.php?a={area}. Mutfak bölgesine göre (Turkish, Italian vb.).",
    "search_turkish(): area='Turkish' ile Türk yemekleri özel araması.",
    "get_meal_detail(meal_id): /lookup.php?i={id}. Tam tarif detayı (20 malzemeye kadar).",
    "_parse_ingredients(meal): strIngredient1..strIngredient20 + strMeasure1..20 alanlarını "
     "birleştirir; boş olanları filtreler.",
    "_to_recipe(meal): TheMealDB formatını ortak Recipe modeline çevirir. kaynak='themealdb'.",
]:
    add_bullet(fn)

# 3.14 schemas/
add_hr()
add_h2("3.14  schemas/ — Veri Modelleri (Pydantic)")
add_body(
    "FastAPI request/response doğrulaması için Pydantic v2 modelleri. "
    "Tip hataları otomatik 422 hatası olarak döner."
)

add_h3("schemas/recipe.py")
add_code("""class Recipe(BaseModel):
    id: int
    isim: str
    gorsel: HttpUrl | None = None
    kullanilan_malzemeler: list[str] = []
    eksik_malzemeler: list[str] = []
    puan: float | None = None
    beslenme: dict | None = None   # {kalori, protein, karbonhidrat, yag}
    kaynak: str                    # "spoonacular" | "themealdb"
    adimlar: list[str] = []""")

add_h3("schemas/ingredient.py")
add_code("""class TextInput(BaseModel):
    text: str = Field(min_length=3, max_length=500)
    diet: str | None = None
    max_calories: int | None = None
    min_protein: int | None = None
    max_carbs: int | None = None
    max_fat: int | None = None

class NLPSuggestion(BaseModel):
    isim: str
    neden: str
    beslenme: dict | None = None
    kaynak: str | None = None""")

add_h3("schemas/user.py")
add_code("""class KayitIstegi(BaseModel):
    kullanici_adi: str = Field(min_length=3, max_length=30, pattern=r'^[a-zA-Z0-9_]+$')
    sifre: str = Field(min_length=6)

class TokenYanit(BaseModel):
    access_token: str
    token_type: str = "bearer"
    kullanici_adi: str""")

add_h3("schemas/response.py")
add_code("""class ImagePipelineResponse(BaseModel):
    tespit_edilen_malzemeler: list[str]
    bulunan_tarifler: list[Recipe]
    mesaj: str

class TextPipelineResponse(BaseModel):
    basari: bool
    sonuclar: list[NLPSuggestion]

class HybridPipelineResponse(BaseModel):
    tespit_edilen_malzemeler: list[str]
    nlp_onerileri: list[dict]
    mesaj: str""")

# 3.15 requirements.txt
add_hr()
add_h2("3.15  requirements.txt — Python Bağımlılıkları")
add_body("Tüm Python paketleri sabit versiyonlarla pinlenmiştr; reproducible build sağlar.")
add_table(
    ["Paket", "Versiyon", "Amaç"],
    [
        ["fastapi", "0.135.2", "Web çerçevesi"],
        ["uvicorn[standard]", "0.42.0", "ASGI HTTP sunucu"],
        ["sqlalchemy", "2.0.49", "ORM ve veritabanı katmanı"],
        ["pydantic", "2.12.5", "Veri doğrulama"],
        ["pydantic-settings", "2.9.1", "Ortam değişkeni yönetimi"],
        ["ultralytics", "8.4.26", "YOLO v8 görüntü tanıma"],
        ["llama-cpp-python", "0.3.18", "Yerel LLM inference"],
        ["deep-translator", "1.11.4", "Google Translate wrapper"],
        ["python-jose[cryptography]", "3.5.0", "JWT token oluşturma/doğrulama"],
        ["passlib[bcrypt]", "1.7.4", "Şifre hashing yardımcısı"],
        ["slowapi", "0.1.9", "Rate limiting middleware"],
        ["requests", "2.32.5", "HTTP istemci"],
        ["PyMySQL", "1.1.1", "MySQL sürücüsü"],
        ["torch", "2.5.1+cpu", "Derin öğrenme çerçevesi (CPU)"],
        ["torchvision", "0.20.1+cpu", "Görüntü dönüşümleri"],
        ["pillow", "11.2.1", "Görüntü işleme"],
        ["numpy", "1.26.4", "Sayısal hesaplama"],
        ["python-multipart", "0.0.20", "Dosya yükleme desteği"],
        ["httpx", "0.27.2", "Async HTTP istemci (testler)"],
    ]
)

# 3.16 backend Dockerfile
add_hr()
add_h2("3.16  backend/Dockerfile — Backend Konteyner")
add_body("Python 3.12 slim tabanlı; OpenCV ve YOLO için sistem bağımlılıklarını kurar.")
for step in [
    "FROM python:3.12-slim: Hafif Debian tabanlı base image.",
    "apt-get: libgl1, libglib2.0-0 (OpenCV), build-essential, libssl-dev (cryptography) kurulumu.",
    "WORKDIR /app: Uygulama dizini.",
    "COPY requirements.txt + pip install: Önce sadece bağımlılıklar yüklenir (Docker layer cache optimizasyonu).",
    "COPY . .: Uygulama kodu kopyalanır.",
    "VOLUME ['/app/models']: AI model dosyaları host'tan mount edilir (image'a gömülmez).",
    "EXPOSE 8000: FastAPI port'u.",
    "CMD ['uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000']: Uygulama başlatma.",
]:
    add_bullet(step)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════════════════
#  BÖLÜM 4 — MOBILE
# ═══════════════════════════════════════════════════════════════════════════════
add_h1("4. MOBILE — React Native / Expo Uygulaması")
add_body(
    "React Native 0.81 ve Expo SDK 54 üzerine TypeScript ile geliştirilmiş cross-platform "
    "mobil uygulama. Expo Router ile dosya tabanlı navigasyon kullanır. iOS ve Android'de çalışır."
)

# 4.1 app.json
add_hr()
add_h2("4.1  app.json — Expo Konfigürasyonu")
add_body("Expo uygulamasının merkezi yapılandırma dosyasıdır.")
add_table(
    ["Alan", "Değer", "Açıklama"],
    [
        ["name", "EcoChef", "Uygulama görünen adı"],
        ["version", "1.0.0", "Uygulama versiyonu"],
        ["orientation", "portrait", "Ekran yönü kilidi"],
        ["scheme", "ecochef", "Deep link URL şeması"],
        ["userInterfaceStyle", "automatic", "Sistem temasına göre light/dark"],
        ["plugins", "expo-router, expo-secure-store, expo-localization", "Expo eklentileri"],
        ["typedRoutes", "true (experiment)", "Expo Router tip güvenliği"],
        ["reactCompiler", "true (experiment)", "React 19 derleyici optimizasyonu"],
        ["ios.bundleIdentifier", "com.berkay.ecochef", "iOS App Store ID"],
        ["android.package", "com.berkay.ecochef", "Android Play Store ID"],
    ]
)

# 4.2 package.json
add_hr()
add_h2("4.2  package.json — Paket Yönetimi")
add_body("NPM bağımlılıklarını ve Expo scripts'lerini tanımlar.")
add_h3("Kritik Bağımlılıklar")
add_table(
    ["Paket", "Versiyon", "Amaç"],
    [
        ["expo", "~54.0.33", "Expo SDK — platform soyutlama"],
        ["react-native", "0.81.5", "Cross-platform UI bileşenleri"],
        ["expo-router", "~6.0.23", "Dosya tabanlı sayfa navigasyonu"],
        ["expo-camera", "~17.0.10", "Kamera erişimi"],
        ["expo-image-picker", "~17.0.10", "Galeri ve kamera görsel seçici"],
        ["expo-secure-store", "~15.0.8", "Şifreli yerel depolama (JWT)"],
        ["@react-native-async-storage/async-storage", "2.2.0", "Şifresiz yerel depolama"],
        ["expo-localization", "~17.0.8", "Cihaz dil/bölge bilgisi"],
        ["expo-notifications", "~0.31.0", "Push ve yerel bildirimler"],
        ["i18n-js", "^4.5.3", "Çok dilli metin yönetimi"],
        ["expo-linear-gradient", "~14.0.2", "Gradient arka plan desteği"],
        ["expo-blur", "~14.0.3", "Frosted glass blur efekti"],
        ["expo-haptics", "~14.0.1", "Dokunsal geri bildirim"],
    ]
)

# 4.3 app/_layout.tsx
add_hr()
add_h2("4.3  app/_layout.tsx — Kök Düzen")
add_body(
    "Expo Router'ın en üst seviye layout dosyasıdır. Tüm ekranları saran "
    "provider'lar burada tanımlanır."
)
for item in [
    "ThemeProvider (React Navigation): DarkTheme / DefaultTheme. useColorScheme() ile sistem teması algılanır.",
    "StatusBar: Tema ile senkron renk yönetimi.",
    "AuthProvider: Tüm uygulama için kimlik doğrulama state'i.",
    "FavoritesProvider: Global favori tarifleri sağlar.",
    "MealPlanProvider: Haftalık plan state'i.",
    "ShoppingListProvider: Alışveriş listesi state'i.",
    "SplashScreen.preventAutoHideAsync(): Fontlar yüklenene kadar splash screen tutulur.",
    "useFonts(): SpaceMono font asenkron yükleme. Yüklenince SplashScreen.hideAsync().",
    "<Stack>: Expo Router stack navigator; modal, authentication ekranları buraya eklenir.",
]:
    add_bullet(item)

# 4.4 app/(tabs)/_layout.tsx
add_hr()
add_h2("4.4  app/(tabs)/_layout.tsx — Sekme Navigasyonu")
add_body(
    "React Navigation TabNavigator yapılandırması. Uygulamanın alt navigasyon çubuğunu tanımlar."
)
for item in [
    "useAuth(): Giriş durumu kontrolü. token yoksa /login'e yönlendirir.",
    "Tabs.Screen tanımları: index (Ana), explore (Keşfet), favorites (Favoriler), "
     "plan (Yemek Planı), shopping (Alışveriş), profile (Profil).",
    "tabBarIcon: @expo/vector-icons ile ikon eşleşmeleri.",
    "tabBarActiveTintColor: Tema rengi (#00A860 yeşil).",
    "HapticTab: Sekme değişimlerinde titreşim geri bildirimi.",
    "headerShown: false — Her sekme kendi başlığını yönetir.",
]:
    add_bullet(item)

# 4.5 index.tsx
add_hr()
add_h2("4.5  app/(tabs)/index.tsx — Ana Ekran")
add_body(
    "Uygulamanın başlangıç ekranı. Görsel yükleme, metin girişi ve tarif listesini içerir."
)
for item in [
    "useState: image (URI), ingredients (string), recipes (Recipe[]), loading (bool), error (string | null)",
    "useAuth(): token alınır; tüm API çağrılarına Authorization başlığı eklenir.",
    "handleImagePick(): ImagePicker.launchImageLibraryAsync() → base64 → /detect-ingredients/ POST",
    "handleTextSearch(): TextInput değeri → /analyze-text-ingredients/ POST",
    "FlatList: Tarif kartları performanslı liste render. keyExtractor, renderItem.",
    "RecipeCard bileşeni: Görsel, isim, malzeme sayısı, kaynak etiketi.",
    "OfflineBanner: İnternet yoksa üstte sarı banner gösterilir.",
    "Toast: Hata ve başarı mesajları için non-blocking bildirim.",
]:
    add_bullet(item)

# 4.6 explore.tsx
add_hr()
add_h2("4.6  app/(tabs)/explore.tsx — Keşfet Ekranı")
add_body("Rastgele tarif önerileri ve mutfak bazlı keşfetme ekranı.")
for item in [
    "useEffect: Ekran açıldığında /recipes/random çağırır.",
    "mutfaklar: ['İtalyan', 'Türk', 'Meksika', 'Asya', ...] — horizontal scroll liste.",
    "Mutfak seçilince: /recipes/discover?cuisine={seçim} çağrısı.",
    "Sonuçlar ScrollView içinde kart formatında gösterilir.",
    "Pull-to-refresh (RefreshControl): Yeni rastgele tarifler yükler.",
    "useRecipeCache(): Son 10 arama sonucu AsyncStorage'a yazılır; offline görüntülenebilir.",
]:
    add_bullet(item)

# 4.7 favorites.tsx
add_hr()
add_h2("4.7  app/(tabs)/favorites.tsx — Favoriler Ekranı")
add_body("Kullanıcının kaydettiği tarifleri listeler ve yönetir.")
for item in [
    "useFavorites(): favoriler listesi, favoriKaldir() ve yukle() fonksiyonları alınır.",
    "useEffect: Ekran odaklandığında (useFocusEffect) favoriler yeniden yüklenir.",
    "Swipe-to-delete: PanResponder veya Pressable uzun bas ile silme işlemi.",
    "Boş durum: 'Henüz favori yok' illüstrasyonu.",
    "Tarif kartına dokunulunca /recipe/[id] ekranına navigate.",
]:
    add_bullet(item)

# 4.8 plan.tsx
add_hr()
add_h2("4.8  app/(tabs)/plan.tsx — Yemek Planı Ekranı")
add_body("Haftalık yemek planı görünümü ve yönetimi.")
for item in [
    "useMealPlan(): plan listesi, yukle(hafta_basi), planEkle(), planKaldir().",
    "Hafta navigasyonu: Sol/sağ ok ile geçmiş/gelecek haftalara geçiş.",
    "Takvim görünümü: 7 günlük ızgara. Her gün için kahvaltı/öğle/akşam satırları.",
    "PlanEkleModal: Tarif ID'si, tarih ve öğün seçerek plan ekler.",
    "Silme: Kaydırma veya uzun basışla plan öğesi kaldırılır.",
    "AsyncStorage cache: Yüklenen haftalar offline görüntülenebilir.",
]:
    add_bullet(item)

# 4.9 shopping.tsx
add_hr()
add_h2("4.9  app/(tabs)/shopping.tsx — Alışveriş Listesi")
add_body("Eksik malzemeleri alışveriş listesi olarak yöneten ekran.")
for item in [
    "ShoppingListContext: AsyncStorage'dan liste okunur/yazılır.",
    "Manuel ekleme: TextInput ile serbest malzeme girişi.",
    "Otomatik doldurma: Tarif detayındaki 'eksik malzemeler' buraya aktarılabilir.",
    "Checkbox: Satın alınanları işaretleme ve gizleme.",
    "Pazar entegrasyonu: A101, Migros, Getir, Trendyol logo linkleri (assets/images/).",
    "Paylaşma: Share API ile liste metin olarak paylaşılır.",
]:
    add_bullet(item)

# 4.10 profile.tsx
add_hr()
add_h2("4.10  app/(tabs)/profile.tsx — Profil Ekranı")
add_body("Kullanıcı bilgileri, diyet tercihleri ve uygulama ayarları.")
for item in [
    "useAuth(): kullaniciAdi, diyetTercihleri, cikisYap().",
    "Diyet tercihleri gösterimi: Badge/chip formatında (vejetaryen, vegan vb.).",
    "Arama geçmişine link: /search-history ekranına navigate.",
    "Çıkış yapma: Confirm dialog → cikisYap() → /login'e yönlendirme.",
    "Edit profil: /edit-profile ekranına navigate.",
]:
    add_bullet(item)

# 4.11 recipe/[id].tsx
add_hr()
add_h2("4.11  app/recipe/[id].tsx — Tarif Detayı")
add_body("Seçilen tarifin tüm detaylarını gösteren dinamik route ekranı.")
for item in [
    "useLocalSearchParams(): URL'den recipe id ve kaynak (spoonacular/themealdb) alınır.",
    "useEffect: /recipes/{id} veya /recipes/meal/{id} çağrısı.",
    "ScrollView: Tarif görseli (parallax), isim, kaynak, malzeme listesi, pişirme adımları.",
    "Favoriye Ekle: kalp ikonuna dokunulunca favoriEkle() veya favoriKaldir() çağrısı.",
    "Plana Ekle: PlanEkleModal açılır; tarih ve öğün seçilir.",
    "Alışverişe Ekle: Eksik malzemeler ShoppingListContext'e aktarılır.",
    "Puanlama: 5 yıldızlı rating bileşeni; POST /ratings.",
    "Tarif adımları: Numaralı liste, her adım ayrı kartında.",
]:
    add_bullet(item)

# 4.12 login.tsx
add_hr()
add_h2("4.12  app/login.tsx — Giriş / Kayıt Ekranı")
add_body("Kimlik doğrulama ekranı; giriş ve kayıt formlarını tek sayfada sunar.")
for item in [
    "useState: mod ('giris' | 'kayit'), kullaniciAdi, sifre, yukleniyor, hata.",
    "girisYap(): useAuth().girisYap() çağrısı → başarıda /(tabs)'a navigate.",
    "kayitOl(): useAuth().kayitOl() → başarıda otomatik giriş.",
    "Form validasyonu: Boş alan, min 6 karakter şifre kontrolü.",
    "Klavye uyumluluğu: KeyboardAvoidingView — klavye açılınca form yukarı kayar.",
    "Animasyon: Logo fade-in, form slide-up animasyonu.",
]:
    add_bullet(item)

# 4.13 onboarding.tsx
add_hr()
add_h2("4.13  app/onboarding.tsx — Karşılama Ekranı")
add_body("İlk açılışta kullanıcıya uygulamayı tanıtan onboarding akışı.")
for item in [
    "AsyncStorage kontrolü: 'onboarding_done' anahtarı varsa doğrudan /login'e yönlendirir.",
    "3 sayfalık swipe carousel: FlatList ile yatay kaydırma.",
    "Sayfa 1: 'Buzdolabını tara' — kamera ikonu.",
    "Sayfa 2: 'Akıllı tarif önerileri' — tarif ikonu.",
    "Sayfa 3: 'Yemek planla' — takvim ikonu.",
    "Son sayfada 'Başla' butonu: AsyncStorage'a 'onboarding_done' yazar, /login'e git.",
]:
    add_bullet(item)

# 4.14 live-scan.tsx
add_hr()
add_h2("4.14  app/live-scan.tsx — Canlı Kamera Tarama")
add_body("Expo Camera ile gerçek zamanlı görüntü yakalama ve analiz.")
for item in [
    "Camera.requestCameraPermissionsAsync(): İzin istenir; reddedilirse uyarı gösterilir.",
    "CameraView bileşeni: Arka kamera, otomatik odak.",
    "Fotoğraf çekme: camera.takePictureAsync({quality: 0.8, base64: true}).",
    "Preview: Çekilen görüntü önizleme modal'ı.",
    "Gönder: Base64 → FormData → /detect-ingredients/ POST.",
    "Sonuç: Tespit edilen malzemeler + tarif önerileri ana ekrana aktarılır.",
    "Tekrar çek: Preview'ı kapatıp yeni fotoğraf.",
]:
    add_bullet(item)

# 4.15 hybrid.tsx
add_hr()
add_h2("4.15  app/hybrid.tsx — Hibrit Mod Ekranı")
add_body("Görsel analiz ve NLP modelini birlikte kullanan hibrit öneri ekranı.")
for item in [
    "Görsel seçme: ImagePicker veya kamera.",
    "Ek metin girişi: Görsel tespiti tamamlayacak ek malzeme metni.",
    "/hybrid-suggest/ POST: multipart/form-data ile görsel + metin gönderilir.",
    "Yanıt: tespit_edilen_malzemeler (YOLO) + nlp_onerileri (Llama) ayrı bölümlerde gösterilir.",
    "Çevrimdışı: İnternet yoksa yalnızca Llama çıktısı gösterilir.",
]:
    add_bullet(item)

# 4.16 search-history.tsx
add_hr()
add_h2("4.16  app/search-history.tsx — Arama Geçmişi")
add_body("Kullanıcının önceki aramalarını listeler ve yönetir.")
for item in [
    "useSearchHistory(): gecmis, kaldir(), tumunuSil() fonksiyonları.",
    "FlatList: Arama sorgusu, mod (metin/görsel), tarih sütunları.",
    "Silme: Swipe-to-delete ile tek kayıt.",
    "Tümünü Sil: Confirm dialog → /search-history DELETE endpoint.",
    "Aramaya Dön: Listeden bir sorguya dokunulunca ana ekranda otomatik arama.",
]:
    add_bullet(item)

# 4.17 edit-profile.tsx
add_hr()
add_h2("4.17  app/edit-profile.tsx — Profil Düzenleme")
add_body("Diyet tercihlerini güncelleme ekranı.")
for item in [
    "Tercih seçenekleri: ['vejetaryen', 'vegan', 'glutensiz', 'süt ürünsüz', 'fıstıksız', 'diyabet dostu']",
    "Çoklu seçim: Toggle chip'ler.",
    "Kaydet: profilGuncelle(tercihler) → PUT /auth/profile.",
    "Değişiklik yoksa kaydet butonu pasif.",
]:
    add_bullet(item)

# 4.18 context/
add_hr()
add_h2("4.18  context/ — Global Durum Yönetimi")
add_body(
    "React Context API ile uygulama genelinde paylaşılan state yönetimi. "
    "Her context, ilgili domain'i kapsar."
)

add_h3("AuthContext.tsx (174 satır)")
add_code("""type AuthState = {
  token: string | null;           // JWT token (SecureStore)
  kullaniciAdi: string | null;    // Kullanıcı adı (SecureStore)
  diyetTercihleri: string[];      // Diyet tercihleri (SecureStore)
  yukleniyor: boolean;
  girisYap: (k, s) => Promise<string|null>;   // null=başarı, string=hata
  kayitOl:  (k, s) => Promise<string|null>;
  cikisYap: () => Promise<void>;
  profilGuncelle: (t) => Promise<string|null>;
};""")
for item in [
    "SecureStore: 'ecochef_token', 'ecochef_user', 'ecochef_diet' anahtarları.",
    "App state listener: AppState.addEventListener('change', ...) → ön plana gelince token geçerliliği kontrol edilir.",
    "Token expire: JWT payload'dan exp çıkarılır; süresi dolmuşsa otomatik cikisYap().",
]:
    add_bullet(item)

add_h3("FavoritesContext.tsx")
add_code("""type FavoriTarif = { id, isim, gorsel?, kaydedilmeTarihi };

favoriEkle(tarif): POST /favorites   → optimistik ekleme
favoriKaldir(tarif): DELETE /favorites/{id} → optimistik kaldırma
favoriMi(tarif): boolean → local array kontrolü (O(1))""")

add_h3("MealPlanContext.tsx")
add_code("""yukle(hafta_basi: string): GET /meal-plan?hafta_basi=...
planEkle({tarih, ogun, recipe_id, recipe_isim, recipe_gorsel}): POST /meal-plan
planKaldir(id): DELETE /meal-plan/{id}

AsyncStorage key: 'meal_plan_{hafta_basi}'  → offline cache""")

add_h3("ShoppingListContext.tsx")
add_code("""items: { id, isim, satin_alindi: boolean }[]
ekle(isim), kaldir(id), togglEt(id), temizle()
AsyncStorage key: 'shopping_list'""")

# 4.19 hooks/
add_hr()
add_h2("4.19  hooks/ — Özel React Hooks")
add_table(
    ["Hook", "Dosya", "Amacı"],
    [
        ["useSearchHistory", "use-search-history.ts", "Arama geçmişi CRUD; backend + AsyncStorage sync"],
        ["useRecipeCache", "use-recipe-cache.ts", "Son 10 tarif sonucunu AsyncStorage'a önbellekler"],
        ["useNotifications", "use-notifications.ts", "Expo Notifications ile öğün vakti bildirimleri"],
        ["useNetworkStatus", "use-network-status.ts", "NetInfo ile çevrimiçi/çevrimdışı durum izleme"],
        ["usePersonalizedSuggestions", "use-personalized-suggestions.ts", "Diyet × favoriler kombinasyonu ile kişisel öneriler"],
        ["useColorScheme", "useColorScheme.ts", "Sistem dark/light modu dinleyicisi"],
        ["useThemeColor", "useThemeColor.ts", "Tema rengini bileşene inject eden utility"],
    ]
)

add_h3("use-search-history.ts (detay)")
for item in [
    "Backend senkronizasyonu: yukle() çağrısında GET /search-history; sonuç state'e ve AsyncStorage'a yazılır.",
    "kaydet(sorgu, mod): POST /search-history → başarıda local state'e ekler.",
    "kaldir(id): DELETE /search-history/{id} → state'ten çıkarır.",
    "tumunuSil(): DELETE /search-history → AsyncStorage temizler.",
    "sonBes: Computed — gecmis.slice(0, 5). Ana ekran son aramalar için.",
]:
    add_bullet(item)

# 4.20 components/
add_hr()
add_h2("4.20  components/ — Yeniden Kullanılabilir UI Bileşenleri")
add_table(
    ["Bileşen", "Dosya", "Açıklama"],
    [
        ["Toast", "Toast.tsx", "Ekranın altında görünen geçici bildirim mesajı (auto-dismiss)"],
        ["OfflineBanner", "OfflineBanner.tsx", "İnternet yoksa ekranın üstünde sarı uyarı şeridi"],
        ["GlassScreen", "GlassScreen.tsx", "Frosted glass blur arka planlı ekran container'ı"],
        ["RecipeSkeleton", "RecipeSkeleton.tsx", "Tarif yüklenirken gösterilen gri placeholder animasyonu"],
        ["PlanEkleModal", "PlanEkleModal.tsx", "Yemek planına tarif eklemek için tarih+öğün seçim modalı"],
        ["AnimatedButton", "AnimatedButton.tsx", "Dokunuşta scale animasyonu olan baskı efektli buton"],
        ["GlassCard", "GlassCard.tsx", "Cam efektli yuvarlak kenarlı kart bileşeni"],
        ["ThemedText", "ThemedText.tsx", "Aktif temaya göre renk değiştiren Text bileşeni"],
        ["ThemedView", "ThemedView.tsx", "Aktif temaya göre arka plan rengi değiştiren View"],
        ["ParallaxScrollView", "ParallaxScrollView.tsx", "Kaydırmaya göre başlık görselinin paralaks efekti"],
        ["HapticTab", "HapticTab.tsx", "Sekme değişiminde titreşim feedback'i olan tab butonu"],
        ["IconSymbol", "ui/icon-symbol.tsx", "SF Symbols (iOS) ve MaterialIcons (Android) birleştirici"],
    ]
)

# 4.21 utils/api.ts
add_hr()
add_h2("4.21  utils/api.ts — API Yardımcı Katmanı")
add_body("Backend URL sabiti, ortak header'lar ve yanıt dönüştürme yardımcılarını içerir.")
add_code("""export const BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

export const NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' };

export const AUTH_HEADER = (token: string) => ({
  Authorization: `Bearer ${token}`,
  ...NGROK_HEADER,
});""")
for item in [
    "parseHata(res, varsayilan): HTTP status kodunu Türkçe hata mesajına çevirir. "
     "401→'Oturum süresi doldu', 429→'Çok fazla istek. 30 saniye bekleyin', 500→'Sunucu hatası'.",
    "favoriYanitMap(f): Backend snake_case → Frontend camelCase dönüşümü. "
     "recipe_id→id, recipe_isim→isim, kaydedilme_tarihi→kaydedilmeTarihi.",
    "planYanitMap(p): MealPlan yanıtı dönüştürücü.",
    "EXPO_PUBLIC_BACKEND_URL: Çevre değişkeni. Docker'da 'http://backend:8000', "
     "yerel geliştirmede ngrok URL'si.",
]:
    add_bullet(item)

# 4.22 locales & i18n
add_hr()
add_h2("4.22  locales/ & i18n/ — Çok Dilli Destek")
add_body("i18n-js kütüphanesi ile tam İngilizce/Türkçe desteği.")
for item in [
    "i18n/index.ts: expo-localization.getLocales()[0].languageTag ile cihaz dili algılanır. "
     "I18n.locale = 'tr' veya 'en'.",
    "locales/tr.json: Türkçe çeviriler. 1000+ anahtar. Namespace'ler: common, auth, home, "
     "recipes, favorites, mealplan, shopping, profile, onboarding, language.",
    "locales/en.json: İngilizce çeviriler. Aynı anahtar yapısı.",
    "Kullanım: import t from '@/i18n'; t('home.searchPlaceholder').",
    "Backend locale: Accept-Language header ile 'tr' veya 'en' gönderilir; "
     "backend çevirileri buna göre yapar.",
]:
    add_bullet(item)

# 4.23 constants/
add_hr()
add_h2("4.23  constants/ — Uygulama Sabitleri")
add_h3("constants/theme.ts")
for item in [
    "Colors: light ve dark nesneleri. text, background, tint, tabIconDefault, tabIconSelected.",
    "Ana vurgu rengi: #00A860 (EcoChef yeşili).",
]:
    add_bullet(item)
add_h3("constants/glass.ts")
for item in [
    "GLASS_STYLE: backgroundColor (rgba ile yarı-şeffaf), borderRadius, borderColor, overflow.",
    "GLASS_BLUR: expo-blur BlurView intensity değerleri.",
]:
    add_bullet(item)

# 4.24 mobile Dockerfile
add_hr()
add_h2("4.24  mobile/Dockerfile — Mobile Konteyner")
for step in [
    "FROM node:20-slim: Node.js 20 hafif Debian image.",
    "WORKDIR /app",
    "COPY package*.json + npm ci --legacy-peer-deps: Bağımlılıklar önce yüklenir.",
    "COPY . .: Uygulama kodu.",
    "EXPOSE 8081 19000 19001 19002: Expo Metro bundler ve DevTools portları.",
    "CMD ['npx', 'expo', 'start', '--lan', '--non-interactive']: LAN modunda başlatma.",
    "EXPO_PUBLIC_BACKEND_URL: docker-compose.yml'den enjekte edilir.",
]:
    add_bullet(step)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════════════════
#  BÖLÜM 5 — DOCKER
# ═══════════════════════════════════════════════════════════════════════════════
add_h1("5. DOCKER & ALTYAPI")

add_hr()
add_h2("5.1  docker-compose.yml — Servis Orkestrasyonu")
add_body("Üç servisi tek komutla ayağa kaldıran Docker Compose konfigürasyonu.")
add_table(
    ["Servis", "Image", "Port(lar)", "Depends On", "Volume"],
    [
        ["mysql", "mysql:8.4", "3306", "—", "ecochef_mysql:/var/lib/mysql"],
        ["backend", "Python 3.12 (build)", "8000", "mysql (healthy)", "./models:/app/models"],
        ["mobile", "Node 20 (build)", "8081, 19000-19002", "backend (healthy)", "—"],
    ]
)
for item in [
    "ecochef_network: Bridge driver. Servisler birbirini servis adıyla bulur (mysql, backend).",
    "ecochef_mysql volume: MySQL verisi container yeniden başlatıldığında korunur.",
    "Healthcheck (mysql): mysqladmin ping -h localhost --interval=5s --retries=10.",
    "Healthcheck (backend): curl -f http://localhost:8000/docs --interval=10s --retries=5.",
    "restart: unless-stopped: Crash'lerde otomatik yeniden başlatma.",
]:
    add_bullet(item)

add_hr()
add_h2("5.2  .env Dosyaları — Ortam Değişkenleri")
add_body("Hassas yapılandırma değerleri .env dosyasında saklanır; kaynak kontrolüne eklenmez.")
add_h3("backend/.env.example")
add_code("""SPOONACULAR_API_KEY=your_key_here
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=ecochef
MYSQL_PASSWORD=secret
MYSQL_DB=ecochef
JWT_SECRET=minimum_32_karakter_gizli_anahtar
YOLO_MODEL_PATH=/app/models/yolov8n.pt
LLM_MODEL_PATH=/app/models/model.gguf
TRANSLATE_RECIPES=true""")

add_h3("mobile/.env.example")
add_code("""EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000""")
add_note("Android emülatöründe 10.0.2.2 localhost'a karşılık gelir. Gerçek cihazda ngrok URL kullanılır.")

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════════════════
#  BÖLÜM 6 — VERİTABANI ŞEMASI
# ═══════════════════════════════════════════════════════════════════════════════
add_h1("6. VERİTABANI ŞEMASI")
add_body("MySQL 8.4 veritabanı; SQLAlchemy modelleri tarafından otomatik oluşturulur.")

add_h2("Tablo: users")
add_table(
    ["Sütun", "Tip", "Kısıtlama", "Açıklama"],
    [
        ["id", "INTEGER", "PK, AUTO_INCREMENT", "Benzersiz kullanıcı kimliği"],
        ["kullanici_adi", "VARCHAR(30)", "UNIQUE, NOT NULL", "Kullanıcı adı"],
        ["sifre_hash", "VARCHAR(256)", "NOT NULL", "PBKDF2 hash (salt:hash)"],
        ["dietary_preferences", "TEXT", "NULL", "JSON string: ['vejetaryen', ...]"],
    ]
)

add_h2("Tablo: favorites")
add_table(
    ["Sütun", "Tip", "Kısıtlama", "Açıklama"],
    [
        ["id", "INTEGER", "PK", ""],
        ["user_id", "INTEGER", "FK→users.id", "Sahip kullanıcı"],
        ["recipe_id", "INTEGER", "NOT NULL", "Tarif ID (Spoonacular/MealDB)"],
        ["recipe_isim", "VARCHAR(255)", "NOT NULL", "Tarif adı (çevrilmiş)"],
        ["recipe_gorsel", "TEXT", "NULL", "Görsel URL"],
        ["kaydedilme_tarihi", "DATETIME", "DEFAULT NOW()", "Eklenme zamanı"],
    ]
)

add_h2("Tablo: meal_plans")
add_table(
    ["Sütun", "Tip", "Kısıtlama", "Açıklama"],
    [
        ["id", "INTEGER", "PK", ""],
        ["user_id", "INTEGER", "FK→users.id", "Sahip kullanıcı"],
        ["tarih", "VARCHAR(10)", "NOT NULL", "YYYY-MM-DD formatı"],
        ["ogun", "VARCHAR(20)", "NOT NULL", "kahvalti|ogle|aksam"],
        ["recipe_id", "INTEGER", "NULL", "Tarif ID"],
        ["recipe_isim", "VARCHAR(255)", "NOT NULL", "Tarif adı"],
        ["recipe_gorsel", "TEXT", "NULL", "Görsel URL"],
    ]
)

add_h2("Tablo: recipe_ratings")
add_table(
    ["Sütun", "Tip", "Kısıtlama", "Açıklama"],
    [
        ["id", "INTEGER", "PK", ""],
        ["user_id", "INTEGER", "FK→users.id", "Puanlayan kullanıcı"],
        ["recipe_id", "INTEGER", "NOT NULL", "Puanlanan tarif"],
        ["recipe_isim", "VARCHAR(255)", "", "Tarif adı"],
        ["puan", "INTEGER", "1-5 CHECK", "Kullanıcı puanı"],
        ["tarih", "DATETIME", "DEFAULT NOW()", "Puanlama zamanı"],
    ]
)

add_h2("Tablo: search_history")
add_table(
    ["Sütun", "Tip", "Kısıtlama", "Açıklama"],
    [
        ["id", "INTEGER", "PK", ""],
        ["user_id", "INTEGER", "FK→users.id", "Arayan kullanıcı"],
        ["sorgu", "TEXT", "NOT NULL", "Arama metni veya 'görsel tarama'"],
        ["mod", "VARCHAR(10)", "NOT NULL", "metin|gorsel"],
        ["tarih", "DATETIME", "DEFAULT NOW()", "Arama zamanı"],
    ]
)

add_h2("Tablo: revoked_tokens")
add_table(
    ["Sütun", "Tip", "Kısıtlama", "Açıklama"],
    [
        ["id", "INTEGER", "PK", ""],
        ["token", "TEXT", "UNIQUE, NOT NULL", "İptal edilen JWT string"],
        ["iptal_tarihi", "DATETIME", "DEFAULT NOW()", "İptal zamanı"],
    ]
)
add_note("revoked_tokens tablosu zamanla büyüyebilir. Expired token'ların periyodik temizliği için "
         "cron job tavsiye edilir.")

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════════════════
#  BÖLÜM 7 — API ENDPOINT HARİTASI
# ═══════════════════════════════════════════════════════════════════════════════
add_h1("7. API ENDPOINT HARİTASI")

add_table(
    ["Method", "Endpoint", "Auth", "Request Body / Params", "Response"],
    [
        ["POST", "/auth/register", "Hayır", "KayitIstegi {kullanici_adi, sifre}", "TokenYanit"],
        ["POST", "/auth/login",    "Hayır", "KayitIstegi", "TokenYanit"],
        ["GET",  "/auth/me",       "Evet",  "—", "{kullanici_adi, diyetTercihleri}"],
        ["PUT",  "/auth/profile",  "Evet",  "{dietary_preferences: list[str]}", "başarı mesajı"],
        ["PUT",  "/auth/password", "Evet",  "{eski_sifre, yeni_sifre}", "başarı mesajı"],
        ["POST", "/auth/logout",   "Evet",  "—", "başarı mesajı"],
        ["POST", "/detect-ingredients/", "Evet", "multipart: file, diet?, max_calories? ...", "ImagePipelineResponse"],
        ["POST", "/analyze-text-ingredients/", "Evet", "TextInput", "TextPipelineResponse"],
        ["POST", "/hybrid-suggest/", "Evet", "multipart: file?, text?, diet? ...", "HybridPipelineResponse"],
        ["GET",  "/recipes/random",   "Hayır", "?number=5&diet=", "list[Recipe]"],
        ["GET",  "/recipes/discover", "Hayır", "?cuisine=Turkish", "list[Recipe]"],
        ["GET",  "/recipes/{id}",     "Hayır", "path: id (int)", "Recipe"],
        ["GET",  "/recipes/meal/{meal_id}", "Hayır", "path: meal_id (str)", "Recipe"],
        ["GET",  "/favorites",        "Evet",  "—", "list[FavoriteItem]"],
        ["POST", "/favorites",        "Evet",  "FavoriteRequest", "FavoriteItem"],
        ["DELETE","/favorites/{id}",  "Evet",  "path: recipe_id", "başarı"],
        ["GET",  "/meal-plan",        "Evet",  "?hafta_basi=2026-05-26", "list[PlanItem]"],
        ["POST", "/meal-plan",        "Evet",  "MealPlanRequest", "PlanItem"],
        ["DELETE","/meal-plan/{id}",  "Evet",  "path: plan_id", "başarı"],
        ["POST", "/ratings",          "Evet",  "RatingRequest {recipe_id, puan}", "başarı"],
        ["GET",  "/ratings/{id}",     "Hayır", "path: recipe_id", "list[Rating]"],
        ["GET",  "/search-history",   "Evet",  "—", "list[SearchEntry]"],
        ["POST", "/search-history",   "Evet",  "SearchRequest {sorgu, mod}", "SearchEntry"],
        ["DELETE","/search-history/{id}", "Evet", "path: id", "başarı"],
        ["DELETE","/search-history",  "Evet",  "—", "başarı (tüm geçmiş)"],
    ]
)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════════════════
#  BÖLÜM 8 — GÜVENLİK MİMARİSİ
# ═══════════════════════════════════════════════════════════════════════════════
add_h1("8. GÜVENLİK MİMARİSİ")

add_h2("Kimlik Doğrulama")
for item in [
    "JWT (JSON Web Token) HS256 algoritması ile imzalanır.",
    "30 günlük token süresi. exp claim her tokende zorunludur.",
    "Çıkış yapılınca token RevokedToken tablosuna eklenir (blacklist).",
    "Her korumalı endpoint get_current_user() bağımlılığı ile token doğrular.",
    "Token blacklist kontrolü SELECT EXISTS ile minimal veritabanı yükü.",
]:
    add_bullet(item)

add_h2("Şifre Güvenliği")
for item in [
    "PBKDF2-SHA256: 260.000 iteration (OWASP 2024 önerisi ≥210.000).",
    "16 byte rastgele salt: Her kullanıcı için benzersiz; rainbow table saldırıları önlenir.",
    "hmac.compare_digest(): Zamanlama saldırısına (timing attack) karşı güvenli karşılaştırma.",
    "Şifre asla plain-text saklanmaz; yanıtlarda şifre hash'i gönderilmez.",
]:
    add_bullet(item)

add_h2("API Güvenliği")
for item in [
    "Rate Limiting (slowapi): /detect-ingredients/ 10/dk, /analyze-text-ingredients/ 20/dk.",
    "Pydantic validasyon: Tüm input'lar tip ve değer doğrulamasından geçer; 422 ile reddedilir.",
    "API anahtarları .env'de; .gitignore ile kaynak kontrolünün dışında.",
    "Hassas ortam değişkenleri Docker secrets veya .env ile inject edilir.",
]:
    add_bullet(item)

add_h2("Mobile Güvenliği")
for item in [
    "JWT Expo SecureStore: iOS Keychain ve Android Keystore'da şifreli saklanır.",
    "AsyncStorage yalnızca hassas olmayan önbellek verisi için kullanılır.",
    "Token expire kontrolü: Uygulama ön plana gelince token geçerliliği kontrol edilir.",
    "HTTPS: Production'da tüm API istekleri HTTPS üzerinden yapılmalıdır.",
]:
    add_bullet(item)

doc.add_page_break()

# ═══════════════════════════════════════════════════════════════════════════════
#  BÖLÜM 9 — ÖZET TABLO
# ═══════════════════════════════════════════════════════════════════════════════
add_h1("9. ÖZET TABLO — TÜM DOSYALAR")
add_table(
    ["Dosya", "Kat.", "Satır", "Teknoloji", "Ana İşlev"],
    [
        ["main.py", "Backend", "548", "FastAPI", "42 REST endpoint, CORS, rate limit, auth middleware"],
        ["core/config.py", "Backend", "~50", "Pydantic Settings", "Ortam değişkeni yönetimi"],
        ["core/database.py", "Backend", "101", "SQLAlchemy 2.0", "6 tablo modeli, session yönetimi"],
        ["core/auth.py", "Backend", "69", "python-jose, hashlib", "JWT oluştur/doğrula, PBKDF2 şifre"],
        ["core/orchestrator.py", "Backend", "270", "Python", "3 AI pipeline koordinasyonu"],
        ["core/ingredient_translator.py", "Backend", "185", "Python dict", "EN↔TR malzeme sözlüğü + parse"],
        ["core/translator.py", "Backend", "~40", "deep-translator", "LRU cache Google Translate"],
        ["core/logger.py", "Backend", "107", "logging", "Hiyerarşik log, süre ölçümü"],
        ["core/request_context.py", "Backend", "~20", "ContextVar", "Per-request locale ve user_id"],
        ["agents/vision_agent.py", "Backend", "67", "YOLO v8, PyTorch", "Görüntüden malzeme tespiti"],
        ["agents/nlp_agent.py", "Backend", "152", "Llama GGUF", "Yerel LLM tarif önerileri"],
        ["connectors/spoonacular.py", "Backend", "252", "requests", "365K+ tarif API bağlayıcısı"],
        ["connectors/themealdb.py", "Backend", "225", "requests", "Ücretsiz tarif API bağlayıcısı"],
        ["schemas/recipe.py", "Backend", "~30", "Pydantic", "Tarif veri modeli"],
        ["schemas/ingredient.py", "Backend", "~25", "Pydantic", "Malzeme input/NLP öneri modeli"],
        ["schemas/user.py", "Backend", "~20", "Pydantic", "Kullanıcı kayıt/token modeli"],
        ["schemas/response.py", "Backend", "~30", "Pydantic", "3 pipeline yanıt modeli"],
        ["requirements.txt", "Backend", "~40", "pip", "Python bağımlılıkları (pinlenmiş)"],
        ["backend/Dockerfile", "Docker", "~20", "Docker", "Python 3.12 container build"],
        ["app.json", "Mobile", "~40", "Expo", "Uygulama meta ve plugin konfigürasyonu"],
        ["package.json", "Mobile", "~60", "npm", "Bağımlılıklar ve expo scripts"],
        ["app/_layout.tsx", "Mobile", "~60", "Expo Router", "Kök provider ve navigasyon stack"],
        ["app/(tabs)/_layout.tsx", "Mobile", "~50", "React Navigation", "Alt sekme navigasyonu"],
        ["app/(tabs)/index.tsx", "Mobile", "~200", "React Native", "Ana ekran (arama + sonuçlar)"],
        ["app/(tabs)/explore.tsx", "Mobile", "~150", "React Native", "Keşfet + mutfak filtreleme"],
        ["app/(tabs)/favorites.tsx", "Mobile", "~120", "React Native", "Favori tarifleri yönet"],
        ["app/(tabs)/plan.tsx", "Mobile", "~180", "React Native", "Haftalık yemek planı"],
        ["app/(tabs)/shopping.tsx", "Mobile", "~140", "React Native", "Alışveriş listesi"],
        ["app/(tabs)/profile.tsx", "Mobile", "~100", "React Native", "Kullanıcı profili"],
        ["app/recipe/[id].tsx", "Mobile", "~200", "Expo Router", "Dinamik tarif detay ekranı"],
        ["app/login.tsx", "Mobile", "~150", "React Native", "Giriş ve kayıt formu"],
        ["app/onboarding.tsx", "Mobile", "~100", "React Native", "İlk açılış tanıtım carousel"],
        ["app/live-scan.tsx", "Mobile", "~150", "Expo Camera", "Canlı kamera ile malzeme tarama"],
        ["app/hybrid.tsx", "Mobile", "~130", "React Native", "Görsel + NLP hibrit öneri"],
        ["app/search-history.tsx", "Mobile", "~100", "React Native", "Arama geçmişi görüntüleme"],
        ["app/edit-profile.tsx", "Mobile", "~80", "React Native", "Diyet tercihleri düzenleme"],
        ["context/AuthContext.tsx", "Mobile", "174", "React Context", "JWT auth state yönetimi"],
        ["context/FavoritesContext.tsx", "Mobile", "~80", "React Context", "Favori liste state"],
        ["context/MealPlanContext.tsx", "Mobile", "~100", "React Context", "Yemek planı state"],
        ["context/ShoppingListContext.tsx", "Mobile", "~60", "React Context", "Alışveriş listesi state"],
        ["hooks/use-search-history.ts", "Mobile", "142", "React Hook", "Arama geçmişi CRUD hook"],
        ["hooks/use-recipe-cache.ts", "Mobile", "~60", "React Hook", "Tarif önbellek yönetimi"],
        ["hooks/use-notifications.ts", "Mobile", "~80", "Expo Notif.", "Push bildirim yönetimi"],
        ["hooks/use-network-status.ts", "Mobile", "~40", "NetInfo", "Çevrimiçi durum izleme"],
        ["utils/api.ts", "Mobile", "94", "TypeScript", "API helper, header, yanıt dönüştürme"],
        ["locales/tr.json", "Mobile", "1000+", "JSON", "Türkçe çeviriler"],
        ["locales/en.json", "Mobile", "1000+", "JSON", "İngilizce çeviriler"],
        ["i18n/index.ts", "Mobile", "~20", "i18n-js", "Dil algılama ve çeviri kurulumu"],
        ["constants/theme.ts", "Mobile", "~20", "TS const", "Renk paleti ve tema değerleri"],
        ["constants/glass.ts", "Mobile", "~15", "TS const", "Frosted glass stil sabitleri"],
        ["components/Toast.tsx", "Mobile", "~50", "React Native", "Geçici bildirim mesajı"],
        ["components/GlassScreen.tsx", "Mobile", "~30", "Expo Blur", "Cam efektli ekran container"],
        ["components/RecipeSkeleton.tsx", "Mobile", "~40", "React Native", "Yükleme placeholder animasyonu"],
        ["components/PlanEkleModal.tsx", "Mobile", "~80", "React Native", "Yemek planına ekleme modalı"],
        ["mobile/Dockerfile", "Docker", "~15", "Docker", "Node 20 Expo container"],
        ["docker-compose.yml", "Docker", "~80", "Docker Compose", "3 servis orkestrasyonu"],
    ]
)

# ─── Son ───────────────────────────────────────────────────────────────────────
doc.add_paragraph()
add_hr()
footer_p = doc.add_paragraph()
footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
fr = footer_p.add_run(
    f"EcoChef Teknik Dokümantasyon  •  "
    f"Otomatik Üretildi  •  {datetime.date.today().strftime('%d.%m.%Y')}"
)
fr.font.size = Pt(9)
fr.font.color.rgb = RGBColor(150, 150, 150)
fr.font.italic = True

out = r"c:\Users\berka\EcoChef\EcoChef_Teknik_Dokumantasyon.docx"
doc.save(out)
print(f"OK  Dokuman olusturuldu: {out}")
