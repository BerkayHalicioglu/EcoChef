# EcoChef — Sistem Diyagramları

> Yapay Zeka Destekli Akıllı Mutfak Asistanı  
> FastAPI Backend + React Native (Expo) Mobile + Docker + MySQL

---

## 1. Genel Sistem Mimarisi

```mermaid
graph TB
    subgraph DOCKER["🐳 Docker Compose"]
        subgraph BACKEND["🖥️ Backend Container (Python 3.12)"]
            API["FastAPI :8000"]
            YOLO["YOLO v8\nGörüntü Tanıma"]
            LLM["Llama GGUF\nDoğal Dil İşleme"]
            ORC["Orchestrator\n3 Pipeline"]
            AUTH["Auth Module\nJWT + PBKDF2"]
            TRANS["deep-translator\nTürkçe Çeviri"]
            RATE["slowapi\nRate Limiter"]
        end

        subgraph DB_CONT["🗄️ MySQL Container (8.4)"]
            MYSQL["MySQL :3306\necochef DB"]
        end

        subgraph MOBILE["📱 Mobile Container (Node 20)"]
            EXPO["Expo / React Native\nMetro Bundler :8081"]
        end

        subgraph VOLUMES["💾 Docker Volumes"]
            VOL_DB["ecochef_mysql\n(kalıcı veri)"]
            VOL_MODEL["models/\n.pt + .gguf"]
        end
    end

    subgraph EXTERNAL["🌐 Dış Servisler"]
        SPOON["Spoonacular API\n365.000+ tarif"]
        MEALDB["TheMealDB API\nÜcretsiz fallback"]
        GOOGLE["Google Translate"]
    end

    PHONE["📱 Kullanıcı Telefonu\nExpo Go"]

    PHONE -->|"HTTP + JWT"| API
    PHONE -->|"Metro Bundler"| EXPO
    API --> ORC
    API --> AUTH
    API --> RATE
    ORC --> YOLO
    ORC --> LLM
    ORC --> TRANS
    ORC -->|"REST"| SPOON
    ORC -->|"REST fallback"| MEALDB
    TRANS -->|"çeviri"| GOOGLE
    AUTH --> MYSQL
    API --> MYSQL
    MYSQL --- VOL_DB
    YOLO --- VOL_MODEL
    LLM --- VOL_MODEL
```

---

## 2. Pipeline Akış Diyagramları

### 2a. Görsel Analiz Pipeline (Pipeline 1)

```mermaid
sequenceDiagram
    actor Kullanıcı
    participant Mobile as 📱 Mobile App
    participant API as 🖥️ FastAPI
    participant YOLO as 🔍 YOLO Agent
    participant Spoon as 🌐 Spoonacular
    participant MealDB as 🍽️ TheMealDB
    participant Çeviri as 🌍 Translator

    Kullanıcı->>Mobile: Fotoğraf çek / Galeriden seç
    Mobile->>API: POST /detect-ingredients/ (multipart, JWT)
    Note over API: Rate limit: 10 istek/dk
    API->>YOLO: Görseli analiz et
    YOLO->>YOLO: YOLOv8 inference (conf ≥ 0.40)
    YOLO->>YOLO: COCO food sınıfı filtresi
    YOLO-->>API: [tomato, egg, cheese, ...]
    API->>Çeviri: EN → TR çevir (LRU cache)
    Çeviri-->>API: [domates, yumurta, peynir, ...]
    API->>Spoon: findByIngredients (+ diyet + beslenme filtresi)
    alt Spoonacular başarılı
        Spoon-->>API: Tarif listesi
    else Spoonacular başarısız / kota doldu
        API->>MealDB: search_by_ingredient() fallback
        MealDB-->>API: Tarif listesi
    end
    API->>Çeviri: Tarif isimlerini çevir
    Çeviri-->>API: Tarif listesi (TR)
    API-->>Mobile: ImagePipelineResponse { malzemeler, tarifler, mesaj }
    Mobile-->>Kullanıcı: Tarif kartları göster
```

