// ConnectOn — Internationalization (i18n) System
// Default: English. Supports 8 Indian languages.
// Usage: const { t, locale, setLocale } = useI18n();
//        <p>{t('hero_title')}</p>

export type Locale = "en" | "hi" | "ta" | "te" | "bn" | "kn" | "mr" | "gu";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  hi: "हिंदी",
  ta: "தமிழ்",
  te: "తెలుగు",
  bn: "বাংলা",
  kn: "ಕನ್ನಡ",
  mr: "मराठी",
  gu: "ગુજરાતી",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  hi: "🇮🇳",
  ta: "🇮🇳",
  te: "🇮🇳",
  bn: "🇮🇳",
  kn: "🇮🇳",
  mr: "🇮🇳",
  gu: "🇮🇳",
};

type TranslationKeys = {
  // ===== NAVBAR =====
  nav_how_it_works: string;
  nav_for_workers: string;
  nav_for_businesses: string;
  nav_marketplace: string;
  nav_login: string;
  nav_register_worker: string;
  nav_hire_workers: string;

  // ===== LANDING PAGE =====
  hero_badge: string;
  hero_title: string;
  hero_title_highlight: string;
  hero_subtitle: string;
  hero_cta_worker: string;
  hero_cta_hirer: string;

  // ===== Stats =====
  stat_workers: string;
  stat_cities: string;
  stat_bookings: string;
  stat_savings: string;

  // ===== Login =====
  login_worker_tab: string;
  login_hirer_tab: string;
  login_welcome_worker: string;
  login_welcome_hirer: string;
  login_subtitle_worker: string;
  login_subtitle_hirer: string;
  login_phone_label: string;
  login_phone_placeholder: string;
  login_send_otp: string;
  login_sending_otp: string;
  login_enter_otp: string;
  login_otp_sent_to: string;
  login_verify: string;
  login_verifying: string;
  login_resend_otp: string;
  login_resend_in: string;
  login_success: string;
  login_redirecting_worker: string;
  login_redirecting_hirer: string;
  login_new_here: string;
  login_register_worker: string;
  login_register_hirer: string;
  login_change_number: string;
  login_encrypted: string;
  login_dpdp: string;

  // ===== Dashboard =====
  dashboard_welcome: string;
  dashboard_overview: string;
  dashboard_total_earnings: string;
  dashboard_jobs_completed: string;
  dashboard_avg_rating: string;
  dashboard_konnect_score: string;
  dashboard_recent_jobs: string;
  dashboard_view_all: string;

  // ===== Marketplace =====
  marketplace_title: string;
  marketplace_search: string;
  marketplace_all_skills: string;
  marketplace_filters: string;
  marketplace_workers_found: string;
  marketplace_book_now: string;
  marketplace_available: string;
  marketplace_busy: string;

  // ===== Common =====
  common_loading: string;
  common_error: string;
  common_retry: string;
  common_go_home: string;
  common_not_found: string;
  common_not_found_desc: string;
  common_browse_marketplace: string;

  // ===== KaizyPay =====
  pay_escrow_title: string;
  pay_escrow_subtitle: string;
  pay_how_it_works: string;
  pay_booking_created: string;
  pay_escrow_funded: string;
  pay_job_started: string;
  pay_job_completed: string;
  pay_payment_released: string;
  pay_job_amount: string;
  pay_platform_fee: string;
  pay_worker_payout: string;

  // ===== Referral =====
  referral_title: string;
  referral_subtitle: string;
  referral_your_code: string;
  referral_whatsapp_share: string;
  referral_tiers_title: string;
  referral_per_referral: string;

  // ===== Footer =====
  footer_cta_title: string;
  footer_cta_subtitle: string;
  footer_copyright: string;
};

