export type LegalLocale = 'de' | 'en' | 'es';

export type LegalSection = {
  heading: string;
  html: string;
};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export type LegalContent = Record<LegalLocale, LegalDocument>;
