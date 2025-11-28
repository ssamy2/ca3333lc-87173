# هيكلة الكود - Nova Gifts Price Checker

## نظرة عامة
تطبيق ويب مبني على React + TypeScript + Vite لفحص أسعار هدايا Telegram NFT، مع عرض بيانات السوق في مخططات تفاعلية وخرائط حرارية.

---

## 📁 هيكل المشروع

```
project/
├── src/
│   ├── assets/          # الصور والأيقونات
│   ├── components/      # المكونات القابلة لإعادة الاستخدام
│   │   ├── ui/         # مكونات واجهة المستخدم الأساسية (shadcn)
│   │   └── ...         # مكونات التطبيق
│   ├── contexts/       # سياقات React (AuthContext)
│   ├── hooks/          # React Hooks المخصصة
│   ├── pages/          # صفحات التطبيق
│   ├── services/       # خدمات API والتخزين المؤقت
│   ├── lib/            # مكتبات ودوال مساعدة
│   └── types/          # تعريفات TypeScript
├── supabase/           # إعدادات Supabase
│   └── functions/      # Edge Functions
└── public/             # ملفات ثابتة
```

---

## 🎯 الصفحات الرئيسية

### 1. **Index.tsx** (الصفحة الرئيسية)
**المسار:** `src/pages/Index.tsx`
**الوظيفة:** صفحة بسيطة تعرض مكون `TelegramApp`

### 2. **Chart.tsx** (صفحة الرسوم البيانية)
**المسار:** `src/pages/Chart.tsx`
**الوظائف:**
- عرض ثلاثة أنماط: Heatmap، Treemap، Market Chart
- فلاتر زمنية: 24H، 1W، 1M
- فلاتر مصدر البيانات: All، Black
- فلاتر العملة: TON، USD
- **جديد:** أزرار الترتيب Price Up / Price Down

**الدوال الرئيسية:**
```typescript
const filteredGifts = useMemo(() => {
  // تصفية وترتيب البيانات حسب الفلاتر المختارة
  // يدعم الترتيب حسب: default, priceUp, priceDown
})
```

### 3. **GiftDetail.tsx** (تفاصيل الهدية)
**المسار:** `src/pages/GiftDetail.tsx`
**الوظيفة:** عرض تفاصيل هدية معينة مع الرسم البياني
**الإعدادات الافتراضية:**
- النطاق الزمني: `24h`
- نوع الرسم البياني: `line` (area chart)

---

## 🧩 المكونات الأساسية

### **TelegramApp.tsx**
**المسار:** `src/components/TelegramApp.tsx`
**الوظائف:**
- إدارة البحث عن حسابات المستخدمين
- عرض NFTs الخاصة بالمستخدم
- التكامل مع Telegram WebApp API
- **جديد:** دعم البحث عن هدية واحدة أو حساب كامل

**الدوال الرئيسية:**
```typescript
// البحث عن NFTs لمستخدم معين
const fetchNFTs = async (searchUsername: string)

// جلب بيانات ملف المستخدم
const fetchUserProfile = async (username: string)

// ترتيب NFTs حسب السعر
const sortNFTsByPrice = (nfts: NFTGift[])

// حساب القيمة الإجمالية
const calculateTotalValue = ()
```

**الحالات (States):**
```typescript
const [username, setUsername] = useState('')           // اسم المستخدم للبحث
const [nftData, setNftData] = useState<NFTData>()     // بيانات NFTs
const [loading, setLoading] = useState(false)          // حالة التحميل
const [error, setError] = useState<string>()           // رسائل الخطأ
const [activeTab, setActiveTab] = useState()           // التبويب النشط
```

### **TreemapHeatmap.tsx**
**المسار:** `src/components/TreemapHeatmap.tsx`
**الوظائف:**
- عرض خريطة حرارية للهدايا
- إنشاء وإرسال لقطات الشاشة
- **محدث:** إرسال الصور إلى `https://channelsseller.site/api/send-image`

**دالة إرسال الصورة:**
```typescript
const response = await fetch('https://channelsseller.site/api/send-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: userId,
    image: cleanBase64
  })
})
```

