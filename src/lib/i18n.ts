// Kaizy — Internationalization (i18n) System
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
  dashboard_kaizy_score: string;
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
  hero_subtitle: "Kaizy gives 55 crore skilled workers a digital identity, verified job matches, and same-day UPI payments — all in your language.",
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
  login_subtitle_worker: "Enter your mobile number to access your KaizyPass",
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
  login_redirecting_worker: "Welcome back! Redirecting to your KaizyPass...",
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
  dashboard_kaizy_score: "KaizyScore",
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

  pay_escrow_title: "KaizyPay",
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
  footer_cta_subtitle: "Join 7,400+ workers already earning more with Kaizy.",
  footer_copyright: "© 2026 Kaizy. All rights reserved.",
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
  hero_subtitle: "Kaizy 55 करोड़ कुशल कारीगरों को डिजिटल पहचान, वेरिफाइड जॉब मैचिंग, और उसी दिन UPI पेमेंट देता है — आपकी भाषा में।",
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
  login_subtitle_worker: "अपना मोबाइल नंबर डालें KaizyPass एक्सेस करने के लिए",
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
  login_redirecting_worker: "वापसी पर स्वागत! KaizyPass पर जा रहे हैं...",
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
  dashboard_kaizy_score: "KaizyScore",
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

  pay_escrow_title: "KaizyPay",
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
  footer_cta_subtitle: "7,400+ कारीगर पहले से Kaizy पर ज़्यादा कमा रहे हैं।",
  footer_copyright: "© 2026 Kaizy. सर्वाधिकार सुरक्षित।",
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
  hero_subtitle: "Kaizy 55 கோடி திறமையான தொழிலாளர்களுக்கு டிஜிட்டல் அடையாளம், சரிபார்க்கப்பட்ட வேலை, அதே நாள் UPI கட்டணம் வழங்குகிறது.",
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
  login_subtitle_worker: "KaizyPass அணுக உங்கள் மொபைல் எண்ணை உள்ளிடவும்",
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
  login_redirecting_worker: "வரவேற்கிறோம்! KaizyPass க்கு செல்கிறது...",
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
  dashboard_kaizy_score: "KaizyScore",
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

  pay_escrow_title: "KaizyPay",
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
  footer_cta_subtitle: "7,400+ தொழிலாளர்கள் ஏற்கனவே Kaizy இல் அதிகம் சம்பாதிக்கிறார்கள்.",
  footer_copyright: "© 2026 Kaizy. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
};

