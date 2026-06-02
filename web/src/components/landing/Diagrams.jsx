import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Building2, Camera, Type, GitMerge, Lock, Database,
  Compass, Network, Smartphone, Brain, Wrench, Map, Loader2,
} from 'lucide-react';
import mermaid from 'mermaid';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import { useI18n } from '../../context/I18nContext';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#00a055',
    primaryTextColor: '#f0fdf4',
    primaryBorderColor: '#16a34a',
    lineColor: '#4ade80',
    secondaryColor: '#052e16',
    tertiaryColor: '#0a1f0e',
    background: '#0a0f0a',
    mainBkg: '#0d1a10',
    nodeBorder: '#16a34a',
    clusterBkg: '#0a1f0e',
    titleColor: '#4ade80',
    edgeLabelBackground: '#0d1a10',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
  },
  flowchart: { curve: 'basis', padding: 20 },
  sequence: { actorMargin: 60, messageMargin: 40 },
  er: { diagramPadding: 30 },
});

/* ─── Diyagram tanımları ─────────────────────────────────────────────── */
const DIAGRAMS = [
  {
    id: 1,
    icon: Building2,
    color: 'from-green-900/60 to-emerald-900/40',
    border: 'border-green-700/50',
    tr: {
      title: 'Genel Sistem Mimarisi',
      desc: 'Docker, Backend, Mobile ve dış servislerin genel görünümü',
      code: `graph TB
    subgraph DOCKER["🐳 Docker Compose"]
        subgraph BACKEND["🖥️ Backend — Python 3.12"]
            API["FastAPI :8000"]
            ORC["Orchestrator\\n3 Pipeline"]
            AUTH["Auth — JWT+PBKDF2"]
            RATE["Rate Limiter\\nslowapi"]
            TRANS["deep-translator\\nLRU Cache"]
            LOG["Logger\\nContextVar"]
        end
        subgraph DB_CONT["🗄️ MySQL 8.4"]
            MYSQL["MySQL :3306"]
        end
        subgraph MOBILE["📱 Mobile — Node 20"]
            EXPO["Expo / React Native\\n:8081"]
        end
        subgraph VOLUMES["💾 Volumes"]
            VOL_DB["ecochef_mysql"]
            VOL_MODEL["models/ .pt+.gguf"]
        end
    end
    subgraph EXTERNAL["🌐 Dış Servisler"]
        SPOON["Spoonacular API\\n365K+ tarif"]
        MEALDB["TheMealDB\\nFallback"]
        GOOGLE["Google Translate"]
    end
    PHONE["📱 Kullanıcı"]
    PHONE -->|HTTP + JWT| API
    PHONE -->|Metro| EXPO
    API --> ORC
    API --> AUTH
    API --> RATE
    ORC -->|REST| SPOON
    ORC -->|Fallback| MEALDB
    ORC --> TRANS
    TRANS -->|çeviri| GOOGLE
    AUTH --> MYSQL
    API --> MYSQL
    MYSQL --- VOL_DB
    ORC --- VOL_MODEL`,
    },
    en: {
      title: 'General System Architecture',
      desc: 'Overall view of Docker, Backend, Mobile and external services',
      code: `graph TB
    subgraph DOCKER["🐳 Docker Compose"]
        subgraph BACKEND["🖥️ Backend — Python 3.12"]
            API["FastAPI :8000"]
            ORC["Orchestrator\\n3 Pipelines"]
            AUTH["Auth — JWT+PBKDF2"]
            RATE["Rate Limiter\\nslowapi"]
            TRANS["deep-translator\\nLRU Cache"]
            LOG["Logger\\nContextVar"]
        end
        subgraph DB_CONT["🗄️ MySQL 8.4"]
            MYSQL["MySQL :3306"]
        end
        subgraph MOBILE["📱 Mobile — Node 20"]
            EXPO["Expo / React Native\\n:8081"]
        end
        subgraph VOLUMES["💾 Volumes"]
            VOL_DB["ecochef_mysql"]
            VOL_MODEL["models/ .pt+.gguf"]
        end
    end
    subgraph EXTERNAL["🌐 External Services"]
        SPOON["Spoonacular API\\n365K+ recipes"]
        MEALDB["TheMealDB\\nFallback"]
        GOOGLE["Google Translate"]
    end
    PHONE["📱 User"]
    PHONE -->|HTTP + JWT| API
    PHONE -->|Metro| EXPO
    API --> ORC
    API --> AUTH
    API --> RATE
    ORC -->|REST| SPOON
    ORC -->|Fallback| MEALDB
    ORC --> TRANS
    TRANS -->|translate| GOOGLE
    AUTH --> MYSQL
    API --> MYSQL
    MYSQL --- VOL_DB
    ORC --- VOL_MODEL`,
    },
  },
  {
    id: 2,
    icon: Camera,
    color: 'from-blue-900/60 to-cyan-900/40',
    border: 'border-blue-700/50',
    tr: {
      title: 'Görsel Analiz Pipeline',
      desc: 'Fotoğraftan YOLO ile malzeme tespiti ve tarif önerisi',
      code: `sequenceDiagram
    actor Kullanici
    participant Mobile as 📱 Mobile
    participant API as 🖥️ FastAPI
    participant YOLO as 🔍 YOLO Agent
    participant Spoon as 🌐 Spoonacular
    participant MealDB as 🍽️ TheMealDB
    participant Ceviri as 🌍 Translator

    Kullanici->>Mobile: Fotograf cek veya Galeriden sec
    Mobile->>API: POST /detect-ingredients/
    Note over API: Rate limit: 10 istek/dk
    API->>YOLO: Gorseli analiz et
    YOLO->>YOLO: YOLOv8 inference conf >= 0.40
    YOLO->>YOLO: COCO food sinifi filtresi
    YOLO-->>API: [tomato, egg, cheese ...]
    API->>Ceviri: EN -> TR LRU cache
    Ceviri-->>API: [domates, yumurta, peynir ...]
    API->>Spoon: findByIngredients + filtreler
    alt Spoonacular basarili
        Spoon-->>API: Tarif listesi
    else Kota doldu
        API->>MealDB: search_by_ingredient()
        MealDB-->>API: Tarif listesi
    end
    API->>Ceviri: Tarif isimlerini cevir
    API-->>Mobile: ImagePipelineResponse
    Mobile-->>Kullanici: Tarif kartlari`,
    },
    en: {
      title: 'Visual Analysis Pipeline',
      desc: 'Ingredient detection via YOLO from photo and recipe suggestion',
      code: `sequenceDiagram
    actor User
    participant Mobile as 📱 Mobile
    participant API as 🖥️ FastAPI
    participant YOLO as 🔍 YOLO Agent
    participant Spoon as 🌐 Spoonacular
    participant MealDB as 🍽️ TheMealDB
    participant Trans as 🌍 Translator

    User->>Mobile: Take photo or pick from gallery
    Mobile->>API: POST /detect-ingredients/
    Note over API: Rate limit: 10 req/min
    API->>YOLO: Analyze image
    YOLO->>YOLO: YOLOv8 inference conf >= 0.40
    YOLO->>YOLO: COCO food class filter
    YOLO-->>API: [tomato, egg, cheese ...]
    API->>Trans: EN -> TR LRU cache
    Trans-->>API: [tomato, egg, cheese ...]
    API->>Spoon: findByIngredients + filters
    alt Spoonacular success
        Spoon-->>API: Recipe list
    else Quota exceeded
        API->>MealDB: search_by_ingredient()
        MealDB-->>API: Recipe list
    end
    API->>Trans: Translate recipe names
    API-->>Mobile: ImagePipelineResponse
    Mobile-->>User: Recipe cards`,
    },
  },
  {
    id: 3,
    icon: Type,
    color: 'from-violet-900/60 to-purple-900/40',
    border: 'border-violet-700/50',
    tr: {
      title: 'Metin Analizi Pipeline',
      desc: 'Türkçe malzeme metni ile paralel API araması',
      code: `sequenceDiagram
    actor Kullanici
    participant Mobile as 📱 Mobile
    participant API as 🖥️ FastAPI
    participant IT as 🔤 IngredientTranslator
    participant Spoon as 🌐 Spoonacular
    participant MealDB as 🍽️ TheMealDB

    Kullanici->>Mobile: Evde tavuk, mantar ve sogan var
    Mobile->>API: POST /analyze-text-ingredients/
    Note over API: Rate limit: 20 istek/dk
    API->>IT: parse_and_translate(text)
    IT->>IT: Turkce metni bol ve temizle
    IT->>IT: TR->EN sozluk aramasi 80+ giris
    IT-->>API: [chicken, mushroom, onion ...]
    par Paralel API cagrisi
        API->>Spoon: complexSearch + diyet filtresi
    and
        API->>MealDB: search_by_ingredient()
    end
    Spoon-->>API: Spoonacular sonuclari
    MealDB-->>API: TheMealDB sonuclari
    API-->>Mobile: TextPipelineResponse
    Mobile-->>Kullanici: Oneri kartlari`,
    },
    en: {
      title: 'Text Analysis Pipeline',
      desc: 'Parallel API search with Turkish ingredient text input',
      code: `sequenceDiagram
    actor User
    participant Mobile as 📱 Mobile
    participant API as 🖥️ FastAPI
    participant IT as 🔤 IngredientTranslator
    participant Spoon as 🌐 Spoonacular
    participant MealDB as 🍽️ TheMealDB

    User->>Mobile: I have chicken, mushroom and onion
    Mobile->>API: POST /analyze-text-ingredients/
    Note over API: Rate limit: 20 req/min
    API->>IT: parse_and_translate(text)
    IT->>IT: Split and clean text
    IT->>IT: TR->EN dictionary lookup 80+ entries
    IT-->>API: [chicken, mushroom, onion ...]
    par Parallel API calls
        API->>Spoon: complexSearch + diet filter
    and
        API->>MealDB: search_by_ingredient()
    end
    Spoon-->>API: Spoonacular results
    MealDB-->>API: TheMealDB results
    API-->>Mobile: TextPipelineResponse
    Mobile-->>User: Suggestion cards`,
    },
  },
  {
    id: 4,
    icon: GitMerge,
    color: 'from-pink-900/60 to-rose-900/40',
    border: 'border-pink-700/50',
    tr: {
      title: 'Hibrit Pipeline',
      desc: 'YOLO + Llama GGUF — internet olmadan çalışır',
      code: `sequenceDiagram
    actor Kullanici
    participant Mobile as 📱 Mobile
    participant API as 🖥️ FastAPI
    participant YOLO as 🔍 YOLO Agent
    participant NLP as 🤖 NLP Agent Llama
    participant Ceviri as 🌍 Translator

    Note over Mobile,NLP: Internet olmadan da calisir

    Kullanici->>Mobile: Fotograf + istege bagli metin
    Mobile->>API: POST /hybrid-suggest/
    API->>YOLO: Gorseli analiz et
    YOLO-->>API: Tespit edilen malzemeler EN
    API->>Ceviri: EN -> TR
    Ceviri-->>API: Malzemeler TR
    API->>NLP: Few-shot prompt ile malzemeler
    NLP->>NLP: Llama GGUF yerel inference
    NLP->>NLP: JSON parse max 2 retry
    NLP-->>API: [{isim, neden} ...]
    API-->>Mobile: HybridPipelineResponse
    Mobile-->>Kullanici: Gorsel + Llama onerileri`,
    },
    en: {
      title: 'Hybrid Pipeline',
      desc: 'YOLO + Llama GGUF — works without internet',
      code: `sequenceDiagram
    actor User
    participant Mobile as 📱 Mobile
    participant API as 🖥️ FastAPI
    participant YOLO as 🔍 YOLO Agent
    participant NLP as 🤖 NLP Agent Llama
    participant Trans as 🌍 Translator

    Note over Mobile,NLP: Works without internet connection

    User->>Mobile: Photo + optional text
    Mobile->>API: POST /hybrid-suggest/
    API->>YOLO: Analyze image
    YOLO-->>API: Detected ingredients EN
    API->>Trans: EN -> TR
    Trans-->>API: Ingredients TR
    API->>NLP: Ingredients with few-shot prompt
    NLP->>NLP: Llama GGUF local inference
    NLP->>NLP: JSON parse max 2 retry
    NLP-->>API: [{name, reason} ...]
    API-->>Mobile: HybridPipelineResponse
    Mobile-->>User: Visual + Llama suggestions`,
    },
  },
  {
    id: 5,
    icon: Lock,
    color: 'from-yellow-900/60 to-amber-900/40',
    border: 'border-yellow-700/50',
    tr: {
      title: 'Kimlik Doğrulama Akışı',
      desc: 'JWT, PBKDF2-SHA256 ve token blacklist mekanizması',
      code: `sequenceDiagram
    actor Kullanici
    participant Mobile as 📱 Mobile
    participant Secure as 🔒 SecureStore
    participant API as 🖥️ FastAPI
    participant DB as 🗄️ MySQL

    Kullanici->>Mobile: Kullanici adi + Sifre
    Mobile->>API: POST /auth/register veya /auth/login
    alt Kayit
        API->>API: PBKDF2-SHA256 260k iter 16B salt
        API->>DB: INSERT users
    else Giris
        API->>DB: SELECT users WHERE kullanici_adi=?
        API->>API: hmac.compare_digest()
    end
    API->>API: JWT olustur HS256 30 gun
    API-->>Mobile: access_token + kullanici_adi
    Mobile->>Secure: Token + username kaydet
    Note over Mobile,API: Sonraki isteklerde
    Mobile->>API: Authorization: Bearer JWT_TOKEN
    API->>DB: SELECT revoked_tokens WHERE token=?
    alt Token gecerli
        API-->>Mobile: 200 OK
    else Token suresi dolmus
        API-->>Mobile: 401 Unauthorized
        Mobile->>Secure: Token temizle
    end
    Kullanici->>Mobile: Cikis Yap
    Mobile->>API: POST /auth/logout
    API->>DB: INSERT revoked_tokens
    Mobile->>Secure: Token sil`,
    },
    en: {
      title: 'Authentication Flow',
      desc: 'JWT, PBKDF2-SHA256 and token blacklist mechanism',
      code: `sequenceDiagram
    actor User
    participant Mobile as 📱 Mobile
    participant Secure as 🔒 SecureStore
    participant API as 🖥️ FastAPI
    participant DB as 🗄️ MySQL

    User->>Mobile: Username + Password
    Mobile->>API: POST /auth/register or /auth/login
    alt Register
        API->>API: PBKDF2-SHA256 260k iter 16B salt
        API->>DB: INSERT users
    else Login
        API->>DB: SELECT users WHERE username=?
        API->>API: hmac.compare_digest()
    end
    API->>API: Create JWT HS256 30 days
    API-->>Mobile: access_token + username
    Mobile->>Secure: Save token + username
    Note over Mobile,API: Subsequent requests
    Mobile->>API: Authorization: Bearer JWT_TOKEN
    API->>DB: SELECT revoked_tokens WHERE token=?
    alt Token valid
        API-->>Mobile: 200 OK
    else Token expired
        API-->>Mobile: 401 Unauthorized
        Mobile->>Secure: Clear token
    end
    User->>Mobile: Logout
    Mobile->>API: POST /auth/logout
    API->>DB: INSERT revoked_tokens
    Mobile->>Secure: Delete token`,
    },
  },
  {
    id: 6,
    icon: Database,
    color: 'from-teal-900/60 to-cyan-900/40',
    border: 'border-teal-700/50',
    tr: {
      title: 'Veritabanı ER Diyagramı',
      desc: 'MySQL 8.4 — 6 tablo ve ilişkileri',
      code: `erDiagram
    USERS {
        int id PK
        string kullanici_adi
        string sifre_hash
        text dietary_preferences
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
        string tarih
        string ogun
        int recipe_id
        string recipe_isim
    }
    RECIPE_RATINGS {
        int id PK
        int user_id FK
        int recipe_id
        int puan
        datetime tarih
    }
    SEARCH_HISTORY {
        int id PK
        int user_id FK
        text sorgu
        string mod
        datetime tarih
    }
    REVOKED_TOKENS {
        int id PK
        text token
        datetime iptal_tarihi
    }
    USERS ||--o{ FAVORITES : "kaydeder"
    USERS ||--o{ MEAL_PLANS : "planlar"
    USERS ||--o{ RECIPE_RATINGS : "puanlar"
    USERS ||--o{ SEARCH_HISTORY : "arar"
    USERS ||--o{ REVOKED_TOKENS : "cikis yapar"`,
    },
    en: {
      title: 'Database ER Diagram',
      desc: 'MySQL 8.4 — 6 tables and their relationships',
      code: `erDiagram
    USERS {
        int id PK
        string username
        string password_hash
        text dietary_preferences
    }
    FAVORITES {
        int id PK
        int user_id FK
        int recipe_id
        string recipe_name
        text recipe_image
        datetime saved_at
    }
    MEAL_PLANS {
        int id PK
        int user_id FK
        string date
        string meal_type
        int recipe_id
        string recipe_name
    }
    RECIPE_RATINGS {
        int id PK
        int user_id FK
        int recipe_id
        int score
        datetime created_at
    }
    SEARCH_HISTORY {
        int id PK
        int user_id FK
        text query
        string mode
        datetime created_at
    }
    REVOKED_TOKENS {
        int id PK
        text token
        datetime revoked_at
    }
    USERS ||--o{ FAVORITES : "saves"
    USERS ||--o{ MEAL_PLANS : "plans"
    USERS ||--o{ RECIPE_RATINGS : "rates"
    USERS ||--o{ SEARCH_HISTORY : "searches"
    USERS ||--o{ REVOKED_TOKENS : "revokes"`,
    },
  },
  {
    id: 7,
    icon: Compass,
    color: 'from-orange-900/60 to-red-900/40',
    border: 'border-orange-700/50',
    tr: {
      title: 'Kullanıcı Akışı',
      desc: "Onboarding'dan tarif detayına kullanıcı yolculuğu",
      code: `flowchart TD
    START([Uygulama Acilir]) --> OB{Onboarding\nGoruoldu mu?}
    OB -->|Hayir| ONBOARD[onboarding.tsx\n3 sayfali tanitim]
    OB -->|Evet| AUTH_CHK
    ONBOARD --> AUTH_CHK{Token\nGecerli mi?}
    AUTH_CHK -->|Hayir| LOGIN[login.tsx\nGiris / Kayit]
    AUTH_CHK -->|Evet| HOME
    LOGIN -->|Basarili| HOME[index.tsx\nAna Ekran]
    HOME --> METHOD{Analiz Yontemi}
    METHOD -->|Gorsel| IMG[Fotograf Cek]
    METHOD -->|Metin| TXT[Malzeme Yaz]
    METHOD -->|Canli| LIVE[live-scan.tsx]
    METHOD -->|Hibrit| HYBRID[hybrid.tsx]
    IMG --> SEND[Backend'e Gonder]
    TXT --> SEND
    LIVE --> SEND
    HYBRID --> SEND
    SEND --> RESULT{Sonuc}
    RESULT -->|Basarili| CARDS[Tarif Kartlari]
    RESULT -->|Cevrimdisi| CACHE[Son 10 Onbellek]
    CARDS --> ACTION{Eylem}
    ACTION -->|Favori| FAV[POST /favorites]
    ACTION -->|Plan| PLAN[PlanEkleModal]
    ACTION -->|Alisveris| SHOP[shopping.tsx]
    ACTION -->|Detay| DETAIL[recipe/id.tsx]
    DETAIL --> RATE[Puan Ver 1-5]
    DETAIL --> FAV
    DETAIL --> PLAN
    PLAN --> PLAN_SCR[plan.tsx]
    FAV --> FAV_SCR[favorites.tsx]
    HOME --> PROF[profile.tsx]
    PROF --> EDIT[edit-profile.tsx\nDiyet tercihleri]
    PROF --> HIST[search-history.tsx\nArama gecmisi]
    PROF --> LOGOUT[POST /auth/logout]`,
    },
    en: {
      title: 'User Flow',
      desc: 'User journey from onboarding to recipe detail',
      code: `flowchart TD
    START([App Opens]) --> OB{Onboarding\nSeen?}
    OB -->|No| ONBOARD[onboarding.tsx\n3-page intro]
    OB -->|Yes| AUTH_CHK
    ONBOARD --> AUTH_CHK{Token\nValid?}
    AUTH_CHK -->|No| LOGIN[login.tsx\nSign In / Register]
    AUTH_CHK -->|Yes| HOME
    LOGIN -->|Success| HOME[index.tsx\nHome Screen]
    HOME --> METHOD{Analysis Method}
    METHOD -->|Visual| IMG[Take Photo]
    METHOD -->|Text| TXT[Type Ingredients]
    METHOD -->|Live| LIVE[live-scan.tsx]
    METHOD -->|Hybrid| HYBRID[hybrid.tsx]
    IMG --> SEND[Send to Backend]
    TXT --> SEND
    LIVE --> SEND
    HYBRID --> SEND
    SEND --> RESULT{Result}
    RESULT -->|Success| CARDS[Recipe Cards]
    RESULT -->|Offline| CACHE[Last 10 Cache]
    CARDS --> ACTION{Action}
    ACTION -->|Favorite| FAV[POST /favorites]
    ACTION -->|Plan| PLAN[PlanAddModal]
    ACTION -->|Shopping| SHOP[shopping.tsx]
    ACTION -->|Detail| DETAIL[recipe/id.tsx]
    DETAIL --> RATE[Rate 1-5 Stars]
    DETAIL --> FAV
    DETAIL --> PLAN
    PLAN --> PLAN_SCR[plan.tsx]
    FAV --> FAV_SCR[favorites.tsx]
    HOME --> PROF[profile.tsx]
    PROF --> EDIT[edit-profile.tsx\nDiet Preferences]
    PROF --> HIST[search-history.tsx\nSearch History]
    PROF --> LOGOUT[POST /auth/logout]`,
    },
  },
  {
    id: 8,
    icon: Network,
    color: 'from-red-900/60 to-rose-900/40',
    border: 'border-red-700/50',
    tr: {
      title: 'API Endpoint Haritası',
      desc: '42 REST endpoint ve JWT koruması',
      code: `graph LR
    subgraph AUTH["🔐 Kimlik Dogrulama"]
        A1["POST /auth/register"]
        A2["POST /auth/login"]
        A3["GET /auth/me"]
        A4["PUT /auth/profile"]
        A5["PUT /auth/password"]
        A6["POST /auth/logout"]
    end
    subgraph PIPELINE["⚙️ Pipeline"]
        P1["POST /detect-ingredients/\\n10/dk limit"]
        P2["POST /analyze-text-ingredients/\\n20/dk limit"]
        P3["POST /hybrid-suggest/"]
    end
    subgraph RECIPE["🍽️ Tarifler"]
        R1["GET /recipes/random"]
        R2["GET /recipes/discover"]
        R3["GET /recipes/{id}"]
        R4["GET /recipes/meal/{id}"]
    end
    subgraph FAV["❤️ Favoriler"]
        F1["GET /favorites"]
        F2["POST /favorites"]
        F3["DELETE /favorites/{id}"]
    end
    subgraph PLAN["📅 Yemek Plani"]
        M1["GET /meal-plan"]
        M2["POST /meal-plan"]
        M3["DELETE /meal-plan/{id}"]
    end
    subgraph RATINGS["⭐ Puanlama"]
        RT1["POST /ratings"]
        RT2["GET /ratings/{id}"]
    end
    subgraph HIST["🔍 Arama Gecmisi"]
        H1["GET /search-history"]
        H2["POST /search-history"]
        H3["DELETE /search-history/{id}"]
        H4["DELETE /search-history"]
    end
    JWT["🔑 JWT Token"] -->|gerekli| FAV
    JWT -->|gerekli| PLAN
    JWT -->|gerekli| RATINGS
    JWT -->|gerekli| HIST
    JWT -->|gerekli| PIPELINE
    JWT -->|gerekli A3-A6| AUTH`,
    },
    en: {
      title: 'API Endpoint Map',
      desc: '42 REST endpoints and JWT protection',
      code: `graph LR
    subgraph AUTH["🔐 Authentication"]
        A1["POST /auth/register"]
        A2["POST /auth/login"]
        A3["GET /auth/me"]
        A4["PUT /auth/profile"]
        A5["PUT /auth/password"]
        A6["POST /auth/logout"]
    end
    subgraph PIPELINE["⚙️ Pipelines"]
        P1["POST /detect-ingredients/\\n10/min limit"]
        P2["POST /analyze-text-ingredients/\\n20/min limit"]
        P3["POST /hybrid-suggest/"]
    end
    subgraph RECIPE["🍽️ Recipes"]
        R1["GET /recipes/random"]
        R2["GET /recipes/discover"]
        R3["GET /recipes/{id}"]
        R4["GET /recipes/meal/{id}"]
    end
    subgraph FAV["❤️ Favorites"]
        F1["GET /favorites"]
        F2["POST /favorites"]
        F3["DELETE /favorites/{id}"]
    end
    subgraph PLAN["📅 Meal Plan"]
        M1["GET /meal-plan"]
        M2["POST /meal-plan"]
        M3["DELETE /meal-plan/{id}"]
    end
    subgraph RATINGS["⭐ Ratings"]
        RT1["POST /ratings"]
        RT2["GET /ratings/{id}"]
    end
    subgraph HIST["🔍 Search History"]
        H1["GET /search-history"]
        H2["POST /search-history"]
        H3["DELETE /search-history/{id}"]
        H4["DELETE /search-history"]
    end
    JWT["🔑 JWT Token"] -->|required| FAV
    JWT -->|required| PLAN
    JWT -->|required| RATINGS
    JWT -->|required| HIST
    JWT -->|required| PIPELINE
    JWT -->|required A3-A6| AUTH`,
    },
  },
  {
    id: 9,
    icon: Smartphone,
    color: 'from-indigo-900/60 to-blue-900/40',
    border: 'border-indigo-700/50',
    tr: {
      title: 'Mobile Uygulama Mimarisi',
      desc: 'Expo Router, Context katmanı ve depolama',
      code: `graph TB
    subgraph ROUTER["📁 Expo Router"]
        LAY["_layout.tsx\\nKok Providers"]
        TAB["tabs/_layout.tsx\\nSekme Nav"]
        subgraph TABS["tabs/ Sekmeler"]
            IDX["index.tsx — Ana"]
            EXP["explore.tsx — Kesfet"]
            FAV["favorites.tsx"]
            PLN["plan.tsx"]
            SHP["shopping.tsx"]
            PRF["profile.tsx"]
        end
        subgraph SCR["Diger Ekranlar"]
            LOGIN["login.tsx"]
            ONBRD["onboarding.tsx"]
            RCP["recipe/id.tsx"]
            LIVE["live-scan.tsx"]
            HYB["hybrid.tsx"]
            SRCH["search-history.tsx"]
            EDTP["edit-profile.tsx"]
            MOD["modal.tsx"]
        end
    end
    subgraph CTX["🔄 Context API"]
        AC["AuthContext\\nJWT + SecureStore"]
        FC["FavoritesContext\\nOptimistik UI"]
        MC["MealPlanContext\\nAsyncStorage"]
        SC["ShoppingListContext"]
        IC["I18nContext\\nTR/EN"]
        GC["GlassContext\\nUI tema"]
    end
    subgraph HKS["🪝 Hooks"]
        H1["useSearchHistory"]
        H2["useRecipeCache"]
        H3["useNotifications"]
        H4["useNetworkStatus"]
        H5["usePersonalizedSuggestions"]
        H6["useShoppingList"]
        H7["useToast"]
    end
    subgraph STOR["💾 Depolama"]
        SEC["SecureStore\\nJWT + kullanici"]
        AST["AsyncStorage\\nCache + Gecmis"]
    end
    LAY --> TAB
    TAB --> TABS
    LAY --> SCR
    LAY --> CTX
    CTX --> HKS
    AC --> SEC
    MC --> AST
    SC --> AST`,
    },
    en: {
      title: 'Mobile App Architecture',
      desc: 'Expo Router, Context layer and storage',
      code: `graph TB
    subgraph ROUTER["📁 Expo Router"]
        LAY["_layout.tsx\\nRoot Providers"]
        TAB["tabs/_layout.tsx\\nTab Navigation"]
        subgraph TABS["tabs/ Screens"]
            IDX["index.tsx — Home"]
            EXP["explore.tsx — Discover"]
            FAV["favorites.tsx"]
            PLN["plan.tsx"]
            SHP["shopping.tsx"]
            PRF["profile.tsx"]
        end
        subgraph SCR["Other Screens"]
            LOGIN["login.tsx"]
            ONBRD["onboarding.tsx"]
            RCP["recipe/id.tsx"]
            LIVE["live-scan.tsx"]
            HYB["hybrid.tsx"]
            SRCH["search-history.tsx"]
            EDTP["edit-profile.tsx"]
            MOD["modal.tsx"]
        end
    end
    subgraph CTX["🔄 Context API"]
        AC["AuthContext\\nJWT + SecureStore"]
        FC["FavoritesContext\\nOptimistic UI"]
        MC["MealPlanContext\\nAsyncStorage"]
        SC["ShoppingListContext"]
        IC["I18nContext\\nTR/EN"]
        GC["GlassContext\\nUI theme"]
    end
    subgraph HKS["🪝 Hooks"]
        H1["useSearchHistory"]
        H2["useRecipeCache"]
        H3["useNotifications"]
        H4["useNetworkStatus"]
        H5["usePersonalizedSuggestions"]
        H6["useShoppingList"]
        H7["useToast"]
    end
    subgraph STOR["💾 Storage"]
        SEC["SecureStore\\nJWT + username"]
        AST["AsyncStorage\\nCache + History"]
    end
    LAY --> TAB
    TAB --> TABS
    LAY --> SCR
    LAY --> CTX
    CTX --> HKS
    AC --> SEC
    MC --> AST
    SC --> AST`,
    },
  },
  {
    id: 10,
    icon: Brain,
    color: 'from-lime-900/60 to-green-900/40',
    border: 'border-lime-700/50',
    tr: {
      title: 'Özellikler Haritası',
      desc: 'Tüm özelliklerin mindmap görünümü',
      code: `mindmap
  root((EcoChef))
    Yapay Zeka
      YOLO v8
        Guven esigi 0.40
        COCO food filtresi
        Singleton cache
      Llama GGUF
        Yerel inference
        Few-shot prompt
        Cevrimdisi calisir
      Spoonacular
        365K tarif
        Beslenme bilgisi
        Diyet filtresi
      TheMealDB
        Ucretsiz fallback
        Turk mutfagi
    Kullanici Ozellikleri
      Auth
        JWT 30 gun
        PBKDF2 260k iter
        Token blacklist
      Favoriler
        Optimistik UI
      Yemek Plani
        7 gun 3 ogun
        AsyncStorage cache
      Alisveris Listesi
        Pazar linkleri
      Tarif Puanlama
        1 5 yildiz
      Arama Gecmisi
        Toplu silme
      Push Bildirim
        Ogun hatirlat
      Kisisel Oneriler
        Diyet x favoriler
    Dil Destegi
      Turkce
      Ingilizce
      Cihaz dilini algilar
    Altyapi
      Docker Compose
        3 container
      MySQL 8.4
        6 tablo
      Rate Limiting
        slowapi
      Guvenlik
        JWT HS256
        SecureStore`,
    },
    en: {
      title: 'Features Map',
      desc: 'Mindmap view of all features',
      code: `mindmap
  root((EcoChef))
    Artificial Intelligence
      YOLO v8
        Confidence 0.40
        COCO food filter
        Singleton cache
      Llama GGUF
        Local inference
        Few-shot prompt
        Offline capable
      Spoonacular
        365K recipes
        Nutrition info
        Diet filters
      TheMealDB
        Free fallback
        Turkish cuisine
    User Features
      Authentication
        JWT 30 days
        PBKDF2 260k iter
        Token blacklist
      Favorites
        Optimistic UI
      Meal Plan
        7 days 3 meals
        AsyncStorage cache
      Shopping List
        Market app links
      Recipe Rating
        1 5 stars
      Search History
        Bulk delete
      Push Notifications
        Meal reminders
      Personalized Suggestions
        Diet x favorites
    Language Support
      Turkish
      English
      Auto-detect device
    Infrastructure
      Docker Compose
        3 containers
      MySQL 8.4
        6 tables
      Rate Limiting
        slowapi
      Security
        JWT HS256
        SecureStore`,
    },
  },
  {
    id: 11,
    icon: Wrench,
    color: 'from-slate-900/60 to-zinc-900/40',
    border: 'border-slate-700/50',
    tr: {
      title: 'Teknoloji Yığını',
      desc: 'Frontend, Backend, AI ve altyapı teknolojileri',
      code: `graph TB
    subgraph MOB["📱 Mobile"]
        RN["React Native 0.81"]
        EXPO["Expo SDK 54"]
        TS["TypeScript 5.9"]
        ROUTER["Expo Router ~6.0"]
        SS["SecureStore JWT"]
        AS["AsyncStorage Cache"]
        I18["i18n-js TR-EN"]
    end
    subgraph BE["🖥️ Backend"]
        FP["FastAPI 0.135"]
        UV["Uvicorn 0.42"]
        SA["SQLAlchemy 2.0"]
        PD["Pydantic 2.12"]
        JW["python-jose JWT"]
        SL["slowapi Rate Limit"]
        PM["PyMySQL 1.1"]
    end
    subgraph AI["🤖 Yapay Zeka"]
        UL["Ultralytics YOLOv8"]
        TC["PyTorch 2.5 CPU"]
        LC["llama-cpp 0.3.18"]
        DT["deep-translator"]
        SP["Spoonacular API"]
        MD["TheMealDB API"]
    end
    subgraph INFRA["🐳 Altyapi"]
        DC["Docker Compose"]
        MY["MySQL 8.4"]
        PB["passlib bcrypt"]
    end
    MOB -->|HTTP + JWT| BE
    BE --> AI
    BE --> INFRA`,
    },
    en: {
      title: 'Technology Stack',
      desc: 'Frontend, Backend, AI and infrastructure technologies',
      code: `graph TB
    subgraph MOB["📱 Mobile"]
        RN["React Native 0.81"]
        EXPO["Expo SDK 54"]
        TS["TypeScript 5.9"]
        ROUTER["Expo Router ~6.0"]
        SS["SecureStore JWT"]
        AS["AsyncStorage Cache"]
        I18["i18n-js TR-EN"]
    end
    subgraph BE["🖥️ Backend"]
        FP["FastAPI 0.135"]
        UV["Uvicorn 0.42"]
        SA["SQLAlchemy 2.0"]
        PD["Pydantic 2.12"]
        JW["python-jose JWT"]
        SL["slowapi Rate Limit"]
        PM["PyMySQL 1.1"]
    end
    subgraph AI["🤖 AI & ML"]
        UL["Ultralytics YOLOv8"]
        TC["PyTorch 2.5 CPU"]
        LC["llama-cpp 0.3.18"]
        DT["deep-translator"]
        SP["Spoonacular API"]
        MD["TheMealDB API"]
    end
    subgraph INFRA["🐳 Infrastructure"]
        DC["Docker Compose"]
        MY["MySQL 8.4"]
        PB["passlib bcrypt"]
    end
    MOB -->|HTTP + JWT| BE
    BE --> AI
    BE --> INFRA`,
    },
  },
];