### 2b. Metin Analizi Pipeline (Pipeline 2)

```mermaid
sequenceDiagram
    actor Kullanıcı
    participant Mobile as 📱 Mobile App
    participant API as 🖥️ FastAPI
    participant IT as 🔤 IngredientTranslator
    participant Spoon as 🌐 Spoonacular
    participant MealDB as 🍽️ TheMealDB
    participant Çeviri as 🌍 Translator

    Kullanıcı->>Mobile: "Evde tavuk, mantar ve soğan var..."
    Mobile->>API: POST /analyze-text-ingredients/ (JWT)
    Note over API: Rate limit: 20 istek/dk
    API->>IT: parse_and_translate(text)
    IT->>IT: Türkçe metni böl ve temizle
    IT->>IT: TR→EN sözlük araması (80+ giriş)
    IT-->>API: [chicken, mushroom, onion, ...]
    par Paralel API çağrıları
        API->>Spoon: complexSearch (+ diyet filtresi)
        API->>MealDB: search_by_ingredient()
    end
    Spoon-->>API: Spoonacular sonuçları
    MealDB-->>API: TheMealDB sonuçları
    API->>Çeviri: Sonuçları çevir ve birleştir
    API-->>Mobile: TextPipelineResponse { basari, sonuclar }
    Mobile-->>Kullanıcı: Öneri kartları göster
```

### 2c. Hibrit Pipeline (Pipeline 3 — Çevrimdışı Destekli)

```mermaid
sequenceDiagram
    actor Kullanıcı
    participant Mobile as 📱 Mobile App
    participant API as 🖥️ FastAPI
    participant YOLO as 🔍 YOLO Agent
    participant NLP as 🤖 NLP Agent (Llama)
    participant Çeviri as 🌍 Translator

    Note over Mobile,NLP: Internet olmadan da çalışır (yerel modeller)

    Kullanıcı->>Mobile: Fotoğraf çek + isteğe bağlı metin (Hibrit Mod)
    Mobile->>API: POST /hybrid-suggest/ (multipart)
    API->>YOLO: Görseli analiz et
    YOLO-->>API: Tespit edilen malzemeler (EN)
    API->>Çeviri: EN → TR çevir
    Çeviri-->>API: Malzemeler (TR)
    API->>NLP: Malzemeleri few-shot prompt ile ilet
    NLP->>NLP: Llama GGUF yerel inference
    NLP->>NLP: JSON parse (max 2 retry)
    NLP-->>API: [{ isim, neden }, ...]
    API-->>Mobile: HybridPipelineResponse { malzemeler, nlp_onerileri }
    Mobile-->>Kullanıcı: Görsel tespitler + Llama önerileri
```

---

## 3. Kimlik Doğrulama Akışı

```mermaid
sequenceDiagram
    actor Kullanıcı
    participant Mobile as 📱 Mobile App
    participant SecureStore as 🔒 SecureStore
    participant API as 🖥️ FastAPI
    participant DB as 🗄️ MySQL

    Kullanıcı->>Mobile: Kullanıcı adı + Şifre gir
    Mobile->>API: POST /auth/register veya /auth/login

    alt Kayıt
        API->>API: PBKDF2-SHA256 (260.000 iter, 16B salt)
        API->>DB: INSERT users (kullanici_adi, sifre_hash)
    else Giriş
        API->>DB: SELECT users WHERE kullanici_adi=?
        API->>API: hmac.compare_digest() — zamanlama saldırısına karşı
    end

    API->>API: JWT oluştur (HS256, 30 gün)
    API-->>Mobile: { access_token, kullanici_adi }
    Mobile->>SecureStore: Token + username kaydet

    Note over Mobile,API: Sonraki isteklerde...
    Mobile->>API: Authorization: Bearer <token>
    API->>DB: SELECT revoked_tokens WHERE token=?
    alt Token geçerli
        API-->>Mobile: 200 OK
    else Token iptal edilmiş / süresi dolmuş
        API-->>Mobile: 401 Unauthorized
        Mobile->>SecureStore: Token temizle → /login
    end

    Kullanıcı->>Mobile: Çıkış Yap
    Mobile->>API: POST /auth/logout
    API->>DB: INSERT revoked_tokens (token)
    Mobile->>SecureStore: Token sil
```