// ===== TELUGU =====
const te: TranslationKeys = {
  ...en,
  nav_how_it_works: "ఇది ఎలా పనిచేస్తుంది",
  nav_for_workers: "కార్మికుల కోసం",
  nav_for_businesses: "వ్యాపారాల కోసం",
  nav_marketplace: "మార్కెట్‌ప్లేస్",
  nav_login: "లాగిన్",
  nav_register_worker: "కార్మికుడిగా నమోదు",
  nav_hire_workers: "కార్మికులను పొందండి",

  hero_badge: "భారతదేశ వర్క్‌ఫోర్స్ ఆపరేటింగ్ సిస్టమ్",
  hero_title: "గౌరవప్రదమైన పనికి",
  hero_title_highlight: "వారధి",
  hero_subtitle: "Kaizy 55 కోట్ల నైపుణ్యం కలిగిన కార్మికులకు డిజిటల్ గుర్తింపు, ధృవీకరించిన పని, అదే రోజు UPI చెల్లింపును అందిస్తుంది.",
  hero_cta_worker: "కార్మికుడిగా నమోదు",
  hero_cta_hirer: "కార్మికులను పొందండి",

  stat_workers: "ధృవీకరించిన కార్మికులు",
  stat_cities: "లైవ్ నగరాలు",
  stat_bookings: "నెలవారీ బుకింగ్‌లు",
  stat_savings: "సగటు పొదుపు",

  login_worker_tab: "👷 కార్మికుడు",
  login_hirer_tab: "🏢 వ్యాపారం",
  login_welcome_worker: "స్వాగతం, కార్మికుడా! 🙏",
  login_welcome_hirer: "స్వాగతం, యజమాని! 🏢",
  login_subtitle_worker: "మీ KaizyPass పొందడానికి మొబైల్ నంబర్ నమోదు చేయండి",
  login_subtitle_hirer: "బుకింగ్‌లను నిర్వహించడానికి మొబైల్ నంబర్ నమోదు చేయండి",
  login_phone_label: "మొబైల్ నంబర్",
  login_phone_placeholder: "98765 43210",
  login_send_otp: "OTP పంపండి",
  login_sending_otp: "OTP పంపుతోంది...",
  login_enter_otp: "OTP నమోదు చేయండి",
  login_otp_sent_to: "6-అంకెల కోడ్ పంపబడింది",
  login_verify: "ధృవీకరించి లాగిన్ అవ్వండి",
  login_verifying: "ధృవీకరిస్తోంది...",
  login_resend_otp: "OTP మళ్లీ పంపండి",
  login_resend_in: "OTP మళ్లీ పంపండి",
  login_success: "లాగిన్ విజయవంతమైంది! 🎉",
  login_redirecting_worker: "KaizyPass కి మళ్లిస్తోంది...",
  login_redirecting_hirer: "డాష్‌బోర్డ్‌కి మళ్లిస్తోంది...",
  login_new_here: "కొత్తవారా?",
  login_register_worker: "కార్మికుడిగా నమోదు →",
  login_register_hirer: "వ్యాపారంగా నమోదు →",
  login_change_number: "నంబర్ మార్చండి",
  login_encrypted: "256-బిట్ గుప్తీకరించబడింది",
  login_dpdp: "DPDP కంప్లైంట్",

  dashboard_welcome: "స్వాగతం",
  dashboard_overview: "ఈరోజు పని సారాంశం",
  dashboard_total_earnings: "మొత్తం సంపాదన",
  dashboard_jobs_completed: "పూర్తి చేసిన పనులు",
  dashboard_avg_rating: "సగటు రేటింగ్",
  dashboard_kaizy_score: "KaizyScore",
  dashboard_recent_jobs: "ఇటీవలి పనులు",
  dashboard_view_all: "అన్నీ చూడండి",

  marketplace_title: "నైపుణ్యం కలిగిన కార్మికులను కనుగొనండి",
  marketplace_search: 'వెతకండి: "ఎలక్ట్రీషియన్" లేదా "AC రిపేర్"',
  marketplace_all_skills: "అన్ని నైపుణ్యాలు",
  marketplace_filters: "ఫిల్టర్లు",
  marketplace_workers_found: "ధృవీకరించిన కార్మికులు దొరికారు",
  marketplace_book_now: "ఇప్పుడే బుక్ చేయండి",
  marketplace_available: "అందుబాటులో ఉన్నారు",
  marketplace_busy: "బిజీ",

  common_loading: "లోడ్ అవుతోంది...",
  common_error: "ఏదో తప్పు జరిగింది",
  common_retry: "మళ్లీ ప్రయత్నించండి",
  common_go_home: "హోమ్‌కి వెళ్లండి",
  common_not_found: "పేజీ కనుగొనబడలేదు",
  common_not_found_desc: "ఈ పేజీ అందుబాటులో లేదు.",
  common_browse_marketplace: "మార్కెట్‌ప్లేస్ చూడండి",

  pay_escrow_title: "KaizyPay",
  pay_escrow_subtitle: "ఎక్రో రక్షణతో అదే రోజు UPI చెల్లింపులు.",
  pay_how_it_works: "ఎక్రో ఎలా పనిచేస్తుంది",
  pay_booking_created: "బుకింగ్ సృష్టించబడింది",
  pay_escrow_funded: "ఎక్రో నిధి",
  pay_job_started: "పని ప్రారంభమైంది",
  pay_job_completed: "పని పూర్తయింది",
  pay_payment_released: "చెల్లింపు విడుదలైంది",
  pay_job_amount: "పని మొత్తం",
  pay_platform_fee: "ప్లాట్‌ఫారమ్ రుసుము (10%)",
  pay_worker_payout: "కార్మికుడి చెల్లింపు",

  referral_title: "కార్మికులను ఆహ్వానించండి, ₹100–₹300 సంపాదించండి",
  referral_subtitle: "మీరు తెచ్చే ప్రతి కార్మికుడితో నగదు సంపాదించండి.",
  referral_your_code: "మీ రెఫరల్ కోడ్",
  referral_whatsapp_share: "WhatsApp షేర్",
  referral_tiers_title: "రెఫరల్ స్థాయిలు",
  referral_per_referral: "/రెఫరల్",

  footer_cta_title: "ప్రారంభించడానికి సిద్ధమా?",
  footer_cta_subtitle: "7,400+ కార్మికులు ఇప్పటికే Kaizyతో మరింత సంపాదిస్తున్నారు.",
  footer_copyright: "© 2026 Kaizy. సర్వహక్కులు ప్రత్యేకించబడ్డాయి.",
};