/* ─── i18n metinleri ─────────────────────────────────────────────────── */
const UI_TEXT = {
  tr: {
    badge: 'Sistem Diyagramları',
    title: 'Mimariye Derin Bakış',
    subtitle: "EcoChef'in teknik altyapısını 11 interaktif diyagram ile inceleyin. Bir kartın üzerine tıklayarak tam ekran görüntüleyebilirsiniz.",
    explore: 'İncele',
    loading: 'Diyagram yükleniyor…',
    renderError: 'Render hatası',
    closeHint: 'tuşuna basın veya dışarıya tıklayın',
    closeWith: 'Kapatmak için',
  },
  en: {
    badge: 'System Diagrams',
    title: 'Deep Dive into Architecture',
    subtitle: 'Explore the technical infrastructure of EcoChef with 11 interactive diagrams. Click any card to view it full screen.',
    explore: 'Explore',
    loading: 'Loading diagram…',
    renderError: 'Render error',
    closeHint: 'key or click outside to close',
    closeWith: 'Press',
  },
};

/* ─── Mermaid Renderer ───────────────────────────────────────────────── */
function MermaidChart({ code, id }) {
  const ref = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const { locale } = useI18n();
  const ui = UI_TEXT[locale];

  useEffect(() => {
    let cancelled = false;
    setError('');
    setSvg('');
    const uid = `mermaid-${id}-${Date.now()}`;
    mermaid.render(uid, code)
      .then(({ svg: rendered }) => { if (!cancelled) setSvg(rendered); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [code, id]);

  if (error) return (
    <div className="text-red-400 text-sm p-4 bg-red-950/40 rounded-xl border border-red-800/50">
      <p className="font-bold mb-1">{ui.renderError}</p>
      <pre className="whitespace-pre-wrap text-xs opacity-70">{error}</pre>
    </div>
  );

  if (!svg) return (
    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-primary" /> {ui.loading}
    </div>
  );

  return (
    <div ref={ref} className="w-full overflow-auto"
      dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────── */
function DiagramModal({ diagram, onClose }) {
  const { locale } = useI18n();
  const ui = UI_TEXT[locale];
  const d = diagram[locale];

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[#0a0f0a] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            {(() => { const Icon = diagram.icon; return <Icon className="w-6 h-6 text-primary flex-shrink-0" />; })()}
            <div>
              <h3 className="font-extrabold text-lg text-foreground">{d.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors text-lg"
          >✕</button>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-[#060c06]">
          <MermaidChart code={d.code} id={`${diagram.id}-${locale}`} />
        </div>
        <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex-shrink-0 text-xs text-muted-foreground text-center">
          {ui.closeWith} <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">ESC</kbd> {ui.closeHint}
        </div>
      </div>
    </div>
  );
}

/* ─── Ana Bileşen ────────────────────────────────────────────────────── */
export default function Diagrams() {
  const [active, setActive] = useState(null);
  const [ref, visible] = useScrollAnimation();
  const { locale } = useI18n();
  const ui = UI_TEXT[locale];

  const open  = useCallback((d) => setActive(d), []);
  const close = useCallback(() => setActive(null), []);

  return (
    <>
      <section id="diagrams" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div
            ref={ref}
            className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-5">
              <Map className="w-4 h-4" />
              {ui.badge}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold font-inter">{ui.title}</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{ui.subtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DIAGRAMS.map((d, i) => (
              <DiagramCard key={d.id} diagram={d} index={i} locale={locale} ui={ui} onClick={() => open(d)} />
            ))}
          </div>
        </div>
      </section>

      {active && <DiagramModal diagram={active} onClose={close} />}
    </>
  );
}

/* ─── Kart ───────────────────────────────────────────────────────────── */
function DiagramCard({ diagram, index, locale, ui, onClick }) {
  const [ref, visible] = useScrollAnimation();
  const d = diagram[locale];

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`
        group relative text-left rounded-2xl border p-5 transition-all duration-300 cursor-pointer w-full
        bg-gradient-to-br ${diagram.color} ${diagram.border}
        hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${index * 60}ms`, transitionDuration: '600ms' }}
    >
      <span className="absolute top-3 right-3 text-xs font-bold text-white/20 tabular-nums">
        #{String(diagram.id).padStart(2, '0')}
      </span>
      <div className="mb-3 group-hover:scale-110 transition-transform duration-200">
        {(() => { const Icon = diagram.icon; return <Icon className="w-7 h-7 text-primary" />; })()}
      </div>
      <h3 className="font-bold text-sm text-foreground leading-snug mb-1">{d.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span>{ui.explore}</span>
        <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
      </div>
    </button>
  );
}