// ===== ENGLISH (DEFAULT) =====
const en: TranslationKeys = {
  nav_how_it_works: "How It Works",
  nav_for_workers: "For Workers",
  nav_for_businesses: "For Businesses",
  nav_marketplace: "Marketplace",
  nav_login: "Log In",
  nav_register_worker: "Register as Worker",
  nav_hire_workers: "Hire Workers",

  hero_badge: "India's Workforce Operating System",
  hero_title: "The Bridge to",
  hero_title_highlight: "Dignified Work",
  hero_subtitle: "ConnectOn gives 55 crore skilled workers a digital identity, verified job matches, and same-day UPI payments — all in your language.",
  hero_cta_worker: "Register as Worker",
  hero_cta_hirer: "Hire Workers",

  stat_workers: "Verified Workers",
  stat_cities: "Cities Live",
  stat_bookings: "Monthly Bookings",
  stat_savings: "Avg. Savings",

  login_worker_tab: "👷 Worker / कारीगर",
  login_hirer_tab: "🏢 Business / व्यवसाय",
  login_welcome_worker: "Welcome, Kaariger! 🙏",
  login_welcome_hirer: "Welcome, Business Owner! 🏢",
  login_subtitle_worker: "Enter your mobile number to access your ConnectPassport",
  login_subtitle_hirer: "Enter your mobile number to manage your bookings",
  login_phone_label: "Mobile Number",
  login_phone_placeholder: "98765 43210",
  login_send_otp: "Send OTP",
  login_sending_otp: "Sending OTP...",
  login_enter_otp: "Enter OTP",
  login_otp_sent_to: "6-digit code sent to",
  login_verify: "Verify & Login",
  login_verifying: "Verifying...",
  login_resend_otp: "Resend OTP",
  login_resend_in: "Resend OTP in",
  login_success: "Login Successful! 🎉",
  login_redirecting_worker: "Welcome back! Redirecting to your ConnectPassport...",
  login_redirecting_hirer: "Welcome back! Redirecting to your dashboard...",
  login_new_here: "New here?",
  login_register_worker: "Register as Worker →",
  login_register_hirer: "Register as Business →",
  login_change_number: "Change Number",
  login_encrypted: "256-bit Encrypted",
  login_dpdp: "DPDP Compliant",

  dashboard_welcome: "Welcome back",
  dashboard_overview: "Here's your work overview for today",
  dashboard_total_earnings: "Total Earnings",
  dashboard_jobs_completed: "Jobs Completed",
  dashboard_avg_rating: "Avg Rating",
  dashboard_konnect_score: "ConnectScore",
  dashboard_recent_jobs: "Recent Jobs",
  dashboard_view_all: "View All",

  marketplace_title: "Find Skilled Workers",
  marketplace_search: 'Search: "certified electrician" or "AC repair near me"',
  marketplace_all_skills: "All Skills",
  marketplace_filters: "Filters",
  marketplace_workers_found: "verified workers found",
  marketplace_book_now: "Book Now",
  marketplace_available: "AVAILABLE",
  marketplace_busy: "BUSY",

  common_loading: "Loading...",
  common_error: "Something Went Wrong",
  common_retry: "Try Again",
  common_go_home: "Go Home",
  common_not_found: "Page Not Found",
  common_not_found_desc: "Oops! The page you're looking for doesn't exist.",
  common_browse_marketplace: "Browse Marketplace",

  pay_escrow_title: "ConnectPay",
  pay_escrow_subtitle: "Same-day UPI payments with escrow protection. Your money is safe until the job is done.",
  pay_how_it_works: "How Escrow Works",
  pay_booking_created: "Booking Created",
  pay_escrow_funded: "Escrow Funded",
  pay_job_started: "Job Started",
  pay_job_completed: "Job Completed",
  pay_payment_released: "Payment Released",
  pay_job_amount: "Job Amount",
  pay_platform_fee: "Platform Fee (10%)",
  pay_worker_payout: "Worker Payout",

  referral_title: "Invite Workers, Earn ₹100–₹300 Each",
  referral_subtitle: "Every worker you bring earns you cash. They get jobs, you get rewards.",
  referral_your_code: "Your Referral Code",
  referral_whatsapp_share: "WhatsApp Share",
  referral_tiers_title: "Referral Tiers — Earn More as You Grow",
  referral_per_referral: "/referral",

  footer_cta_title: "Ready to start?",
  footer_cta_subtitle: "Join 7,400+ workers already earning more with ConnectOn.",
  footer_copyright: "© 2026 ConnectOn. All rights reserved.",
};