// ===== KANNADA =====
const kn: TranslationKeys = {
  ...en,
  nav_how_it_works: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
  nav_for_workers: "ಕಾರ್ಮಿಕರಿಗಾಗಿ",
  nav_for_businesses: "ವ್ಯವಹಾರಗಳಿಗಾಗಿ",
  nav_marketplace: "ಮಾರುಕಟ್ಟೆ",
  nav_login: "ಲಾಗಿನ್",
  nav_register_worker: "ಕಾರ್ಮಿಕರಾಗಿ ನೋಂದಾಯಿಸಿ",
  nav_hire_workers: "ಕಾರ್ಮಿಕರನ್ನು ನೇಮಿಸಿ",

  hero_badge: "ಭಾರತದ ಕಾರ್ಯಪಡೆ ಆಪರೇಟಿಂಗ್ ಸಿಸ್ಟಮ್",
  hero_title: "ಗೌರವಾನ್ವಿತ ಕೆಲಸಕ್ಕೆ",
  hero_title_highlight: "ಸೇತುವೆ",
  hero_subtitle: "Kaizy 55 ಕೋಟಿ ಕೌಶಲ್ಯಪೂರ್ಣ ಕಾರ್ಮಿಕರಿಗೆ ಡಿಜಿಟಲ್ ಗುರುತು, ಪರಿಶೀಲಿಸಿದ ಕೆಲಸ, ಮತ್ತು ಅದೇ ದಿನದ UPI ಪಾವತಿಯನ್ನು ಒದಗಿಸುತ್ತದೆ.",
  hero_cta_worker: "ಕಾರ್ಮಿಕರಾಗಿ ನೋಂದಾಯಿಸಿ",
  hero_cta_hirer: "ಕಾರ್ಮಿಕರನ್ನು ನೇಮಿಸಿ",

  stat_workers: "ಪರಿಶೀಲಿಸಿದ ಕಾರ್ಮಿಕರು",
  stat_cities: "ನಗರಗಳು ಲೈವ್",
  stat_bookings: "ಮಾಸಿಕ ಬುಕಿಂಗ್‌ಗಳು",
  stat_savings: "ಸರಾಸರಿ ಉಳಿತಾಯ",

  login_worker_tab: "👷 ಕಾರ್ಮಿಕ",
  login_hirer_tab: "🏢 ವ್ಯಾಪಾರ",
  login_welcome_worker: "ಸ್ವಾಗತ, ಕಾರ್ಮಿಕ ಮಿತ್ರ! 🙏",
  login_welcome_hirer: "ಸ್ವಾಗತ, ಉದ್ಯಮಿ! 🏢",
  login_subtitle_worker: "ನಿಮ್ಮ KaizyPass ಪಡೆಯಲು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
  login_subtitle_hirer: "ಬುಕಿಂಗ್ ನಿರ್ವಹಿಸಲು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
  login_phone_label: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
  login_phone_placeholder: "98765 43210",
  login_send_otp: "OTP ಕಳುಹಿಸಿ",
  login_sending_otp: "OTP ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
  login_enter_otp: "OTP ನಮೂದಿಸಿ",
  login_otp_sent_to: "6-ಅಂಕಿಯ ಕೋಡ್ ಕಳುಹಿಸಲಾಗಿದೆ",
  login_verify: "ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಲಾಗಿನ್ ಮಾಡಿ",
  login_verifying: "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...",
  login_resend_otp: "OTP ಮರುಕಳುಹಿಸಿ",
  login_resend_in: "OTP ಮರುಕಳುಹಿಸಿ",
  login_success: "ಲಾಗಿನ್ ಯಶಸ್ವಿಯಾಗಿದೆ! 🎉",
  login_redirecting_worker: "KaizyPass ಗೆ ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...",
  login_redirecting_hirer: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...",
  login_new_here: "ಹೊಸಬರೇ?",
  login_register_worker: "ಕಾರ್ಮಿಕರಾಗಿ ನೋಂದಾಯಿಸಿ →",
  login_register_hirer: "ವ್ಯವಹಾರವಾಗಿ ನೋಂದಾಯಿಸಿ →",
  login_change_number: "ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ",
  login_encrypted: "256-ಬಿಟ್ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ",
  login_dpdp: "DPDP ಅನುಸರಣೆ",

  dashboard_welcome: "ಮತ್ತೆ ಸ್ವಾಗತ",
  dashboard_overview: "ಇಂದಿನ ಕೆಲಸದ ಅವಲೋಕನ",
  dashboard_total_earnings: "ಒಟ್ಟು ಗಳಿಕೆ",
  dashboard_jobs_completed: "ಪೂರ್ಣಗೊಂಡ ಕೆಲಸಗಳು",
  dashboard_avg_rating: "ಸರಾಸರಿ ರೇಟಿಂಗ್",
  dashboard_kaizy_score: "KaizyScore",
  dashboard_recent_jobs: "ಇತ್ತೀಚಿನ ಕೆಲಸಗಳು",
  dashboard_view_all: "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ",

  marketplace_title: "ಕೌಶಲ್ಯಪೂರ್ಣ ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಿ",
  marketplace_search: 'ಹುಡುಕಿ: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್" ಅಥವಾ "ಪ್ಲಂಬರ್"',
  marketplace_all_skills: "ಎಲ್ಲಾ ಕೌಶಲ್ಯಗಳು",
  marketplace_filters: "ಫಿಲ್ಟರ್‌ಗಳು",
  marketplace_workers_found: "ಪರಿಶೀಲಿಸಿದ ಕಾರ್ಮಿಕರು ಸಿಕ್ಕಿದ್ದಾರೆ",
  marketplace_book_now: "ಈಗ ಬುಕ್ ಮಾಡಿ",
  marketplace_available: "ಲಭ್ಯವಿದ್ದಾರೆ",
  marketplace_busy: "ಕಾರ್ಯನಿರತ",

  common_loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
  common_error: "ಏನೋ ತಪ್ಪಾಗಿದೆ",
  common_retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
  common_go_home: "ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ",
  common_not_found: "ಪುಟ ಕಂಡುಬಂದಿಲ್ಲ",
  common_not_found_desc: "ಈ ಪುಟ ಲಭ್ಯವಿಲ್ಲ.",
  common_browse_marketplace: "ಮಾರುಕಟ್ಟೆಯನ್ನು ವೀಕ್ಷಿಸಿ",

  pay_escrow_title: "KaizyPay",
  pay_escrow_subtitle: "ಎಸ್ಕ್ರೋ ರಕ್ಷಣೆಯೊಂದಿಗೆ ಅದೇ ದಿನದ UPI ಪಾವತಿಗಳು.",
  pay_how_it_works: "ಎಸ್ಕ್ರೋ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ",
  pay_booking_created: "ಬುಕಿಂಗ್ ರಚಿಸಲಾಗಿದೆ",
  pay_escrow_funded: "ಎಸ್ಕ್ರೋ ನಿಧಿ",
  pay_job_started: "ಕೆಲಸ ಪ್ರಾರಂಭವಾಗಿದೆ",
  pay_job_completed: "ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ",
  pay_payment_released: "ಪಾವತಿ ಬಿಡುಗಡೆ ಮಾಡಲಾಗಿದೆ",
  pay_job_amount: "ಕೆಲಸದ ಮೊತ್ತ",
  pay_platform_fee: "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ (10%)",
  pay_worker_payout: "ಕಾರ್ಮಿಕರ ಪಾವತಿ",

  referral_title: "ಕಾರ್ಮಿಕರನ್ನು ಆಹ್ವಾನಿಸಿ, ₹100–₹300 ಗಳಿಸಿ",
  referral_subtitle: "ನೀವು ಕರೆತರುವ ಪ್ರತಿಯೊಬ್ಬ ಕಾರ್ಮಿಕರಿಗೂ ನಗದು ಬಹುಮಾನ.",
  referral_your_code: "ನಿಮ್ಮ ರೆಫರಲ್ ಕೋಡ್",
  referral_whatsapp_share: "WhatsApp ಹಂಚಿಕೊಳ್ಳಿ",
  referral_tiers_title: "ರೆಫರಲ್ ಶ್ರೇಣಿಗಳು",
  referral_per_referral: "/ರೆಫರಲ್",

  footer_cta_title: "ಪ್ರಾರಂಭಿಸಲು ಸಿದ್ಧರಿದ್ದೀರಾ?",
  footer_cta_subtitle: "7,400+ ಕಾರ್ಮಿಕರು ಈಗಾಗಲೇ Kaizy ಜೊತೆಗೆ ಹೆಚ್ಚು ಗಳಿಸುತ್ತಿದ್ದಾರೆ.",
  footer_copyright: "© 2026 Kaizy. ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.",
};