---

## 4. Veritabanı ER Diyagramı

```mermaid
erDiagram
    USERS {
        int id PK
        string kullanici_adi "UNIQUE"
        string sifre_hash "PBKDF2-SHA256"
        text dietary_preferences "JSON list"
    }

    FAVORITES {
        int id PK
        int user_id FK
        int recipe_id
        string recipe_isim
        text recipe_gorsel
        datetime kaydedilme_tarihi
    }

    MEAL_PLANS {
        int id PK
        int user_id FK
        string tarih "YYYY-MM-DD"
        string ogun "kahvalti|ogle|aksam"
        int recipe_id
        string recipe_isim
        text recipe_gorsel
    }

    RECIPE_RATINGS {
        int id PK
        int user_id FK
        int recipe_id
        string recipe_isim
        int puan "1-5"
        datetime tarih
    }

    SEARCH_HISTORY {
        int id PK
        int user_id FK
        text sorgu
        string mod "metin|gorsel"
        datetime tarih
    }

    REVOKED_TOKENS {
        int id PK
        text token "UNIQUE"
        datetime iptal_tarihi
    }

    USERS ||--o{ FAVORITES : "kaydeder"
    USERS ||--o{ MEAL_PLANS : "planlar"
    USERS ||--o{ RECIPE_RATINGS : "puanlar"
    USERS ||--o{ SEARCH_HISTORY : "arar"
    USERS ||--o{ REVOKED_TOKENS : "çıkış yapar"
```

---

## 5. Kullanıcı Akışı (User Flow)

```mermaid
flowchart TD
    START([Uygulama Açılır]) --> OB{Onboarding\nGörüldü mü?}
    OB -->|Hayır| ONBOARD[Onboarding\n3 sayfalık tanıtım]
    OB -->|Evet| AUTH_CHK

    ONBOARD --> AUTH_CHK{Token\nGeçerli mi?}
    AUTH_CHK -->|Hayır| LOGIN[Giriş / Kayıt Ekranı]
    AUTH_CHK -->|Evet| HOME

    LOGIN -->|Başarılı| HOME[Ana Ekran]

    HOME --> METHOD{Analiz Yöntemi}

    METHOD -->|📷 Görsel| IMG[Fotoğraf Çek / Galeri]
    METHOD -->|⌨️ Metin| TXT[Malzeme Yaz]
    METHOD -->|🎥 Canlı| LIVE[Canlı Kamera Tarama]
    METHOD -->|🔀 Hibrit| HYBRID[Hibrit Ekran\nGörsel + NLP]

    IMG --> SEND[Backend'e Gönder]
    TXT --> SEND
    LIVE --> SEND
    HYBRID --> SEND

    SEND --> RESULT{Sonuç}
    RESULT -->|Başarılı| CARDS[Tarif Kartları]
    RESULT -->|Çevrimdışı| CACHE[Önbellek Göster\nSon 10 Sonuç]
    RESULT -->|Hata| ERR[Toast Hata Mesajı]

    CARDS --> ACTION{Kullanıcı Eylemi}
    ACTION -->|❤️ Favori| FAV_ADD[Favoriye Ekle\nPOST /favorites]
    ACTION -->|📅 Plana Ekle| PLAN_MODAL[PlanEkleModal\nTarih + Öğün Seç]
    ACTION -->|🛒 Eksik Ekle| SHOP[Alışveriş Listesi\nAsyncStorage]
    ACTION -->|Tarife Tıkla| DETAIL[Tarif Detay\n/recipe/id]

    DETAIL --> DETAIL_ACT{Eylem}
    DETAIL_ACT -->|⭐ Puan Ver| RATE[POST /ratings\n1-5 yıldız]
    DETAIL_ACT -->|❤️ Favori| FAV_ADD
    DETAIL_ACT -->|📅 Plan| PLAN_MODAL
    DETAIL_ACT -->|🛒 Alışveriş| SHOP

    PLAN_MODAL --> PLAN_SAVE[POST /meal-plan]
    PLAN_SAVE --> PLAN_SCR[Yemek Planı Ekranı\nPzt–Paz / 3 Öğün]

    FAV_ADD --> FAV_SCR[Favorilerim Ekranı]

    subgraph TABS["Alt Sekmeler"]
        T1[🏠 Ana]
        T2[🔍 Keşfet]
        T3[❤️ Favoriler]
        T4[📅 Plan]
        T5[🛒 Alışveriş]
        T6[👤 Profil]
    end

    T6 --> PROFILE_ACT{Profil Eylemi}
    PROFILE_ACT -->|Düzenle| EDIT_PROF[Diyet Tercihleri\nPUT /auth/profile]
    PROFILE_ACT -->|Geçmiş| HIST[Arama Geçmişi\nGET /search-history]
    PROFILE_ACT -->|Çıkış| LOGOUT[POST /auth/logout\nToken blacklist]
```

