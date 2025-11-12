export type Language = 'en' | 'ar' | 'ru' | 'zh';

export const translations = {
  zh: {
    // Language names
    english: '🇬🇧 English',
    arabic: '🇮🇶 العربية',
    russian: '🇷🇺 Русский',
    chinese: '🇨🇳 中文',
    
    // Common
    settings: '设置',
    theme: '主题',
    language: '语言',
    light: '浅色',
    dark: '深色',
    system: '系统',
    community: '社区',
    
    // Community links
    joinTelegramChannel: '加入 Telegram 频道',
    joinTelegramGroup: '加入 Telegram 群组',
    
    // Home page
    heroTitle: '精确计算您的礼物价值',
    heroDescription: '通过我们先进的实时市场数据分析工具，即时了解您 Telegram 礼物的真实价值',
    heroExample: '💡 选择您的礼物 → 查看实时价格 → 做出明智决策',
    footerNote: '💎 所有价格每5分钟自动更新一次，来源于 Telegram 官方市场和可信交易渠道',
    
    // Image Sending
    imageSending: '正在发送',
    imageWillBeSent: '图片即将发送给您',
    imageSentSuccess: '✅ 成功！',
    imageSentSuccessDesc: '图片已成功发送到您的私信！',
    imageSentError: '错误',
    imageSentErrorDesc: '发送图片失败。请重试。',
    ok: '确定',
    
    // My Gifts
    myGifts: '我的礼物',
    totalValue: '总价值',
    noGiftsYet: '还没有礼物',
    noGiftsDescription: '您的 Telegram 礼物将显示在这里。从朋友那里收到礼物后开始收集吧！',
    
    // View modes
    gridView: '网格视图',
    listView: '列表视图',
    
    // Gift details
    floor: '底价',
    avgPrice: '平均价格',
    priceChange: '价格变化',
    viewInStore: '在商店查看',
    
    // Status
    loading: '加载中...',
    error: '出错了',
    retry: '重试',
    
    // Actions
    refresh: '刷新',
    share: '分享',
    close: '关闭',
  },
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
    english: '🇬🇧 English',
    arabic: '🇮🇶 العربية',
    russian: '🇷🇺 Русский',
    chinese: '🇨🇳 中文',
    
    // Community
    community: 'Community',
    joinTelegramChannel: 'Join Telegram Channel',
    joinTelegramGroup: 'Join Telegram Community',
    
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
    
    // Image Sending
    imageSending: 'Sending Image',
    imageWillBeSent: 'Image will be sent to you soon',
    imageSentSuccess: '✅ Success!',
    imageSentSuccessDesc: 'Image has been sent to your private messages successfully!',
    imageSentError: 'Error',
    imageSentErrorDesc: 'Failed to send image. Please try again.',
    ok: 'OK',
    
    // Home Page Hero
    heroTitle: 'Calculate Your Gift Value Accurately Now',
    heroDescription: 'Track Telegram NFT gift prices in real-time. Get accurate valuations, market insights, and price history for all your collectibles.',
    heroExample: 'Enter a username or gift URL above to start',
    footerNote: 'Prices are updated automatically from verified market sources. Data refreshes every few minutes to ensure accuracy.',
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
    english: '🇬🇧 الإنجليزية',
    arabic: '🇮🇶 العربية',
    russian: '🇷🇺 الروسية',
    chinese: '🇨🇳 中文',
    
    // Community
    community: 'المجتمع',
    joinTelegramChannel: 'انضم لقناة التليجرام',
    joinTelegramGroup: 'انضم لمجتمع التليجرام',
    
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
    
    // Image Sending
    imageSending: 'جاري الإرسال',
    imageWillBeSent: 'ستصلك الصورة قريباً',
    imageSentSuccess: '✅ نجح!',
    imageSentSuccessDesc: 'تم إرسال الصورة إلى رسائلك الخاصة بنجاح!',
    imageSentError: 'خطأ',
    imageSentErrorDesc: 'فشل إرسال الصورة. يرجى المحاولة مرة أخرى.',
    ok: 'حسناً',
    
    // Home Page Hero
    heroTitle: 'احسب قيمة هداياك بدقة الآن',
    heroDescription: 'تتبع أسعار هدايا NFT على تليجرام في الوقت الفعلي. احصل على تقييمات دقيقة ورؤى السوق وسجل الأسعار لجميع مقتنياتك.',
    heroExample: 'أدخل اسم مستخدم أو رابط هدية أعلاه للبدء',
    footerNote: 'يتم تحديث الأسعار تلقائيًا من مصادر السوق الموثوقة. تُحدث البيانات كل بضع دقائق لضمان الدقة.',
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
    english: '🇬🇧 Английский',
    arabic: '🇮🇶 Арабский',
    russian: '🇷🇺 Русский',
    chinese: '🇨🇳 中文',
    
    // Community
    community: 'Сообщество',
    joinTelegramChannel: 'Присоединиться к каналу Telegram',
    joinTelegramGroup: 'Присоединиться к сообществу Telegram',
    
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
    
    // Image Sending
    imageSending: 'Отправка изображения',
    imageWillBeSent: 'Изображение будет отправлено вам в ближайшее время',
    imageSentSuccess: '✅ Успешно!',
    imageSentSuccessDesc: 'Изображение успешно отправлено в ваши личные сообщения!',
    imageSentError: 'Ошибка',
    imageSentErrorDesc: 'Не удалось отправить изображение. Пожалуйста, попробуйте еще раз.',
    ok: 'ОК',
    
    // Home Page Hero
    heroTitle: 'Точно рассчитайте стоимость ваших подарков сейчас',
    heroDescription: 'Отслеживайте цены NFT подарков Telegram в режиме реального времени. Получайте точные оценки, рыночную аналитику и историю цен для всех ваших коллекционных предметов.',
    heroExample: 'Введите имя пользователя или URL подарка выше, чтобы начать',
    footerNote: 'Цены обновляются автоматически из проверенных рыночных источников. Данные обновляются каждые несколько минут для обеспечения точности.',
  },
};

export const getTranslation = (lang: Language, key: keyof typeof translations.en): string => {
  return translations[lang][key] || translations.en[key];
};
