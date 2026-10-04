'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'en' | 'hi'

interface LanguageContextType {
  lang: Language
  setLang: (l: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

// ─────────────────────────────────────────────
// ALL TRANSLATIONS
// ─────────────────────────────────────────────
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'header.tagline': 'Transparent & Decentralized',
    'header.search': 'Search locations, waste types...',
    'header.notifications': 'Notifications',
    'header.no_notifications': 'No new notifications',
    'header.logged_in': 'Logged in',
    'header.login': 'Login',
    'header.profile': 'Profile',
    'header.rewards': 'Rewards',
    'header.sign_out': 'Sign Out',
    'header.pts': 'pts',

    // Sidebar
    'nav.home': 'Home',
    'nav.report': 'Report Waste',
    'nav.collect': 'Collect Waste',
    'nav.rewards': 'Rewards',
    'nav.leaderboard': 'Leaderboard',
    'nav.analytics': 'My Analytics',
    'nav.settings': 'Settings',

    // Landing Page
    'landing.badge': 'Decentralized Sustainability',
    'landing.hero_title': 'The Future of',
    'landing.hero_title2': 'Eco-Cities',
    'landing.hero_title3': 'is Here.',
    'landing.hero_sub': 'Join the revolution. Report waste, clean your community, and earn crypto rewards on a verifiable blockchain network. Let\'s build a greener tomorrow, together.',
    'landing.enter_btn': 'Enter Ecosystem',
    'landing.login_btn': 'Login App',
    'landing.stat_recycled': 'Tons Recycled',
    'landing.stat_citizens': 'Active Citizens',
    'landing.stat_tokens': 'Tokens Earned',
    'landing.stat_cities': 'Cities Active',
    'landing.features_title': 'Web3 Powers Real-World',
    'landing.features_highlight': 'Impact',
    'landing.features_sub': 'WasteCHAiN uses blockchain transparency and AI to create a flawless ecosystem where every action is verified and rewarded.',
    'landing.f1_title': 'AI-Verified Reporting',
    'landing.f1_desc': 'Snap a photo of waste. Our Gemini AI automatically verifies the waste type, quantity, and logs coordinates on the ledger.',
    'landing.f2_title': 'Immutable Ledger',
    'landing.f2_desc': 'Every report and collection task is securely stored on NeonDB. Tamper-proof, transparent, and completely decentralized.',
    'landing.f3_title': 'Tokenized Economy',
    'landing.f3_desc': 'Earn WASTE tokens instantly for cleaning up. Redeem tokens for premium rewards, NFTs, or trade them on the open market.',
    'landing.journey_title': 'Your Journey to',
    'landing.journey_highlight': 'Earn',
    'landing.step1_title': 'Spot & Report',
    'landing.step1_desc': 'Find illegal dumping or uncollected waste. Take a picture and submit a report.',
    'landing.step2_title': 'Community Collection',
    'landing.step2_desc': 'Local collectors accept the task, pick up the waste, and verify the cleanup.',
    'landing.step3_title': 'Get Paid',
    'landing.step3_desc': 'Both reporter and collector receive tokens automatically via smart contracts.',
    'landing.cta_title': 'Ready to Clean the World?',
    'landing.cta_sub': 'Connect your wallet, join thousands of eco-warriors, and start earning today.',
    'landing.cta_btn': 'Launch App',

    // Dashboard
    'dash.badge': 'Powered by Blockchain & AI',
    'dash.welcome': 'Welcome back,',
    'dash.warrior': 'Eco Warrior',
    'dash.sub': 'Keep reporting and collecting waste to earn tokens and climb the leaderboard.',
    'dash.report_btn': 'Report Waste',
    'dash.leaderboard_btn': 'View Leaderboard',
    'dash.impact': 'Your Community Impact',
    'dash.stat_collected': 'Waste Collected',
    'dash.stat_reports': 'Reports Submitted',
    'dash.stat_tokens': 'Tokens Earned',
    'dash.stat_co2': 'CO₂ Offset',
    'dash.quick_actions': 'Quick Actions',
    'dash.f1_title': 'Eco-Friendly',
    'dash.f1_desc': 'Contribute to a cleaner environment by reporting and collecting waste in your community.',
    'dash.f1_badge': 'Green',
    'dash.f2_title': 'Earn Rewards',
    'dash.f2_desc': 'Get tokens and reward points for every contribution to waste management efforts.',
    'dash.f3_title': 'Community-Driven',
    'dash.f3_desc': 'Be part of a growing community committed to sustainable practices and a better tomorrow.',
    'dash.f3_badge': 'Community',
    'dash.how_title': 'How It Works',
    'dash.step1_title': 'Report Waste',
    'dash.step1_desc': 'Spot waste? Take a photo and report it with location. AI verifies the waste type automatically.',
    'dash.step2_title': 'Collect & Verify',
    'dash.step2_desc': 'Community collectors pick up reported waste and mark it as collected to earn bonus points.',
    'dash.step3_title': 'Earn & Redeem',
    'dash.step3_desc': 'Earn tokens for every action. Redeem them for real rewards and climb the leaderboard!',
    'dash.learn_more': 'Learn more',
  },