### **MarketTable.tsx**
**المسار:** `src/components/MarketTable.tsx`
**الوظيفة:** عرض جدول بيانات السوق

### **NFTCard.tsx**
**المسار:** `src/components/NFTCard.tsx`
**الوظيفة:** عرض بطاقة لهدية NFT واحدة

### **BottomNav.tsx**
**المسار:** `src/components/BottomNav.tsx`
**الوظيفة:** شريط التنقل السفلي (Home / Charts)

---

## 🔌 الخدمات (Services)

### **apiService.ts**
**المسار:** `src/services/apiService.ts`
**قاعدة API:** `https://channelsseller.site`

**الدوال المتاحة:**

#### 1. جلب NFTs لمستخدم
```typescript
export const fetchNFTGifts = async (username: string)
```
**Endpoint:** `/api/user-nfts?username={username}`
**الاستخدام:** جلب جميع الهدايا الخاصة بمستخدم

#### 2. جلب سعر هدية واحدة (جديد)
```typescript
export const fetchSingleGiftPrice = async (giftUrl: string)
```
**Endpoint:** `/api/gift-price-from-link?url={giftUrl}`
**مثال على الرابط:** `https://t.me/nft/SleighBell-19890`
**الرد المتوقع:**
```json
{
  "gift_name": "Sleigh Bell",
  "model": "Candy Cloud",
  "backdrop": "Khaki Green 1.2%",
  "rarity": 0.03,
  "price_ton": 5.49,
  "price_usd": 11.298,
  "image": "https://..."
}
```

#### 3. جلب ملف المستخدم
```typescript
export const fetchUserProfile = async (username: string)
```
**Endpoint:** `/api/user-profile?username=@{username}`
**الرد:** `{ name, photo_base64 }`

#### 4. إرسال الصورة (محدث)
**Endpoint:** `https://channelsseller.site/api/send-image`
**Method:** POST
**Body:**
```json
{
  "id": 6213708507,
  "image": "base64_string..."
}
```

### **marketCache.ts**
**المسار:** `src/services/marketCache.ts`
**الوظيفة:** إدارة التخزين المؤقت للبيانات في localStorage

**الدوال:**
```typescript
export const setCachedData = (key: string, data: any)
export const getCachedData = (key: string)
export const clearCachedData = (key: string)
```

### **imageCache.ts**
**المسار:** `src/services/imageCache.ts`
**الوظيفة:** تخزين الصور مؤقتاً

---

## 🪝 React Hooks المخصصة

### **useMarketData.ts**
**المسار:** `src/hooks/useMarketData.ts`
**الوظيفة:** جلب بيانات السوق من API

```typescript
export const useMarketData = () => {
  return useQuery({
    queryKey: ['market-data'],
    queryFn: fetchMarketData,
    staleTime: 30000,      // تحديث كل 30 ثانية
    refetchInterval: 30000,
  });
}
```

**Endpoint:** `https://channelsseller.site/api/market-data`

### **useBlackFloorData.ts**
**المسار:** `src/hooks/useBlackFloorData.ts`
**الوظيفة:** جلب بيانات Black Floor prices

```typescript
export const useBlackFloorData = () => {
  return useQuery({
    queryKey: ['black-floor-data'],
    queryFn: fetchBlackFloorData,
    staleTime: 60000,      // تحديث كل دقيقة
  });
}
```

**Endpoint:** `https://channelsseller.site/api/black-floor`

### **useTheme.ts**
**المسار:** `src/hooks/useTheme.ts`
**الوظيفة:** إدارة الوضع الداكن/الفاتح

```typescript
export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>()
  const isLight = theme === 'light'
  const isDark = theme === 'dark'
  
  return { theme, setTheme, isLight, isDark }
}
```

### **useDataPrefetch.ts**
**المسار:** `src/hooks/useDataPrefetch.ts`
**الوظيفة:** تحميل البيانات مسبقاً لتحسين الأداء

---

## 🎨 مكونات UI (shadcn)

**المسار:** `src/components/ui/`