// ===== MARATHI =====
const mr: TranslationKeys = {
  ...hi,
  nav_how_it_works: "हे कसे कार्य करते",
  nav_for_workers: "कारागिरांसाठी",
  nav_for_businesses: "व्यवसायांसाठी",
  nav_marketplace: "मार्केटप्लेस",
  nav_login: "लॉगिन",
  nav_register_worker: "कारागीर नोंदणी",
  nav_hire_workers: "कारागीर शोधा",

  hero_badge: "भारताची कार्यबल ऑपरेटिंग सिस्टम",
  hero_title: "सन्मानजनक कामाचा",
  hero_title_highlight: "सेतू",
  hero_subtitle: "Kaizy 55 कोटी कुशल कारागिरांना डिजिटल ओळख, पडताळलेले काम आणि त्याच दिवशी UPI पेमेंट देते.",
  hero_cta_worker: "कारागीर नोंदणी",
  hero_cta_hirer: "कारागीर शोधा",

  stat_workers: "पडताळलेले कारागीर",
  stat_cities: "शहरे थेट",
  stat_bookings: "मासिक बुकिंग",
  stat_savings: "सरासरी बचत",

  login_worker_tab: "👷 कारागीर",
  login_hirer_tab: "🏢 व्यवसाय",
  login_welcome_worker: "स्वागत आहे, कारागीर! 🙏",
  login_welcome_hirer: "स्वागत आहे, व्यवसाय मालक! 🏢",
  login_subtitle_worker: "KaizyPass मिळवण्यासाठी मोबाईल नंबर टाका",
  login_subtitle_hirer: "बुकिंग व्यवस्थापित करण्यासाठी मोबाईल नंबर टाका",
  login_phone_label: "मोबाईल नंबर",
  login_phone_placeholder: "98765 43210",
  login_send_otp: "OTP पाठवा",
  login_sending_otp: "OTP पाठवत आहे...",
  login_enter_otp: "OTP प्रविष्ट करा",
  login_otp_sent_to: "6-अंकी कोड पाठवला आहे",
  login_verify: "पडताळणी करा आणि लॉगिन व्हा",
  login_verifying: "पडताळणी होत आहे...",
  login_resend_otp: "OTP पुन्हा पाठवा",
  login_resend_in: "OTP पुन्हा पाठवा",
  login_success: "लॉगिन यशस्वी! 🎉",
  login_redirecting_worker: "KaizyPass कडे नेत आहे...",
  login_redirecting_hirer: "डॅशबोर्डकडे नेत आहे...",
  login_new_here: "नवीन आहात?",
  login_register_worker: "कारागीर नोंदणी →",
  login_register_hirer: "व्यवसाय नोंदणी →",
  login_change_number: "नंबर बदला",
  login_encrypted: "256-बिट एन्क्रिप्टेड",
  login_dpdp: "DPDP अनुपालन",

  dashboard_welcome: "पुन्हा स्वागत",
  dashboard_overview: "आजच्या कामाचा आढावा",
  dashboard_total_earnings: "एकूण कमाई",
  dashboard_jobs_completed: "पूर्ण झालेली कामे",
  dashboard_avg_rating: "सरासरी रेटिंग",
  dashboard_kaizy_score: "KaizyScore",
  dashboard_recent_jobs: "अलीकडील कामे",
  dashboard_view_all: "सर्व पहा",

  marketplace_title: "कुशल कारागीर शोधा",
  marketplace_search: 'शोधा: "इलेक्ट्रिशियन" किंवा "प्लंबर"',
  marketplace_all_skills: "सर्व कौशल्ये",
  marketplace_filters: "फिल्टर्स",
  marketplace_workers_found: "पडताळलेले कारागीर सापडले",
  marketplace_book_now: "आत्ताच बुक करा",
  marketplace_available: "उपलब्ध",
  marketplace_busy: "व्यस्त",

  common_loading: "लोड होत आहे...",
  common_error: "काहीतरी चूक झाली",
  common_retry: "पुन्हा प्रयत्न करा",
  common_go_home: "मुख्यपृष्ठावर जा",
  common_not_found: "पृष्ठ सापडले नाही",
  common_not_found_desc: "हे पृष्ठ उपलब्ध नाही.",
  common_browse_marketplace: "मार्केटप्लेस पहा",

  pay_escrow_title: "KaizyPay",
  pay_escrow_subtitle: "एस्क्रो संरक्षणासह त्याच दिवशी UPI पेमेंट.",
  pay_how_it_works: "एस्क्रो कसे कार्य करते",
  pay_booking_created: "बुकिंग तयार झाली",
  pay_escrow_funded: "एस्क्रो निधी",
  pay_job_started: "काम सुरू झाले",
  pay_job_completed: "काम पूर्ण झाले",
  pay_payment_released: "पेमेंट सोडले",
  pay_job_amount: "कामाची रक्कम",
  pay_platform_fee: "प्लॅटफॉर्म शुल्क (10%)",
  pay_worker_payout: "कारागिराचे पेमेंट",

  referral_title: "कारागिरांना आमंत्रित करा, ₹100–₹300 कमवा",
  referral_subtitle: "प्रत्येक कारागिरासोबत रोख बक्षीस मिळवा.",
  referral_your_code: "तुमचा रेफरल कोड",
  referral_whatsapp_share: "WhatsApp शेअर",
  referral_tiers_title: "रेफरल टियर्स",
  referral_per_referral: "/रेफरल",

  footer_cta_title: "सुरू करण्यास तयार आहात?",
  footer_cta_subtitle: "7,400+ कारागीर आधीच Kaizy सोबत जास्त कमाई करत आहेत.",
  footer_copyright: "© 2026 Kaizy. सर्व हक्क राखीव.",
};