---

## 6. API Endpoint Haritası

```mermaid
graph LR
    subgraph AUTH["🔐 Kimlik Doğrulama"]
        A1["POST /auth/register"]
        A2["POST /auth/login"]
        A3["GET /auth/me"]
        A4["PUT /auth/profile\nDiyet tercihleri"]
        A5["PUT /auth/password\nŞifre değiştir"]
        A6["POST /auth/logout\nToken blacklist"]
    end

    subgraph PIPELINE["⚙️ Analiz Pipeline'ları"]
        P1["POST /detect-ingredients/\nGörsel → YOLO → Spoonacular\n🔒 10/dk limit"]
        P2["POST /analyze-text-ingredients/\nMetin → Spoonacular + MealDB\n🔒 20/dk limit"]
        P3["POST /hybrid-suggest/\nGörsel → YOLO + Llama (Offline)"]
    end

    subgraph RECIPE["🍽️ Tarif & Keşfet"]
        R1["GET /recipes/random\nRastgele öneri"]
        R2["GET /recipes/discover\n?cuisine=Turkish"]
        R3["GET /recipes/{id}\nSpoonacular detay"]
        R4["GET /recipes/meal/{meal_id}\nTheMealDB detay"]
    end

    subgraph FAVORITES["❤️ Favoriler"]
        F1["GET /favorites"]
        F2["POST /favorites"]
        F3["DELETE /favorites/{recipe_id}"]
    end

    subgraph MEALPLAN["📅 Yemek Planı"]
        M1["GET /meal-plan?hafta_basi="]
        M2["POST /meal-plan"]
        M3["DELETE /meal-plan/{id}"]
    end

    subgraph RATINGS["⭐ Puanlama"]
        RT1["POST /ratings"]
        RT2["GET /ratings/{recipe_id}"]
    end

    subgraph HISTORY["🔍 Arama Geçmişi"]
        H1["GET /search-history"]
        H2["POST /search-history"]
        H3["DELETE /search-history/{id}"]
        H4["DELETE /search-history\nTümünü sil"]
    end

    JWT["🔑 JWT Bearer Token"] -->|gerekli| FAVORITES
    JWT -->|gerekli| MEALPLAN
    JWT -->|gerekli| RATINGS
    JWT -->|gerekli| HISTORY
    JWT -->|gerekli| A3
    JWT -->|gerekli| A4
    JWT -->|gerekli| A5
    JWT -->|gerekli| A6
    JWT -->|gerekli| PIPELINE
```

---

## 7. Mobile Uygulama Mimarisi

