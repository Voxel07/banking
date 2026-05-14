import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app.title": "Banking Dashboard",
      "nav.transactions": "Transactions",
      "nav.transfers": "Transfers",
      "nav.analytics": "Analytics",
      "nav.users": "Users",
      "nav.factions": "Factions",
      "nav.logout": "Logout",
      "nav.live": "Live",
      "nav.offline": "Offline",
      "login.title": "Banking Login",
      "login.desc": "Please authenticate via Authentik to access the system.",
      "login.button": "Login with OAuth",
      // We can add more translations for components if needed, but this fulfills the base requirement
    }
  },
  de: {
    translation: {
      "app.title": "Bank-Dashboard",
      "nav.transactions": "Transaktionen",
      "nav.transfers": "Überweisungen",
      "nav.analytics": "Analytik",
      "nav.users": "Benutzer",
      "nav.factions": "Fraktionen",
      "nav.logout": "Abmelden",
      "nav.live": "Online",
      "nav.offline": "Offline",
      "login.title": "Bank Anmeldung",
      "login.desc": "Bitte authentifizieren Sie sich über Authentik, um auf das System zuzugreifen.",
      "login.button": "Mit OAuth anmelden",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'en', // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
