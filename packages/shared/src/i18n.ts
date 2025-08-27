export type Messages = Record<string, string>;

export class I18n {
  private catalogs: Record<string, Messages> = {};
  private locale: string = 'en';

  register(locale: string, messages: Messages) {
    this.catalogs[locale] = messages;
  }

  setLocale(locale: string) { this.locale = locale; }

  t(key: string): string {
    const cat = this.catalogs[this.locale] || {};
    return cat[key] || key;
  }
}

