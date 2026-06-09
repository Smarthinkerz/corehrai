export type ColorPreset = {
  name: string;
  label: string;
  primary: string;
  primaryForeground: string;
  ring: string;
};

export const PRIMARY_COLOR_PRESETS: ColorPreset[] = [
  { name: 'blue',    label: 'Blue',    primary: '221 83% 53%', primaryForeground: '0 0% 100%', ring: '221 83% 53%' },
  { name: 'indigo',  label: 'Indigo',  primary: '243 75% 59%', primaryForeground: '0 0% 100%', ring: '243 75% 59%' },
  { name: 'violet',  label: 'Violet',  primary: '262 83% 58%', primaryForeground: '0 0% 100%', ring: '262 83% 58%' },
  { name: 'fuchsia', label: 'Fuchsia', primary: '292 84% 53%', primaryForeground: '0 0% 100%', ring: '292 84% 53%' },
  { name: 'rose',    label: 'Rose',    primary: '347 77% 50%', primaryForeground: '0 0% 100%', ring: '347 77% 50%' },
  { name: 'red',     label: 'Red',     primary: '0 84% 55%',   primaryForeground: '0 0% 100%', ring: '0 84% 55%'   },
  { name: 'orange',  label: 'Orange',  primary: '24 94% 53%',  primaryForeground: '0 0% 100%', ring: '24 94% 53%'  },
  { name: 'amber',   label: 'Amber',   primary: '38 92% 50%',  primaryForeground: '0 0% 10%',  ring: '38 92% 50%'  },
  { name: 'emerald', label: 'Emerald', primary: '152 76% 40%', primaryForeground: '0 0% 100%', ring: '152 76% 40%' },
  { name: 'green',   label: 'Green',   primary: '142 71% 45%', primaryForeground: '0 0% 100%', ring: '142 71% 45%' },
  { name: 'teal',    label: 'Teal',    primary: '173 80% 36%', primaryForeground: '0 0% 100%', ring: '173 80% 36%' },
  { name: 'cyan',    label: 'Cyan',    primary: '189 94% 43%', primaryForeground: '0 0% 100%', ring: '189 94% 43%' },
  { name: 'slate',   label: 'Slate',   primary: '215 28% 30%', primaryForeground: '0 0% 100%', ring: '215 28% 30%' },
  { name: 'zinc',    label: 'Graphite', primary: '240 5% 25%', primaryForeground: '0 0% 100%', ring: '240 5% 25%'  },
];

export type AccentTone = {
  name: string;
  label: string;
  accent: string;
  accentForeground: string;
};

export const ACCENT_PRESETS: AccentTone[] = [
  { name: 'auto',     label: 'Match Primary', accent: '',          accentForeground: '' },
  { name: 'sky',      label: 'Sky',           accent: '199 89% 48%',  accentForeground: '0 0% 100%' },
  { name: 'mint',     label: 'Mint',          accent: '160 84% 39%',  accentForeground: '0 0% 100%' },
  { name: 'lemon',    label: 'Lemon',         accent: '48 96% 53%',   accentForeground: '0 0% 10%'  },
  { name: 'coral',    label: 'Coral',         accent: '14 91% 60%',   accentForeground: '0 0% 100%' },
  { name: 'lilac',    label: 'Lilac',         accent: '270 70% 70%',  accentForeground: '0 0% 10%'  },
  { name: 'graphite', label: 'Graphite',      accent: '220 9% 46%',   accentForeground: '0 0% 100%' },
];

export type BackgroundTone = {
  name: string;
  label: string;
  light: string;
  dark: string;
};

export const BACKGROUND_TONES: BackgroundTone[] = [
  { name: 'default',  label: 'Default White', light: '0 0% 100%',     dark: '222 47% 11%' },
  { name: 'cool',     label: 'Cool Gray',     light: '210 40% 98%',   dark: '215 28% 12%' },
  { name: 'warm',     label: 'Warm Cream',    light: '40 30% 98%',    dark: '30 10% 12%'  },
  { name: 'mint',     label: 'Soft Mint',     light: '150 30% 98%',   dark: '160 20% 10%' },
  { name: 'lavender', label: 'Lavender Mist', light: '270 30% 98%',   dark: '260 20% 12%' },
  { name: 'rose',     label: 'Blush',         light: '340 40% 98%',   dark: '340 15% 12%' },
];

export type RadiusOption = { name: string; label: string; rem: number };
export const RADIUS_OPTIONS: RadiusOption[] = [
  { name: 'square', label: 'Square (0)',     rem: 0    },
  { name: 'small',  label: 'Subtle (0.25)',  rem: 0.25 },
  { name: 'medium', label: 'Default (0.5)',  rem: 0.5  },
  { name: 'large',  label: 'Rounded (0.75)', rem: 0.75 },
  { name: 'xl',     label: 'Pill (1.0)',     rem: 1.0  },
];

export type AppearanceSettings = {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ar';
  compactMode: boolean;
  animationsEnabled: boolean;
  primaryColor: string;
  accentColor: string;
  backgroundTone: string;
  radius: string;
};

export const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'light',
  language: 'en',
  compactMode: false,
  animationsEnabled: true,
  primaryColor: 'blue',
  accentColor: 'auto',
  backgroundTone: 'default',
  radius: 'medium',
};