المكونات المتاحة:
- **button.tsx** - أزرار مع متغيرات (glass, glassBlue, glassDark)
- **input.tsx** - حقول الإدخال
- **card.tsx** - بطاقات
- **dialog.tsx** - نوافذ حوارية
- **toast.tsx** - إشعارات
- **table.tsx** - جداول
- **chart.tsx** - رسوم بيانية (Recharts)

### متغيرات الأزرار
```typescript
variant: "default" | "destructive" | "outline" | "secondary" | 
         "ghost" | "link" | "glass" | "glassBlue" | "glassDark"

size: "default" | "sm" | "lg" | "icon" | 
      "pill" | "pillSm" | "circle" | "circleSm"
```

---

## 🗄️ Supabase Edge Functions

**المسار:** `supabase/functions/`

### 1. **api-proxy**
**الوظيفة:** Proxy لطلبات API الخارجية

### 2. **secure-proxy**
**الوظيفة:** Proxy آمن مع تشفير

### 3. **send-image** (غير مستخدم حالياً)
**ملاحظة:** تم استبداله بـ API مباشر

### 4. **telegram-auth**
**الوظيفة:** مصادقة مستخدمي Telegram

---

## 🔄 تدفق البيانات (Data Flow)

### سيناريو 1: البحث عن مستخدم
```
User Input (TelegramApp)
  ↓
fetchNFTGifts(username) [apiService]
  ↓
API: /api/user-nfts?username=xxx
  ↓
processAPIResponse() [apiService]
  ↓
setNftData(data) [TelegramApp]
  ↓
Render NFTCards
```

### سيناريو 2: البحث عن هدية واحدة (جديد)
```
Gift URL Input (TelegramApp)
  ↓
fetchSingleGiftPrice(url) [apiService]
  ↓
API: /api/gift-price-from-link?url=xxx
  ↓
Display Gift Details
```

### سيناريو 3: عرض Market Charts
```
Chart.tsx Mount
  ↓
useMarketData() [hook]
  ↓
fetchMarketData() [hook internal]
  ↓
API: /api/market-data
  ↓
Cache in localStorage [marketCache]
  ↓
Filter & Sort [useMemo]
  ↓
Render Heatmap/Treemap/Chart
```

### سيناريو 4: إرسال Screenshot
```
Share Button Click (TreemapHeatmap)
  ↓
html2canvas(chartElement)
  ↓
Convert to Base64
  ↓
POST https://channelsseller.site/api/send-image
  {id: userId, image: base64}
  ↓
Success/Error Toast
```

---

## 📊 أنواع البيانات (Types)

### NFTGift
```typescript
interface NFTGift {
  count: number;
  name: string;
  model: string;
  floor_price: number;
  avg_price: number;
  image?: string;
  title?: string;
  backdrop?: string;
  model_rarity?: string;
  quantity_issued?: number;
  quantity_total?: number;
  tg_deeplink?: string;
  details: { links: string[] };
}
```

### NFTData
```typescript
interface NFTData {
  owner: string;
  visible_nfts?: number;
  total_saved_gifts?: number;
  prices: {
    floor_price: { TON: number; USD: number; STAR: number };
    avg_price: { TON: number; USD: number; STAR: number };
  };
  nfts: NFTGift[];
}
```

### NFTMarketData
```typescript
interface NFTMarketData {
  priceTon: number;
  priceUsd: number;
  tonPrice24hAgo?: number;
  'change_24h_ton_%': number;
  'change_24h_usd_%': number;
  market_cap_ton?: string;
  fdv_ton?: string;
  image_url: string;
  upgradedSupply?: number;
}
```

---

## 🎯 ميزات جديدة مضافة

### 1. ترتيب حسب السعر (Chart.tsx)
- **Price Up:** ترتيب تنازلي للهدايا الصاعدة → متعادلة → هابطة
- **Price Down:** ترتيب تنازلي للهدايا الهابطة → متعادلة → صاعدة

```typescript
const [sortMode, setSortMode] = useState<'default' | 'priceUp' | 'priceDown'>('default')
```

### 2. البحث عن هدية واحدة (apiService.ts)
دالة جديدة لجلب معلومات هدية واحدة من رابط Telegram:

