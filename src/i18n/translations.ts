export type Language = 'en' | 'ar' | 'ru';

export const translations = {
  en: {
    // Navigation
    settings: 'Settings',
    home: 'Home',
    chart: 'Chart',
    gift: 'Gift',
    profile: 'Profile',
    
    // Theme
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    
    // Language
    language: 'Language',
    english: 'English',
    arabic: 'Arabic',
    russian: 'Russian',
    
    // Community
    community: 'Community',
    joinTelegramChannel: 'Join Telegram Channel',
    joinTelegramGroup: 'Join Telegram Group',
    
    // App Header
    appTitle: 'Nova',
    appSubtitle: 'Telegram Gifts Price Checker',
    
    // User Info
    active: 'Active',
    telegram: 'Telegram',
    checkMyGifts: 'Check My Gifts',
    loading: 'Loading...',
    
    // Search
    searchMode: 'Search Mode',
    userProfile: 'User Profile',
    singleGift: 'Single Gift',
    enterUsername: 'Enter username...',
    enterGiftUrl: 'Enter gift URL (e.g., https://t.me/nft/...)',
    search: 'Search',
    recentSearches: 'Recent Searches',
    clearAll: 'Clear All',
    
    // Rate Limit
    rateLimited: 'Rate Limited',
    pleaseWait: 'Please wait {seconds} seconds before next request',
    
    // Gift Details
    model: 'Model',
    backdrop: 'Backdrop',
    priceTon: 'Price (TON)',
    priceUsd: 'Price (USD)',
    rarity: 'Rarity',
    
    // Stats
    ownerInfo: 'Owner Info',
    totalValue: 'Total Value',
    floorPrice: 'Floor Price',
    avgPrice: 'Average Price',
    totalGifts: 'Total Gifts',
    
    // NFT Card
    gifts: 'Gifts',
    totalPrice: 'Total Price',
    notYetOnMarket: 'Not yet on market',
    
    // Success/Error Messages
    successFound: 'Found {count} NFT gifts for {owner}',
    historyCleared: 'History Cleared',
    historyDeleted: 'Search history has been deleted',
    requestError: 'Request Error',
    errorOccurred: 'An error occurred while fetching data. Please try again.',
    
    // Chart Page
    marketCharts: 'Market Charts',
    blackGifts: 'BLACK GIFTS',
    live: 'Live',
    priceUp: 'Price Up',
    priceDown: 'Price Down',
    all: 'All',
    black: 'Black',
    change: 'Change',
    marketCap: 'Market Cap',
  },
  ar: {
    // Navigation
    settings: 'الإعدادات',
    home: 'الرئيسية',
    chart: 'الرسم البياني',
    gift: 'الهدية',
    profile: 'الملف الشخصي',
    
    // Theme
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    system: 'النظام',
    
    // Language
    language: 'اللغة',
    english: 'الإنجليزية',
    arabic: 'العربية',
    russian: 'الروسية',
    
    // Community
    community: 'المجتمع',
    joinTelegramChannel: 'انضم لقناة التليجرام',
    joinTelegramGroup: 'انضم لمجموعة التليجرام',
    
    // App Header
    appTitle: 'نوفا',
    appSubtitle: 'فاحص أسعار هدايا التليجرام',
    
    // User Info
    active: 'نشط',
    telegram: 'تليجرام',
    checkMyGifts: 'تحقق من هداياي',
    loading: 'جاري التحميل...',
    
    // Search
    searchMode: 'وضع البحث',
    userProfile: 'ملف المستخدم',
    singleGift: 'هدية واحدة',
    enterUsername: 'أدخل اسم المستخدم...',
    enterGiftUrl: 'أدخل رابط الهدية (مثل: https://t.me/nft/...)',
    search: 'بحث',
    recentSearches: 'عمليات البحث الأخيرة',
    clearAll: 'مسح الكل',
    
    // Rate Limit
    rateLimited: 'تم تجاوز الحد',
    pleaseWait: 'يرجى الانتظار {seconds} ثانية قبل الطلب التالي',
    
    // Gift Details
    model: 'الموديل',
    backdrop: 'الخلفية',
    priceTon: 'السعر (TON)',
    priceUsd: 'السعر (USD)',
    rarity: 'الندرة',
    
    // Stats
    ownerInfo: 'معلومات المالك',
    totalValue: 'القيمة الإجمالية',
    floorPrice: 'السعر الأدنى',
    avgPrice: 'متوسط السعر',
    totalGifts: 'إجمالي الهدايا',
    
    // NFT Card
    gifts: 'هدايا',
    totalPrice: 'السعر الإجمالي',
    notYetOnMarket: 'لم تُطرح في السوق بعد',
    
    // Success/Error Messages
    successFound: 'تم العثور على {count} هدية NFT لـ {owner}',
    historyCleared: 'تم مسح السجل',
    historyDeleted: 'تم حذف سجل البحث',
    requestError: 'خطأ في الطلب',
    errorOccurred: 'حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.',
    
    // Chart Page
    marketCharts: 'رسوم السوق البيانية',
    blackGifts: 'هدايا البلاك',
    live: 'مباشر',
    priceUp: 'السعر يرتفع',
    priceDown: 'السعر ينخفض ',
    all: 'الكل',
    black: 'بلاك',
    change: 'التغير',
    marketCap: 'القيمة السوقية',
  },
  ru: {
    // Navigation
    settings: 'Настройки',
    home: 'Главная',
    chart: 'График',
    gift: 'Подарок',
    profile: 'Профиль',
    
    // Theme
    theme: 'Тема',
    light: 'Светлая',
    dark: 'Темная',
    system: 'Системная',
    
    // Language
    language: 'Язык',
    english: 'Английский',
    arabic: 'Арабский',
    russian: 'Русский',
    
    // Community
    community: 'Сообщество',
    joinTelegramChannel: 'Присоединиться к каналу Telegram',
    joinTelegramGroup: 'Присоединиться к группе Telegram',
    
    // App Header
    appTitle: 'Нова',
    appSubtitle: 'Проверка цен на подарки Telegram',
    
    // User Info
    active: 'Активен',
    telegram: 'Telegram',
    checkMyGifts: 'Проверить мои подарки',
    loading: 'Загрузка...',
    
    // Search
    searchMode: 'Режим поиска',
    userProfile: 'Профиль пользователя',
    singleGift: 'Один подарок',
    enterUsername: 'Введите имя пользователя...',
    enterGiftUrl: 'Введите URL подарка (например: https://t.me/nft/...)',
    search: 'Поиск',
    recentSearches: 'Недавние поиски',
    clearAll: 'Очистить все',
    
    // Rate Limit
    rateLimited: 'Лимит превышен',
    pleaseWait: 'Пожалуйста, подождите {seconds} секунд перед следующим запросом',
    
    // Gift Details
    model: 'Модель',
    backdrop: 'Фон',
    priceTon: 'Цена (TON)',
    priceUsd: 'Цена (USD)',
    rarity: 'Редкость',
    
    // Stats
    ownerInfo: 'Информация о владельце',
    totalValue: 'Общая стоимость',
    floorPrice: 'Минимальная цена',
    avgPrice: 'Средняя цена',
    totalGifts: 'Всего подарков',
    
    // NFT Card
    gifts: 'Подарки',
    totalPrice: 'Общая цена',
    notYetOnMarket: 'Еще не на рынке',
    
    // Success/Error Messages
    successFound: 'Найдено {count} NFT подарков для {owner}',
    historyCleared: 'История очищена',
    historyDeleted: 'История поиска удалена',
    requestError: 'Ошибка запроса',
    errorOccurred: 'Произошла ошибка при получении данных. Пожалуйста, попробуйте еще раз.',
    
    // Chart Page
    marketCharts: 'Рыночные графики',
    blackGifts: 'ЧЕРНЫЕ ПОДАРКИ',
    live: 'Прямой эфир',
    priceUp: 'Цена растет',
    priceDown: 'Цена падает',
    all: 'Все',
    black: 'Черный',
    change: 'Изменение',
    marketCap: 'Рыночная капитализация',
  },
};

export const getTranslation = (lang: Language, key: keyof typeof translations.en): string => {
  return translations[lang][key] || translations.en[key];
};