```mermaid
graph TB
    subgraph ROUTER["📁 Expo Router (Dosya Tabanlı)"]
        LAY["app/_layout.tsx\nKök Provider'lar"]
        TAB_LAY["app/(tabs)/_layout.tsx\nSekme Navigasyonu"]

        subgraph TABS["Sekmeler"]
            IDX["index.tsx\nAna Ekran"]
            EXP["explore.tsx\nKeşfet"]
            FAV["favorites.tsx\nFavoriler"]
            PLN["plan.tsx\nYemek Planı"]
            SHP["shopping.tsx\nAlışveriş"]
            PRF["profile.tsx\nProfil"]
        end

        subgraph SCREENS["Diğer Ekranlar"]
            LOGIN["login.tsx"]
            ONBOARD["onboarding.tsx"]
            RECIPE_D["recipe/[id].tsx"]
            LIVE["live-scan.tsx"]
            HYBRID["hybrid.tsx"]
            HIST["search-history.tsx"]
            EDIT_P["edit-profile.tsx"]
        end
    end

    subgraph CONTEXTS["🔄 Context (Global State)"]
        AUTH_CTX["AuthContext\nJWT + kullanıcı"]
        FAV_CTX["FavoritesContext\nFavori tarifler"]
        PLAN_CTX["MealPlanContext\nHaftalık plan"]
        SHOP_CTX["ShoppingListContext\nAlışveriş listesi"]
        I18N_CTX["I18nContext\nDil seçimi"]
        GLASS_CTX["GlassContext\nUI tema"]
    end

    subgraph HOOKS["🪝 Custom Hooks"]
        H_SH["useSearchHistory\nGeçmiş CRUD"]
        H_RC["useRecipeCache\nSon 10 önbellek"]
        H_NOT["useNotifications\nPush bildirim"]
        H_NET["useNetworkStatus\nÇevrimiçi durum"]
        H_PS["usePersonalizedSuggestions\nKişisel öneriler"]
        H_SL["useShoppingList\nAlışveriş hook"]
        H_TOAST["useToast\nBildirim mesajı"]
    end

    subgraph STORAGE["💾 Depolama"]
        SECURE["SecureStore\nJWT, kullanıcıAdı\ndiyet tercihleri"]
        ASYNC["AsyncStorage\nMeal plan cache\nAlışveriş listesi\nArama geçmişi\nOnboarding flag"]
    end

    LAY --> TAB_LAY
    TAB_LAY --> TABS
    LAY --> SCREENS
    LAY --> CONTEXTS
    CONTEXTS --> HOOKS
    HOOKS --> STORAGE
    AUTH_CTX --> SECURE
    PLAN_CTX --> ASYNC
    SHOP_CTX --> ASYNC
```

---

## 8. Özellikler Haritası

```mermaid
mindmap
  root((EcoChef))
    Yapay Zeka
      YOLO v8 Görüntü Tanıma
        Güven eşiği 0.40
        COCO food sınıfı filtresi
        Singleton model cache
      Llama GGUF NLP
        Yerel inference
        Few-shot prompt
        Max 2 retry
      Spoonacular API
        365.000+ tarif
        Beslenme bilgisi
        Diyet filtresi
        complexSearch + findByIngredients
      TheMealDB API
        Ücretsiz fallback
        Türk mutfağı araması
        20 malzemeye kadar
    Dil Desteği
      deep-translator
        EN → TR çeviri
        LRU cache 512 giriş
      Malzeme Sözlüğü
        80+ EN↔TR eşleşme
      i18n-js
        Türkçe tam destek
        İngilizce tam destek
        Cihaz dilini algılar
    Kullanıcı Yönetimi
      Kayıt ve Giriş
        JWT Token 30 gün
        PBKDF2-SHA256 260k iter
        Token blacklist
      Profil
        Diyet tercihleri güncelle
        Şifre değiştir
    Özellikler
      Favoriler
        Backend MySQL
        Optimistik UI
        Oturum arası kalıcı
      Haftalık Yemek Planı
        7 gün × 3 öğün
        AsyncStorage offline cache
        Hafta navigasyonu
      Alışveriş Listesi
        Eksik malzeme ekleme
        Tamamlandı işaretleme
        Pazar uygulama linkleri
      Tarif Puanlama
        1-5 yıldız sistemi
        MySQL'de kalıcı
      Arama Geçmişi
        Metin / görsel mod
        Backend + AsyncStorage sync
        Toplu silme
      Keşfet
        Rastgele tarif
        Mutfak bazlı filtreleme
      Diyet Filtresi
        Vejetaryen / Vegan
        Glutensiz
        Kalori, protein, karbonhidrat, yağ
      Canlı Kamera Tarama
        Expo Camera
        Fotoğraf önizleme
      Hibrit Mod
        YOLO + Llama birlikte
        Çevrimdışı çalışır
      Çevrimdışı Mod
        Son 10 sonuç önbellek
        useNetworkStatus
        OfflineBanner
      Bildirimler
        Expo Notifications
        Öğün vakti hatırlatma
    Altyapı
      Docker Compose
        Backend container
        MySQL container
        Mobile container
        Health check zinciri
      MySQL Veritabanı
        6 tablo
        SQLAlchemy ORM
        Pool pre-ping
      Rate Limiting
        slowapi
        10 istek/dk görsel
        20 istek/dk metin
      Güvenlik
        JWT HS256
        PBKDF2 260k iter
        SecureStore mobil
        Token blacklist
```