// ===== BENGALI =====
const bn: TranslationKeys = {
  ...hi,
  nav_how_it_works: "কীভাবে কাজ করে",
  nav_for_workers: "কারিগরদের জন্য",
  nav_for_businesses: "ব্যবসার জন্য",
  nav_marketplace: "মার্কেটপ্লেস",
  nav_login: "লগইন",
  nav_register_worker: "কারিগর নিবন্ধন",
  nav_hire_workers: "কারিগর খুঁজুন",

  hero_badge: "ভারতের কর্মশক্তি পরিচালনা ব্যবস্থা",
  hero_title: "মর্যাদাপূর্ণ কাজের",
  hero_title_highlight: "সেতুবন্ধন",
  hero_subtitle: "Kaizy ৫৫ কোটি দক্ষ কারিগরকে ডিজিটাল পরিচয়, যাচাইকৃত কাজ এবং একই দিনে UPI পেমেন্ট প্রদান করে।",
  hero_cta_worker: "কারিগর নিবন্ধন",
  hero_cta_hirer: "কারিগর খুঁজুন",

  stat_workers: "যাচাইকৃত কারিগর",
  stat_cities: "শহর সরাসরি",
  stat_bookings: "মাসিক বুকিং",
  stat_savings: "গড় সাশ্রয়",

  login_worker_tab: "👷 কারিগর",
  login_hirer_tab: "🏢 ব্যবসা",
  login_welcome_worker: "স্বাগতম, কারিগর বন্ধু! 🙏",
  login_welcome_hirer: "স্বাগতম, ব্যবসায়ী! 🏢",
  login_subtitle_worker: "KaizyPass দেখতে মোবাইল নম্বর দিন",
  login_subtitle_hirer: "বুকিং পরিচালনা করতে মোবাইল নম্বর দিন",
  login_phone_label: "মোবাইল নম্বর",
  login_phone_placeholder: "98765 43210",
  login_send_otp: "OTP পাঠান",
  login_sending_otp: "OTP পাঠানো হচ্ছে...",
  login_enter_otp: "OTP লিখুন",
  login_otp_sent_to: "৬-সংখ্যার কোড পাঠানো হয়েছে",
  login_verify: "যাচাই করে লগইন করুন",
  login_verifying: "যাচাই করা হচ্ছে...",
  login_resend_otp: "OTP পুনরায় পাঠান",
  login_resend_in: "OTP পুনরায় পাঠান",
  login_success: "লগইন সফল! 🎉",
  login_redirecting_worker: "KaizyPass-এ নিয়ে যাওয়া হচ্ছে...",
  login_redirecting_hirer: "ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...",
  login_new_here: "নতুন এখানে?",
  login_register_worker: "কারিগর নিবন্ধন →",
  login_register_hirer: "ব্যবসা নিবন্ধন →",
  login_change_number: "নম্বর পরিবর্তন করুন",
  login_encrypted: "২৫৬-বিট এনক্রিপ্ট করা",
  login_dpdp: "DPDP সম্মত",

  dashboard_welcome: "পুনরায় স্বাগতম",
  dashboard_overview: "আজকের কাজের বিবরণ",
  dashboard_total_earnings: "মোট আয়",
  dashboard_jobs_completed: "সম্পন্ন কাজ",
  dashboard_avg_rating: "গড় রেটিং",
  dashboard_kaizy_score: "KaizyScore",
  dashboard_recent_jobs: "সাম্প্রতিক কাজ",
  dashboard_view_all: "সব দেখুন",

  marketplace_title: "দক্ষ কারিগর খুঁজুন",
  marketplace_search: 'অনুসন্ধান: "ইলেকট্রিশিয়ান" বা "প্লাম্বার"',
  marketplace_all_skills: "সব দক্ষতা",
  marketplace_filters: "ফিল্টার",
  marketplace_workers_found: "যাচাইকৃত কারিগর পাওয়া গেছে",
  marketplace_book_now: "এখনই বুক করুন",
  marketplace_available: "উপলব্ধ",
  marketplace_busy: "ব্যস্ত",

  common_loading: "লোড হচ্ছে...",
  common_error: "কিছু ভুল হয়েছে",
  common_retry: "আবার চেষ্টা করুন",
  common_go_home: "হোমে যান",
  common_not_found: "পৃষ্ঠা পাওয়া যায়নি",
  common_not_found_desc: "এই পৃষ্ঠাটি বিদ্যমান নেই।",
  common_browse_marketplace: "মার্কেটপ্লেস দেখুন",

  pay_escrow_title: "KaizyPay",
  pay_escrow_subtitle: "এসক্রো সুরক্ষার সাথে একই দিনে UPI পেমেন্ট।",
  pay_how_it_works: "এসক্রো কীভাবে কাজ করে",
  pay_booking_created: "বুকিং তৈরি হয়েছে",
  pay_escrow_funded: "এসক্রো ফান্ড",
  pay_job_started: "কাজ শুরু হয়েছে",
  pay_job_completed: "কাজ সম্পন্ন হয়েছে",
  pay_payment_released: "পেমেন্ট ছাড়া হয়েছে",
  pay_job_amount: "কাজের পরিমাণ",
  pay_platform_fee: "প্ল্যাটফর্ম ফি (১০%)",
  pay_worker_payout: "কারিগরের পেমেন্ট",

  referral_title: "কারিগরদের আমন্ত্রণ জানান, ₹১০০–₹৩০০ উপার্জন করুন",
  referral_subtitle: "প্রতিটি কারিগরের সাথে নগদ পুরস্কার পান।",
  referral_your_code: "আপনার রেফারেল কোড",
  referral_whatsapp_share: "WhatsApp শেয়ার",
  referral_tiers_title: "রেফারেল স্তর",
  referral_per_referral: "/রেফারেল",

  footer_cta_title: "শুরু করতে প্রস্তুত?",
  footer_cta_subtitle: "৭,৪০০+ কারিগর ইতিমধ্যেই Kaizy-এর সাথে বেশি উপার্জন করছেন।",
  footer_copyright: "© ২০২৬ Kaizy. সমস্ত অধিকার সংরক্ষিত।",
};

// Translations map
const translations: Record<Locale, TranslationKeys> = {
  en,
  hi,
  ta,
  te,
  kn,
  mr,
  bn,
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