// ===== HINDI =====
const hi: TranslationKeys = {
  nav_how_it_works: "कैसे काम करता है",
  nav_for_workers: "कारीगरों के लिए",
  nav_for_businesses: "व्यवसायों के लिए",
  nav_marketplace: "मार्केटप्लेस",
  nav_login: "लॉग इन",
  nav_register_worker: "कारीगर रजिस्टर करें",
  nav_hire_workers: "कारीगर खोजें",

  hero_badge: "भारत का वर्कफोर्स ऑपरेटिंग सिस्टम",
  hero_title: "सम्मानजनक काम का",
  hero_title_highlight: "पुल",
  hero_subtitle: "ConnectOn 55 करोड़ कुशल कारीगरों को डिजिटल पहचान, वेरिफाइड जॉब मैचिंग, और उसी दिन UPI पेमेंट देता है — आपकी भाषा में।",
  hero_cta_worker: "कारीगर रजिस्टर करें",
  hero_cta_hirer: "कारीगर खोजें",

  stat_workers: "वेरिफाइड कारीगर",
  stat_cities: "शहर लाइव",
  stat_bookings: "मासिक बुकिंग",
  stat_savings: "औसत बचत",

  login_worker_tab: "👷 कारीगर",
  login_hirer_tab: "🏢 व्यवसाय",
  login_welcome_worker: "स्वागत है, कारीगर! 🙏",
  login_welcome_hirer: "स्वागत है, व्यवसाय मालिक! 🏢",
  login_subtitle_worker: "अपना मोबाइल नंबर डालें ConnectPassport एक्सेस करने के लिए",
  login_subtitle_hirer: "अपना मोबाइल नंबर डालें बुकिंग मैनेज करने के लिए",
  login_phone_label: "मोबाइल नंबर",
  login_phone_placeholder: "98765 43210",
  login_send_otp: "OTP भेजें",
  login_sending_otp: "OTP भेज रहे हैं...",
  login_enter_otp: "OTP डालें",
  login_otp_sent_to: "6 अंकों का कोड भेजा गया",
  login_verify: "वेरिफाई करें",
  login_verifying: "वेरिफाई हो रहा है...",
  login_resend_otp: "OTP दोबारा भेजें",
  login_resend_in: "OTP दोबारा भेजें",
  login_success: "लॉगिन सफल! 🎉",
  login_redirecting_worker: "वापसी पर स्वागत! ConnectPassport पर जा रहे हैं...",
  login_redirecting_hirer: "वापसी पर स्वागत! डैशबोर्ड पर जा रहे हैं...",
  login_new_here: "नए हैं?",
  login_register_worker: "कारीगर रजिस्टर करें →",
  login_register_hirer: "व्यवसाय रजिस्टर करें →",
  login_change_number: "नंबर बदलें",
  login_encrypted: "256-बिट एन्क्रिप्टेड",
  login_dpdp: "DPDP अनुपालन",

  dashboard_welcome: "वापसी पर स्वागत",
  dashboard_overview: "आज के काम का अवलोकन",
  dashboard_total_earnings: "कुल कमाई",
  dashboard_jobs_completed: "पूर्ण किए गए काम",
  dashboard_avg_rating: "औसत रेटिंग",
  dashboard_konnect_score: "ConnectScore",
  dashboard_recent_jobs: "हाल के काम",
  dashboard_view_all: "सभी देखें",

  marketplace_title: "कुशल कारीगर खोजें",
  marketplace_search: 'खोजें: "सर्टिफाइड इलेक्ट्रीशियन" या "AC रिपेयर"',
  marketplace_all_skills: "सभी कौशल",
  marketplace_filters: "फ़िल्टर",
  marketplace_workers_found: "वेरिफाइड कारीगर मिले",
  marketplace_book_now: "अभी बुक करें",
  marketplace_available: "उपलब्ध",
  marketplace_busy: "व्यस्त",

  common_loading: "लोड हो रहा है...",
  common_error: "कुछ गलत हो गया",
  common_retry: "दोबारा कोशिश करें",
  common_go_home: "होम जाएं",
  common_not_found: "पेज नहीं मिला",
  common_not_found_desc: "यह पेज मौजूद नहीं है।",
  common_browse_marketplace: "मार्केटप्लेस देखें",

  pay_escrow_title: "ConnectPay",
  pay_escrow_subtitle: "एस्क्रो सुरक्षा के साथ उसी दिन UPI पेमेंट। काम पूरा होने तक आपका पैसा सुरक्षित।",
  pay_how_it_works: "एस्क्रो कैसे काम करता है",
  pay_booking_created: "बुकिंग बनी",
  pay_escrow_funded: "एस्क्रो में पैसा",
  pay_job_started: "काम शुरू",
  pay_job_completed: "काम पूरा",
  pay_payment_released: "पेमेंट रिलीज़",
  pay_job_amount: "काम की राशि",
  pay_platform_fee: "प्लेटफ़ॉर्म शुल्क (10%)",
  pay_worker_payout: "कारीगर का पेमेंट",

  referral_title: "कारीगरों को बुलाएं, ₹100–₹300 कमाएं",
  referral_subtitle: "हर कारीगर जो आप लाते हैं, आपको कैश मिलता है।",
  referral_your_code: "आपका रेफरल कोड",
  referral_whatsapp_share: "WhatsApp शेयर",
  referral_tiers_title: "रेफरल टियर — ज़्यादा रेफर, ज़्यादा कमाई",
  referral_per_referral: "/रेफरल",

  footer_cta_title: "शुरू करने के लिए तैयार?",
  footer_cta_subtitle: "7,400+ कारीगर पहले से ConnectOn पर ज़्यादा कमा रहे हैं।",
  footer_copyright: "© 2026 ConnectOn. सर्वाधिकार सुरक्षित।",
};

