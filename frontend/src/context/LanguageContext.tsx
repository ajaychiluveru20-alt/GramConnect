import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "te" | "hi";

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
  translateCategory: (category: string) => string;
  translateStatus: (status: string) => string;
  translatePriority: (priority: string) => string;
}

// Translations Dictionary for English, Telugu, and Hindi
const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Brand & App
    "brand.name": "GramConnect",
    "brand.subtitle": "Smart Village Problem Solver",
    "brand.motto": "Empowering rural communities with rapid grievance resolution",

    // Navigation
    "nav.home": "Home",
    "nav.about": "About",
    "nav.services": "Services",
    "nav.report": "Report Problem",
    "nav.complaints": "Complaints",
    "nav.trackIssue": "Track Issue",
    "nav.myComplaints": "My Complaints",
    "nav.admin": "Admin Portal",
    "nav.worker": "Worker Tasks",
    "nav.notifications": "Notifications",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Logout",
    "nav.emergency": "Emergency",

    // Language names
    "lang.en": "English",
    "lang.te": "తెలుగు",
    "lang.hi": "हिंदी",

    // Common Actions
    "action.submit": "Submit Complaint",
    "action.refresh": "Refresh",
    "action.cancel": "Cancel",
    "action.update": "Update",
    "action.assign": "Assign",
    "action.view": "View",
    "action.track": "Track Progress",
    "action.clearFilters": "Clear Filters",
    "action.search": "Search",
    "action.startWork": "Start Working",
    "action.resolve": "Complete & Mark Resolved",
    "action.close": "Close",
    "action.save": "Save",
    "action.markAllRead": "Mark all as read",
    "action.clearAll": "Clear all",

    // Categories
    "cat.water": "Water Supply",
    "cat.roads": "Roads",
    "cat.electricity": "Electricity",
    "cat.lights": "Street Lights",
    "cat.garbage": "Garbage",
    "cat.drainage": "Drainage",
    "cat.sanitation": "Sanitation",
    "cat.other": "Other",

    // Statuses
    "status.pending": "Pending",
    "status.assigned": "Assigned",
    "status.in_progress": "In Progress",
    "status.awaiting_verification": "Awaiting Verification",
    "status.resolved": "Resolved",
    "status.closed": "Closed",

    // Priorities
    "priority.low": "Low Priority",
    "priority.medium": "Medium Priority",
    "priority.high": "High Priority",

    // Home Hero
    "hero.badge": "Gram Panchayat Digital Problem Solver",
    "hero.title": "Smart Village Problem Solver & Civic Action",
    "hero.desc": "Connect villagers, Gram Panchayat officers, and field technicians for fast, transparent resolution of community infrastructure issues.",
    "hero.reportBtn": "Report a Problem",
    "hero.trackBtn": "Track Complaints",
    "hero.loginHub": "Access Role Portals",

    // Report Page
    "report.title": "Report a Village Problem",
    "report.desc": "Submit infrastructure or civic issues directly to your Gram Panchayat. Logged securely with live status tracking.",
    "report.form.title": "Problem Title",
    "report.form.titlePlaceholder": "Brief summary (e.g., Broken water pipe near main temple)",
    "report.form.category": "Problem Category",
    "report.form.location": "Specific Village Location / Ward",
    "report.form.locationPlaceholder": "e.g., Ward 4, Near Primary School",
    "report.form.priority": "Urgency / Priority",
    "report.form.desc": "Detailed Problem Description",
    "report.form.descPlaceholder": "Describe the issue, how long it has been occurring, and how many households are affected...",
    "report.form.submit": "Submit Problem Report",
    "report.form.submitting": "Submitting to Village Database...",
    "report.success.title": "Complaint Successfully Registered",

    // Notifications
    "notif.title": "Notifications",
    "notif.empty": "No new notifications",
    "notif.viewAll": "View All Notifications",
    "notif.unread": "Unread",
    "notif.all": "All",
    "notif.statusUpdated": "Status Updated",
    "notif.workerAssigned": "Worker Assigned",
    "notif.villageNotice": "Village Advisory",
  },

  te: {
    // Brand & App
    "brand.name": "గ్రామ్ కనెక్ట్",
    "brand.subtitle": "స్మార్ట్ గ్రామ సమస్యల పరిష్కారం",
    "brand.motto": "గ్రామీణ ప్రజల సమస్యలను త్వరితగతిన పరిష్కరించే డిజిటల్ వేదిక",

    // Navigation
    "nav.home": "హోమ్",
    "nav.about": "గురించి",
    "nav.services": "సేవలు",
    "nav.report": "సమస్య తెలపండి",
    "nav.complaints": "ఫిర్యాదులు",
    "nav.trackIssue": "సమస్య స్థితి",
    "nav.myComplaints": "నా ఫిర్యాదులు",
    "nav.admin": "అడ్మిన్ పోర్టల్",
    "nav.worker": "వర్కర్ విధులు",
    "nav.notifications": "నోటిఫికేషన్లు",
    "nav.login": "లాగిన్",
    "nav.register": "నమోదు చేసుకోండి",
    "nav.logout": "లాగౌట్",
    "nav.emergency": "అత్యవసరం",

    // Language names
    "lang.en": "English",
    "lang.te": "తెలుగు",
    "lang.hi": "हिंदी",

    // Common Actions
    "action.submit": "ఫిర్యాదు సమర్పించండి",
    "action.refresh": "రిఫ్రెష్",
    "action.cancel": "రద్దు",
    "action.update": "నవీకరించండి",
    "action.assign": "కేటాయించండి",
    "action.view": "చూడండి",
    "action.track": "పురోగతి ట్రాక్ చేయండి",
    "action.clearFilters": "ఫిల్టర్లు తొలగించు",
    "action.search": "వెతకండి",
    "action.startWork": "పని ప్రారంభించండి",
    "action.resolve": "పరిష్కరించబడింది అని గుర్తించండి",
    "action.close": "మూసివేయి",
    "action.save": "భద్రపరచు",
    "action.markAllRead": "అన్నీ చదివినట్లు గుర్తించు",
    "action.clearAll": "అన్నీ తొలగించు",

    // Categories
    "cat.water": "మంచినీటి సరఫరా",
    "cat.roads": "రహదారులు / రోడ్లు",
    "cat.electricity": "విద్యుత్ సమస్య",
    "cat.lights": "వీధి దీపాలు",
    "cat.garbage": "చెత్త సేకరణ",
    "cat.drainage": "కాలువలు / డ్రైనేజీ",
    "cat.sanitation": "పారిశుధ్యం",
    "cat.other": "ఇతర సమస్యలు",

    // Statuses
    "status.pending": "పెండింగ్‌లో ఉంది",
    "status.assigned": "వర్కర్‌కు కేటాయించబడింది",
    "status.in_progress": "పని జరుగుతోంది",
    "status.awaiting_verification": "ధృవీకరణ కోసం వేచి ఉంది",
    "status.resolved": "సమస్య పరిష్కరించబడింది",
    "status.closed": "పూర్తయి మూసివేయబడింది",

    // Priorities
    "priority.low": "సాధారణ ప్రాధాన్యత",
    "priority.medium": "మధ్యస్థ ప్రాధాన్యత",
    "priority.high": "అత్యవసర ప్రాధాన్యత",

    // Home Hero
    "hero.badge": "గ్రామ పంచాయతీ డిజిటల్ సమస్య పరిష్కార వేదిక",
    "hero.title": "స్మార్ట్ గ్రామ సమస్యల పరిష్కారం & ప్రజా సేవలు",
    "hero.desc": "గ్రామస్థులు, పంచాయతీ అధికారులు మరియు సిబ్బంది మధ్య పారదర్శకమైన అనుసంధానం. సమస్యలను వేగంగా నివేదించి పరిష్కరించుకోండి.",
    "hero.reportBtn": "సమస్యను నివేదించండి",
    "hero.trackBtn": "ఫిర్యాదుల స్థితి చూడండి",
    "hero.loginHub": "లాగిన్ పోర్టల్స్",

    // Report Page
    "report.title": "గ్రామ సమస్యను నివేదించండి",
    "report.desc": "మీ గ్రామంలోని మౌలిక వసతుల సమస్యలను నేరుగా గ్రామ పంచాయతీకి తెలపండి. ఆన్‌లైన్‌లో ఎప్పటికప్పుడు స్థితిని ట్రాక్ చేయవచ్చు.",
    "report.form.title": "సమస్య శీర్షిక",
    "report.form.titlePlaceholder": "సంక్షిప్త వివరాలు (ఉదా: గుడి వద్ద నీటి పైపు పగిలిపోయింది)",
    "report.form.category": "సమస్య విభాగం",
    "report.form.location": "గ్రామ ప్రాంతం / వార్డు నెంబర్",
    "report.form.locationPlaceholder": "ఉదా: వార్డు 3, ప్రాథమిక పాఠశాల దగ్గర",
    "report.form.priority": "అత్యవసర ప్రాధాన్యత",
    "report.form.desc": "సమస్య పూర్తి వివరణ",
    "report.form.descPlaceholder": "సమస్య వివరాలు, ఎంత కాలంగా ఉంది, ఎన్ని ఇళ్లకు ఇబ్బందిగా ఉందో వివరించండి...",
    "report.form.submit": "ఫిర్యాదును సమర్పించండి",
    "report.form.submitting": "పంచాయతీ రికార్డులలో నమోదు అవుతోంది...",
    "report.success.title": "ఫిర్యాదు విజయవంతంగా నమోదైంది",

    // Notifications
    "notif.title": "నోటిఫికేషన్లు",
    "notif.empty": "కొత్త నోటిఫికేషన్లు లేవు",
    "notif.viewAll": "అన్ని నోటిఫికేషన్లు చూడండి",
    "notif.unread": "చదవనివి",
    "notif.all": "అన్నీ",
    "notif.statusUpdated": "స్థితి నవీకరించబడింది",
    "notif.workerAssigned": "వర్కర్ కేటాయించబడ్డారు",
    "notif.villageNotice": "పంచాయతీ ప్రకటన",
  },

  hi: {
    // Brand & App
    "brand.name": "ग्राम कनेक्ट",
    "brand.subtitle": "स्मार्ट गांव समस्या निवारण प्रणाली",
    "brand.motto": "ग्रामीण समुदायों को त्वरित शिकायत निवारण से सशक्त बनाना",

    // Navigation
    "nav.home": "होम",
    "nav.about": "परिचय",
    "nav.services": "सेवाएं",
    "nav.report": "समस्या दर्ज करें",
    "nav.complaints": "शिकायतें",
    "nav.trackIssue": "स्थिति जांचें",
    "nav.myComplaints": "मेरी शिकायतें",
    "nav.admin": "एडमिन पोर्टल",
    "nav.worker": "कार्यकर्ता कार्य",
    "nav.notifications": "सूचनाएं",
    "nav.login": "लॉग इन",
    "nav.register": "पंजीकरण करें",
    "nav.logout": "लॉग आउट",
    "nav.emergency": "आपातकालीन",

    // Language names
    "lang.en": "English",
    "lang.te": "తెలుగు",
    "lang.hi": "हिंदी",

    // Common Actions
    "action.submit": "शिकायत दर्ज करें",
    "action.refresh": "ताज़ा करें",
    "action.cancel": "रद्द करें",
    "action.update": "अपडेट करें",
    "action.assign": "आवंटित करें",
    "action.view": "देखें",
    "action.track": "प्रगति ट्रैक करें",
    "action.clearFilters": "फ़िल्टर हटाएं",
    "action.search": "खोजें",
    "action.startWork": "कार्य शुरू करें",
    "action.resolve": "समाधान पूर्ण चिन्हित करें",
    "action.close": "बंद करें",
    "action.save": "सहेजें",
    "action.markAllRead": "सभी को पढ़ा हुआ चिन्हित करें",
    "action.clearAll": "सभी हटाएं",

    // Categories
    "cat.water": "जल आपूर्ति",
    "cat.roads": "सड़कें एवं मार्ग",
    "cat.electricity": "बिजली आपूर्ति",
    "cat.lights": "स्ट्रीट लाइट",
    "cat.garbage": "कचरा प्रबंधन",
    "cat.drainage": "जल निकासी एवं नाली",
    "cat.sanitation": "स्वच्छता",
    "cat.other": "अन्य समस्याएं",

    // Statuses
    "status.pending": "लंबित",
    "status.assigned": "कार्यकर्ता को आवंटित",
    "status.in_progress": "कार्य प्रगति पर है",
    "status.awaiting_verification": "सत्यापन की प्रतीक्षा में",
    "status.resolved": "समस्या का समाधान हुआ",
    "status.closed": "बंद कर दिया गया",

    // Priorities
    "priority.low": "सामान्य प्राथमिकता",
    "priority.medium": "मध्यम प्राथमिकता",
    "priority.high": "अति आवश्यक / उच्च",

    // Home Hero
    "hero.badge": "ग्राम पंचायत डिजिटल समस्या निवारण प्रणाली",
    "hero.title": "स्मार्ट गांव समस्या निवारक एवं नागरिक सेवाएं",
    "hero.desc": "ग्रामीणों, पंचायत अधिकारियों और तकनीशियनों को त्वरित और पारदर्शी समस्या निवारण के लिए जोड़ने वाला डिजिटल मंच।",
    "hero.reportBtn": "समस्या दर्ज करें",
    "hero.trackBtn": "शिकायत की स्थिति जांचें",
    "hero.loginHub": "भूमिका पोर्टल लॉगिन",

    // Report Page
    "report.title": "गांव की समस्या दर्ज करें",
    "report.desc": "बुनियादी ढांचे या नागरिक समस्याओं को सीधे अपनी ग्राम पंचायत को भेजें। रीयल-टाइम में समाधान की स्थिति देखें।",
    "report.form.title": "समस्या का शीर्षक",
    "report.form.titlePlaceholder": "संक्षिप्त विवरण (उदा: मुख्य मंदिर के पास पानी का पाइप फटा)",
    "report.form.category": "समस्या की श्रेणी",
    "report.form.location": "गांव का स्थान / वार्ड",
    "report.form.locationPlaceholder": "उदा: वार्ड 4, प्राथमिक विद्यालय के पास",
    "report.form.priority": "प्राथमिकता स्तर",
    "report.form.desc": "समस्या का विस्तृत विवरण",
    "report.form.descPlaceholder": "समस्या कब से है और कितने घरों को प्रभावित कर रही है, विस्तार से बताएं...",
    "report.form.submit": "शिकायत जमा करें",
    "report.form.submitting": "पंचायत रिकॉर्ड में दर्ज हो रहा है...",
    "report.success.title": "शिकायत सफलतापूर्वक पंजीकृत हुई",

    // Notifications
    "notif.title": "सूचनाएं",
    "notif.empty": "कोई नई सूचना नहीं है",
    "notif.viewAll": "सभी सूचनाएं देखें",
    "notif.unread": "अपठित",
    "notif.all": "सभी",
    "notif.statusUpdated": "स्थिति अपडेट हुई",
    "notif.workerAssigned": "कार्यकर्ता नियुक्त",
    "notif.villageNotice": "पंचायत सूचना",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = "gramconnect_language";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY) as Language;
    return saved === "te" || saved === "hi" || saved === "en" ? saved : "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, defaultText?: string): string => {
    const dict = TRANSLATIONS[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English
    if (TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return defaultText ?? key;
  };

  const translateCategory = (cat: string): string => {
    const c = cat.toLowerCase();
    if (c.includes("water")) return t("cat.water", cat);
    if (c.includes("road")) return t("cat.roads", cat);
    if (c.includes("electric")) return t("cat.electricity", cat);
    if (c.includes("light")) return t("cat.lights", cat);
    if (c.includes("garb")) return t("cat.garbage", cat);
    if (c.includes("drain")) return t("cat.drainage", cat);
    if (c.includes("sanit")) return t("cat.sanitation", cat);
    if (c.includes("other")) return t("cat.other", cat);
    return cat;
  };

  const translateStatus = (status: string): string => {
    const s = status.toUpperCase();
    if (s === "PENDING") return t("status.pending", "Pending");
    if (s === "ASSIGNED") return t("status.assigned", "Assigned");
    if (s === "IN_PROGRESS") return t("status.in_progress", "In Progress");
    if (s === "AWAITING_VERIFICATION") return t("status.awaiting_verification", "Awaiting Verification");
    if (s === "RESOLVED") return t("status.resolved", "Resolved");
    if (s === "CLOSED") return t("status.closed", "Closed");
    return status;
  };

  const translatePriority = (priority: string): string => {
    const p = priority.toUpperCase();
    if (p === "HIGH") return t("priority.high", "High Priority");
    if (p === "MEDIUM") return t("priority.medium", "Medium Priority");
    if (p === "LOW") return t("priority.low", "Low Priority");
    return priority;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateCategory,
        translateStatus,
        translatePriority,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export default useLanguage;
