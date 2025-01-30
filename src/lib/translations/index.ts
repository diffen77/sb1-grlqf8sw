import { Language, Translation, TranslationKey } from './types';
import { en } from './en';
import { sv } from './sv';
import get from 'lodash.get';

const translations: Record<Language, Translation> = {
  en,
  sv
};

export class TranslationService {
  private static instance: TranslationService;
  private currentLanguage: Language = 'en';

  private constructor() {}

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  setLanguage(language: Language) {
    this.currentLanguage = language;
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  translate(key: TranslationKey): string {
    return get(translations[this.currentLanguage].fieldLabels, key) || key;
  }

  translateBetSelection(selection: '1' | 'X' | '2'): string {
    return translations[this.currentLanguage].betSelections[selection];
  }

  translateMatchStatus(isOpen: boolean): string {
    return translations[this.currentLanguage].matchStatus[isOpen ? 'open' : 'closed'];
  }

  getCommonTranslation(key: keyof Translation['common']): string {
    return translations[this.currentLanguage].common[key];
  }

  formatDateTime(date: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
    return new Date(date).toLocaleString(this.currentLanguage, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    });
  }
}

export const translator = TranslationService.getInstance();

// React hook for translations
import { useState, useEffect } from 'react';

export function useTranslation() {
  const [language, setLanguage] = useState<Language>(translator.getLanguage());

  useEffect(() => {
    translator.setLanguage(language);
  }, [language]);

  return {
    t: (key: TranslationKey) => translator.translate(key),
    tBet: (selection: '1' | 'X' | '2') => translator.translateBetSelection(selection),
    tStatus: (isOpen: boolean) => translator.translateMatchStatus(isOpen),
    tCommon: (key: keyof Translation['common']) => translator.getCommonTranslation(key),
    formatDateTime: (date: string | Date, options?: Intl.DateTimeFormatOptions) => 
      translator.formatDateTime(date, options),
    language,
    setLanguage,
  };
}