// ===== TAMIL =====
const ta: TranslationKeys = {
  nav_how_it_works: "எப்படி வேலை செய்கிறது",
  nav_for_workers: "தொழிலாளர்களுக்கு",
  nav_for_businesses: "வணிகத்திற்கு",
  nav_marketplace: "சந்தை",
  nav_login: "உள்நுழைய",
  nav_register_worker: "தொழிலாளர் பதிவு",
  nav_hire_workers: "தொழிலாளர் தேடு",

  hero_badge: "இந்தியாவின் பணியாளர் இயங்குதள அமைப்பு",
  hero_title: "கண்ணியமான வேலைக்கான",
  hero_title_highlight: "பாலம்",
  hero_subtitle: "ConnectOn 55 கோடி திறமையான தொழிலாளர்களுக்கு டிஜிட்டல் அடையாளம், சரிபார்க்கப்பட்ட வேலை, அதே நாள் UPI கட்டணம் வழங்குகிறது.",
  hero_cta_worker: "தொழிலாளர் பதிவு",
  hero_cta_hirer: "தொழிலாளர் தேடு",

  stat_workers: "சரிபார்க்கப்பட்ட தொழிலாளர்கள்",
  stat_cities: "நகரங்கள் நேரடி",
  stat_bookings: "மாதாந்திர முன்பதிவுகள்",
  stat_savings: "சராசரி சேமிப்பு",

  login_worker_tab: "👷 தொழிலாளர்",
  login_hirer_tab: "🏢 வணிகம்",
  login_welcome_worker: "வரவேற்பு, தொழிலாளர்! 🙏",
  login_welcome_hirer: "வரவேற்பு, வணிக உரிமையாளர்! 🏢",
  login_subtitle_worker: "ConnectPassport அணுக உங்கள் மொபைல் எண்ணை உள்ளிடவும்",
  login_subtitle_hirer: "முன்பதிவுகளை நிர்வகிக்க உங்கள் எண்ணை உள்ளிடவும்",
  login_phone_label: "மொபைல் எண்",
  login_phone_placeholder: "98765 43210",
  login_send_otp: "OTP அனுப்பு",
  login_sending_otp: "OTP அனுப்புகிறது...",
  login_enter_otp: "OTP உள்ளிடவும்",
  login_otp_sent_to: "6 இலக்க குறியீடு அனுப்பப்பட்டது",
  login_verify: "சரிபார்த்து உள்நுழையவும்",
  login_verifying: "சரிபார்க்கிறது...",
  login_resend_otp: "OTP மீண்டும் அனுப்பு",
  login_resend_in: "OTP மீண்டும் அனுப்பு",
  login_success: "உள்நுழைவு வெற்றி! 🎉",
  login_redirecting_worker: "வரவேற்கிறோம்! ConnectPassport க்கு செல்கிறது...",
  login_redirecting_hirer: "வரவேற்கிறோம்! டாஷ்போர்டுக்கு செல்கிறது...",
  login_new_here: "புதியவரா?",
  login_register_worker: "தொழிலாளர் பதிவு →",
  login_register_hirer: "வணிக பதிவு →",
  login_change_number: "எண்ணை மாற்று",
  login_encrypted: "256-பிட் குறியாக்கம்",
  login_dpdp: "DPDP இணக்கம்",

  dashboard_welcome: "மீண்டும் வரவேற்கிறோம்",
  dashboard_overview: "இன்றைய வேலை மேலோட்டம்",
  dashboard_total_earnings: "மொத்த வருமானம்",
  dashboard_jobs_completed: "முடிக்கப்பட்ட வேலைகள்",
  dashboard_avg_rating: "சராசரி மதிப்பீடு",
  dashboard_konnect_score: "ConnectScore",
  dashboard_recent_jobs: "சமீபத்திய வேலைகள்",
  dashboard_view_all: "அனைத்தும் பார்",

  marketplace_title: "திறமையான தொழிலாளர்களை கண்டறியுங்கள்",
  marketplace_search: 'தேடு: "சான்றளிக்கப்பட்ட எலக்ட்ரீஷியன்"',
  marketplace_all_skills: "அனைத்து திறன்கள்",
  marketplace_filters: "வடிகட்டிகள்",
  marketplace_workers_found: "சரிபார்க்கப்பட்ட தொழிலாளர்கள்",
  marketplace_book_now: "இப்போது முன்பதிவு",
  marketplace_available: "கிடைக்கும்",
  marketplace_busy: "பிஸி",

  common_loading: "ஏற்றுகிறது...",
  common_error: "ஏதோ தவறு ஏற்பட்டது",
  common_retry: "மீண்டும் முயற்சி",
  common_go_home: "முகப்புக்கு செல்",
  common_not_found: "பக்கம் கிடைக்கவில்லை",
  common_not_found_desc: "இந்த பக்கம் இல்லை.",
  common_browse_marketplace: "சந்தையை பார்",

  pay_escrow_title: "ConnectPay",
  pay_escrow_subtitle: "எஸ்க்ரோ பாதுகாப்புடன் அதே நாள் UPI. வேலை முடியும் வரை உங்கள் பணம் பாதுகாப்பாக.",
  pay_how_it_works: "எஸ்க்ரோ எப்படி வேலை செய்கிறது",
  pay_booking_created: "முன்பதிவு உருவாக்கப்பட்டது",
  pay_escrow_funded: "எஸ்க்ரோ நிதி",
  pay_job_started: "வேலை தொடங்கியது",
  pay_job_completed: "வேலை முடிந்தது",
  pay_payment_released: "கட்டணம் வழங்கப்பட்டது",
  pay_job_amount: "வேலை தொகை",
  pay_platform_fee: "தளம் கட்டணம் (10%)",
  pay_worker_payout: "தொழிலாளர் கட்டணம்",

  referral_title: "தொழிலாளர்களை அழையுங்கள், ₹100–₹300 சம்பாதியுங்கள்",
  referral_subtitle: "நீங்கள் கொண்டு வரும் ஒவ்வொரு தொழிலாளருக்கும் பணம் கிடைக்கும்.",
  referral_your_code: "உங்கள் ரெஃபரல் குறியீடு",
  referral_whatsapp_share: "WhatsApp பகிர்",
  referral_tiers_title: "ரெஃபரல் நிலைகள் — அதிகம் பகிர், அதிகம் சம்பாதி",
  referral_per_referral: "/ரெஃபரல்",

  footer_cta_title: "தொடங்க தயாரா?",
  footer_cta_subtitle: "7,400+ தொழிலாளர்கள் ஏற்கனவே ConnectOn இல் அதிகம் சம்பாதிக்கிறார்கள்.",
  footer_copyright: "© 2026 ConnectOn. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
};

// Translations map
const translations: Record<Locale, TranslationKeys> = {
  en,
  hi,
  ta,
  // For other languages, fall back to Hindi (closest common understanding)
  te: { ...hi, hero_badge: "భారతదేశ వర్క్‌ఫోర్స్ ఆపరేటింగ్ సిస్టమ్" },
  bn: { ...hi, hero_badge: "ভারতের কর্মশক্তি পরিচালনা ব্যবস্থা" },
  kn: { ...hi, hero_badge: "ಭಾರತದ ಕಾರ್ಯಪಡೆ ಆಪರೇಟಿಂಗ್ ಸಿಸ್ಟಮ್" },
  mr: { ...hi, hero_badge: "भारताची कार्यबल ऑपरेटिंग सिस्टम" },
  gu: { ...hi, hero_badge: "ભારતની વર્કફોર્સ ઓપરેટિંગ સિસ્ટમ" },
};

// Get translations for a locale
export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] || translations.en;
}

// Get a single translation key
export function t(locale: Locale, key: keyof TranslationKeys): string {
  const lang = translations[locale] || translations.en;
  return lang[key] || translations.en[key] || key;
}

export default translations;