---

## 9. Teknoloji Yığını

```mermaid
graph TB
    subgraph MOBILE_STACK["📱 Mobile"]
        RN["React Native 0.81"]
        EXPO_SDK["Expo SDK 54"]
        TS["TypeScript 5.9"]
        ER["Expo Router ~6.0\nDosya tabanlı navigasyon"]
        CAM["expo-camera ~17\nKamera erişimi"]
        IMG_PICK["expo-image-picker ~17\nGaleri seçici"]
        AS["AsyncStorage 2.2\nOffline cache"]
        SS["SecureStore ~15\nJWT şifreli saklama"]
        NOTIF["expo-notifications ~0.31\nPush bildirim"]
        I18N["i18n-js + expo-localization\nÇok dilli destek"]
        BLUR["expo-blur\nFrosted glass efekt"]
    end

    subgraph BACKEND_STACK["🖥️ Backend"]
        FP["FastAPI 0.135.2"]
        UV["Uvicorn 0.42\nASGI Sunucu"]
        SA["SQLAlchemy 2.0.49\nORM"]
        PD["Pydantic 2.12.5\nVeri doğrulama"]
        JW["python-jose 3.5\nJWT"]
        SLOW["slowapi 0.1.9\nRate Limiting"]
        PY_MY["PyMySQL 1.1.1\nMySQL sürücüsü"]
    end

    subgraph AI_STACK["🤖 Yapay Zeka"]
        UL["Ultralytics 8.4\nYOLO v8"]
        TORCH["PyTorch 2.5 CPU"]
        LC["llama-cpp-python 0.3.18\nLLM Inference"]
        DT["deep-translator 1.11\nGoogle Translate"]
        SP["Spoonacular API\n365.000+ tarif"]
        MDB["TheMealDB API\nÜcretsiz fallback"]
    end

    subgraph INFRA["🐳 Altyapı"]
        DC["Docker Compose"]
        MY["MySQL 8.4\nVeritabanı"]
        PYBCR["passlib bcrypt\nŞifre yardımcısı"]
    end

    MOBILE_STACK -->|"HTTP + JWT"| BACKEND_STACK
    BACKEND_STACK --> AI_STACK
    BACKEND_STACK --> INFRA
```

---

## 10. Backend Dosya Yapısı