  hi: {
    // Header
    'header.tagline': 'पारदर्शी और विकेंद्रीकृत',
    'header.search': 'स्थान, कचरा प्रकार खोजें...',
    'header.notifications': 'सूचनाएं',
    'header.no_notifications': 'कोई नई सूचना नहीं',
    'header.logged_in': 'लॉग इन है',
    'header.login': 'लॉग इन',
    'header.profile': 'प्रोफाइल',
    'header.rewards': 'पुरस्कार',
    'header.sign_out': 'साइन आउट',
    'header.pts': 'अंक',

    // Sidebar
    'nav.home': 'होम',
    'nav.report': 'कचरा रिपोर्ट करें',
    'nav.collect': 'कचरा इकट्ठा करें',
    'nav.rewards': 'पुरस्कार',
    'nav.leaderboard': 'लीडरबोर्ड',
    'nav.analytics': 'मेरा विश्लेषण',
    'nav.settings': 'सेटिंग्स',

    // Landing Page
    'landing.badge': 'विकेंद्रीकृत स्थिरता',
    'landing.hero_title': 'का भविष्य',
    'landing.hero_title2': 'इको-सिटीज़',
    'landing.hero_title3': 'यहाँ है।',
    'landing.hero_sub': 'क्रांति में शामिल हों। कचरा रिपोर्ट करें, अपने समुदाय को साफ करें, और ब्लॉकचेन नेटवर्क पर क्रिप्टो रिवार्ड कमाएं। मिलकर एक हरा-भरा कल बनाएं।',
    'landing.enter_btn': 'इकोसिस्टम में प्रवेश करें',
    'landing.login_btn': 'ऐप में लॉगिन करें',
    'landing.stat_recycled': 'टन रीसाइकल',
    'landing.stat_citizens': 'सक्रिय नागरिक',
    'landing.stat_tokens': 'टोकन अर्जित',
    'landing.stat_cities': 'सक्रिय शहर',
    'landing.features_title': 'Web3 वास्तविक दुनिया में',
    'landing.features_highlight': 'प्रभाव डालता है',
    'landing.features_sub': 'WasteCHAiN ब्लॉकचेन पारदर्शिता और AI का उपयोग करके एक निर्दोष इकोसिस्टम बनाता है जहां हर कार्य सत्यापित और पुरस्कृत होता है।',
    'landing.f1_title': 'AI-सत्यापित रिपोर्टिंग',
    'landing.f1_desc': 'कचरे की फोटो लें। हमारी Gemini AI स्वचालित रूप से कचरे के प्रकार, मात्रा को सत्यापित करती है और निर्देशांक दर्ज करती है।',
    'landing.f2_title': 'अपरिवर्तनीय लेजर',
    'landing.f2_desc': 'प्रत्येक रिपोर्ट और संग्रह कार्य सुरक्षित रूप से NeonDB पर संग्रहीत है। छेड़छाड़-रोधी, पारदर्शी और पूरी तरह विकेंद्रीकृत।',
    'landing.f3_title': 'टोकन अर्थव्यवस्था',
    'landing.f3_desc': 'सफाई के लिए तुरंत WASTE टोकन कमाएं। प्रीमियम पुरस्कारों के लिए टोकन रिडीम करें या खुले बाजार में ट्रेड करें।',
    'landing.journey_title': 'कमाई की आपकी यात्रा',
    'landing.journey_highlight': 'शुरू होती है',
    'landing.step1_title': 'देखें और रिपोर्ट करें',
    'landing.step1_desc': 'अवैध डंपिंग या बिना उठाए कचरे को ढूंढें। फोटो लें और रिपोर्ट सबमिट करें।',
    'landing.step2_title': 'सामुदायिक संग्रह',
    'landing.step2_desc': 'स्थानीय संग्रहकर्ता कार्य स्वीकार करते हैं, कचरा उठाते हैं और सफाई की पुष्टि करते हैं।',
    'landing.step3_title': 'भुगतान पाएं',
    'landing.step3_desc': 'रिपोर्टर और संग्रहकर्ता दोनों को स्मार्ट कॉन्ट्रैक्ट के माध्यम से स्वचालित रूप से टोकन मिलते हैं।',
    'landing.cta_title': 'दुनिया को साफ करने के लिए तैयार हैं?',
    'landing.cta_sub': 'अपना वॉलेट कनेक्ट करें, हजारों इको-योद्धाओं से जुड़ें और आज से कमाई शुरू करें।',
    'landing.cta_btn': 'ऐप लॉन्च करें',

    // Dashboard
    'dash.badge': 'ब्लॉकचेन और AI द्वारा संचालित',
    'dash.welcome': 'वापस स्वागत है,',
    'dash.warrior': 'इको योद्धा',
    'dash.sub': 'टोकन कमाने और लीडरबोर्ड पर चढ़ने के लिए कचरा रिपोर्ट और इकट्ठा करते रहें।',
    'dash.report_btn': 'कचरा रिपोर्ट करें',
    'dash.leaderboard_btn': 'लीडरबोर्ड देखें',
    'dash.impact': 'आपका सामुदायिक प्रभाव',
    'dash.stat_collected': 'कचरा संग्रहित',
    'dash.stat_reports': 'रिपोर्ट सबमिट',
    'dash.stat_tokens': 'टोकन अर्जित',
    'dash.stat_co2': 'CO₂ ऑफसेट',
    'dash.quick_actions': 'त्वरित क्रियाएं',
    'dash.f1_title': 'पर्यावरण अनुकूल',
    'dash.f1_desc': 'अपने समुदाय में कचरा रिपोर्ट और इकट्ठा करके स्वच्छ वातावरण में योगदान दें।',
    'dash.f1_badge': 'हरित',
    'dash.f2_title': 'पुरस्कार कमाएं',
    'dash.f2_desc': 'कचरा प्रबंधन में हर योगदान के लिए टोकन और रिवार्ड पॉइंट्स पाएं।',
    'dash.f3_title': 'समुदाय-संचालित',
    'dash.f3_desc': 'टिकाऊ प्रथाओं और बेहतर कल के प्रति प्रतिबद्ध बढ़ते समुदाय का हिस्सा बनें।',
    'dash.f3_badge': 'समुदाय',
    'dash.how_title': 'यह कैसे काम करता है',
    'dash.step1_title': 'कचरा रिपोर्ट करें',
    'dash.step1_desc': 'कचरा दिखा? फोटो लें और स्थान के साथ रिपोर्ट करें। AI स्वचालित रूप से कचरे के प्रकार की जांच करती है।',
    'dash.step2_title': 'इकट्ठा करें और सत्यापित करें',
    'dash.step2_desc': 'सामुदायिक संग्रहकर्ता रिपोर्ट किया कचरा उठाते हैं और बोनस पॉइंट्स कमाने के लिए इसे संग्रहित के रूप में चिह्नित करते हैं।',
    'dash.step3_title': 'कमाएं और रिडीम करें',
    'dash.step3_desc': 'हर कार्य के लिए टोकन कमाएं। असली पुरस्कारों के लिए रिडीम करें और लीडरबोर्ड पर चढ़ें!',
    'dash.learn_more': 'और जानें',
  },
}

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('wastechain_lang') as Language | null
    if (saved === 'hi' || saved === 'en') setLangState(saved)
  }, [])

  const setLang = (l: Language) => {
    setLangState(l)
    localStorage.setItem('wastechain_lang', l)
  }

  const t = (key: string): string =>
    translations[lang][key] ?? translations['en'][key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