```typescript
export const fetchSingleGiftPrice = async (giftUrl: string)
```

### 3. تحديث API إرسال الصور (TreemapHeatmap.tsx)
تغيير من Supabase Edge Function إلى API مباشر:
```
POST https://channelsseller.site/api/send-image
Body: {id: number, image: string}
```

---

## 🔧 الإعدادات والتهيئة

### Environment Variables
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

### Tailwind Config
**المسار:** `tailwind.config.ts`
**الألوان والأنماط:** محددة في `src/index.css`

### Vite Config
**المسار:** `vite.config.ts`
**الإعدادات:** React, TypeScript, path aliases

---

## 📦 المكتبات المستخدمة

### الأساسية
- **React 18** - مكتبة واجهة المستخدم
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Shadcn UI** - مكونات واجهة المستخدم

### إدارة الحالة والبيانات
- **@tanstack/react-query** - جلب وتخزين البيانات
- **React Context** - إدارة الحالة العامة

### الرسوم البيانية
- **recharts** - مكتبة الرسوم البيانية
- **chart.js + react-chartjs-2** - مخططات Chart.js
- **chartjs-chart-treemap** - Treemap charts
- **html2canvas** - لقطات الشاشة

### واجهة المستخدم
- **framer-motion** - الحركات والانتقالات
- **lucide-react** - الأيقونات
- **sonner** - Toast notifications
- **react-router-dom** - التنقل

### الأدوات
- **date-fns** - التعامل مع التواريخ
- **clsx + tailwind-merge** - دمج الفئات
- **zod** - التحقق من البيانات

---

## 🚀 كيفية التشغيل

```bash
# تثبيت المكتبات
npm install

# تشغيل بيئة التطوير
npm run dev

# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview
```

---

## 📝 ملاحظات مهمة

1. **التخزين المؤقت:** البيانات تُخزن في localStorage لمدة 30-60 ثانية
2. **معدل الطلبات:** يوجد حماية من rate limiting في API
3. **Telegram WebApp:** التطبيق مصمم للعمل داخل Telegram
4. **الاستجابة:** التصميم متجاوب ويعمل على الهواتف والحواسيب
5. **الوضع الداكن:** مدعوم بشكل كامل مع تبديل سلس

---

## 🐛 معالجة الأخطاء

### أنواع الأخطاء المدعومة:
- `USER_NOT_FOUND` - المستخدم غير موجود
- `GIFT_NOT_FOUND` - الهدية غير موجودة
- `INVALID_GIFT_URL` - رابط الهدية غير صحيح
- `NETWORK_ERROR` - خطأ في الاتصال
- `RATE_LIMIT_EXCEEDED` - تجاوز عدد الطلبات
- `SERVER_ERROR` - خطأ في الخادم
- `PARSE_ERROR` - خطأ في تحليل البيانات

---

## 📞 نقاط الاتصال بـ API

### Base URL
```
https://channelsseller.site
```

### Endpoints

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/api/user-nfts` | GET | جلب NFTs لمستخدم |
| `/api/gift-price-from-link` | GET | سعر هدية واحدة |
| `/api/user-profile` | GET | ملف المستخدم |
| `/api/market-data` | GET | بيانات السوق |
| `/api/black-floor` | GET | أسعار Black Floor |
| `/api/send-image` | POST | إرسال لقطة شاشة |

---

## 🎨 نظام التصميم

### الألوان الأساسية
- **Primary:** الأزرق الرئيسي
- **Accent:** لون مميز
- **Background:** خلفية داكنة/فاتحة
- **Muted:** ألوان ثانوية

### متغيرات الأزرار الزجاجية
- **glass:** زجاجي داكن عادي
- **glassBlue:** زجاجي أزرق متدرج
- **glassDark:** زجاجي داكن جداً

### الأحجام
- **default:** الحجم الافتراضي
- **sm / lg:** صغير/كبير
- **pill / pillSm:** شكل بيضاوي
- **circle / circleSm:** دائري

---

تم إنشاء هذا الملف لتوثيق البنية الكاملة للمشروع وتسهيل الصيانة والتطوير المستقبلي.