```mermaid
graph TD
    BE["backend/"]

    BE --> MAIN["main.py\n42 endpoint, CORS, rate limit"]
    BE --> REQ["requirements.txt\nPinlenmiş bağımlılıklar"]
    BE --> DOCK["Dockerfile\nPython 3.12 slim"]

    BE --> CORE["core/"]
    CORE --> CFG["config.py\nPydantic Settings"]
    CORE --> DB["database.py\n6 SQLAlchemy modeli"]
    CORE --> AUT["auth.py\nJWT + PBKDF2"]
    CORE --> ORC["orchestrator.py\n3 pipeline"]
    CORE --> IT["ingredient_translator.py\nEN↔TR sözlük"]
    CORE --> TR["translator.py\nLRU cache çeviri"]
    CORE --> LOG["logger.py\nHiyerarşik log"]
    CORE --> RC["request_context.py\nContextVar"]

    BE --> AGENTS["agents/"]
    AGENTS --> VA["vision_agent.py\nYOLO singleton"]
    AGENTS --> NA["nlp_agent.py\nLlama GGUF"]

    BE --> CONN["connectors/"]
    CONN --> SP["spoonacular.py\nAna API"]
    CONN --> MD["themealdb.py\nFallback API"]

    BE --> SCH["schemas/"]
    SCH --> RS["recipe.py"]
    SCH --> IS["ingredient.py"]
    SCH --> US["user.py"]
    SCH --> RE["response.py"]
```

---

## 11. Mobile Dosya Yapısı

```mermaid
graph TD
    MOB["mobile/"]

    MOB --> AJ["app.json\nExpo config"]
    MOB --> PJ["package.json\nNPM bağımlılıklar"]
    MOB --> MDOCK["Dockerfile\nNode 20 slim"]

    MOB --> APP["app/"]
    APP --> ROOT_LAY["_layout.tsx\nKök layout + providers"]
    APP --> TABS_DIR["(tabs)/"]
    TABS_DIR --> TAB_LAY["_layout.tsx\nSekme navigasyonu"]
    TABS_DIR --> IDX["index.tsx — Ana"]
    TABS_DIR --> EXP["explore.tsx — Keşfet"]
    TABS_DIR --> FAV["favorites.tsx — Favoriler"]
    TABS_DIR --> PLN["plan.tsx — Yemek Planı"]
    TABS_DIR --> SHP["shopping.tsx — Alışveriş"]
    TABS_DIR --> PRF["profile.tsx — Profil"]
    APP --> RCP["recipe/[id].tsx\nDinamik tarif detayı"]
    APP --> LGN["login.tsx"]
    APP --> ONBRD["onboarding.tsx"]
    APP --> LSCN["live-scan.tsx"]
    APP --> HYB["hybrid.tsx"]
    APP --> SRCH["search-history.tsx"]
    APP --> EDTP["edit-profile.tsx"]

    MOB --> CTX["context/"]
    CTX --> AC["AuthContext.tsx"]
    CTX --> FC["FavoritesContext.tsx"]
    CTX --> MC["MealPlanContext.tsx"]
    CTX --> SC["ShoppingListContext.tsx"]
    CTX --> IC["I18nContext.tsx"]
    CTX --> GC["GlassContext.tsx"]

    MOB --> HKS["hooks/"]
    HKS --> HSH["use-search-history.ts"]
    HKS --> HRC["use-recipe-cache.ts"]
    HKS --> HNT["use-notifications.ts"]
    HKS --> HNS["use-network-status.ts"]
    HKS --> HPS["use-personalized-suggestions.ts"]
    HKS --> HSL["use-shopping-list.ts"]
    HKS --> HT["use-toast.ts"]

    MOB --> COMP["components/"]
    COMP --> TST["Toast.tsx"]
    COMP --> OFB["OfflineBanner.tsx"]
    COMP --> GSC["GlassScreen.tsx"]
    COMP --> RSK["RecipeSkeleton.tsx"]
    COMP --> PEM["PlanEkleModal.tsx"]
    COMP --> ANB["AnimatedButton.tsx"]
    COMP --> GC2["GlassCard.tsx"]

    MOB --> LOC["locales/"]
    LOC --> TR_J["tr.json — 1000+ anahtar"]
    LOC --> EN_J["en.json — 1000+ anahtar"]

    MOB --> UTILS["utils/"]
    UTILS --> API_U["api.ts — BASE_URL, header, mapper"]

    MOB --> CONST["constants/"]
    CONST --> THM["theme.ts — Renkler"]
    CONST --> GLS["glass.ts — Blur sabitler"]
```
