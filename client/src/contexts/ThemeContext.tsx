import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PRIMARY_COLOR_PRESETS,
  ACCENT_PRESETS,
  BACKGROUND_TONES,
  RADIUS_OPTIONS,
  defaultAppearanceSettings,
  type AppearanceSettings,
} from './themePresets';

export {
  PRIMARY_COLOR_PRESETS,
  ACCENT_PRESETS,
  BACKGROUND_TONES,
  RADIUS_OPTIONS,
} from './themePresets';
export type { ColorPreset, AccentTone, BackgroundTone, RadiusOption } from './themePresets';

type ThemeType = AppearanceSettings['theme'];
type LanguageType = AppearanceSettings['language'];

type ThemeContextType = {
  theme: ThemeType;
  language: LanguageType;
  compactMode: boolean;
  animationsEnabled: boolean;
  primaryColor: string;
  accentColor: string;
  backgroundTone: string;
  radius: string;
  updateTheme: (theme: ThemeType) => void;
  updateLanguage: (language: LanguageType) => void;
  toggleCompactMode: () => void;
  toggleAnimations: () => void;
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;
  resetAppearance: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    try {
      const saved = localStorage.getItem('appearanceSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultAppearanceSettings, ...parsed };
      }
    } catch {}
    return defaultAppearanceSettings;
  });

  useEffect(() => {
    localStorage.setItem('appearanceSettings', JSON.stringify(settings));
  }, [settings]);

  // Apply light/dark theme
  useEffect(() => {
    const applyTheme = () => {
      let activeTheme: 'light' | 'dark' = settings.theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.theme;

      document.documentElement.classList.remove('light-theme', 'dark-theme');
      document.documentElement.classList.add(`${activeTheme}-theme`);
      document.documentElement.classList.toggle('dark', activeTheme === 'dark');
      document.documentElement.dataset.activeTheme = activeTheme;
    };
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => settings.theme === 'system' && applyTheme();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [settings.theme]);

  // Apply colors / radius / background tone
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.dataset.activeTheme === 'dark';

    const primary = PRIMARY_COLOR_PRESETS.find(p => p.name === settings.primaryColor) || PRIMARY_COLOR_PRESETS[0];
    root.style.setProperty('--primary', primary.primary);
    root.style.setProperty('--primary-foreground', primary.primaryForeground);
    root.style.setProperty('--ring', primary.ring);
    root.style.setProperty('--sidebar-primary', primary.primary);
    root.style.setProperty('--sidebar-primary-foreground', primary.primaryForeground);
    root.style.setProperty('--sidebar-ring', primary.ring);
    root.style.setProperty('--chart-1', primary.primary);

    const accentChoice = ACCENT_PRESETS.find(a => a.name === settings.accentColor) || ACCENT_PRESETS[0];
    if (accentChoice.name === 'auto' || !accentChoice.accent) {
      // derive a softened accent from primary
      const softened = isDark ? `${primary.primary.split(' ')[0]} 30% 25%` : `${primary.primary.split(' ')[0]} 70% 95%`;
      const softenedFg = isDark ? '0 0% 100%' : primary.primary;
      root.style.setProperty('--accent', softened);
      root.style.setProperty('--accent-foreground', softenedFg);
      root.style.setProperty('--sidebar-accent', softened);
      root.style.setProperty('--sidebar-accent-foreground', softenedFg);
    } else {
      root.style.setProperty('--accent', accentChoice.accent);
      root.style.setProperty('--accent-foreground', accentChoice.accentForeground);
      root.style.setProperty('--sidebar-accent', accentChoice.accent);
      root.style.setProperty('--sidebar-accent-foreground', accentChoice.accentForeground);
    }

    const tone = BACKGROUND_TONES.find(b => b.name === settings.backgroundTone) || BACKGROUND_TONES[0];
    const bg = isDark ? tone.dark : tone.light;
    root.style.setProperty('--background', bg);
    root.style.setProperty('--card', bg);
    root.style.setProperty('--popover', bg);
    root.style.setProperty('--sidebar-background', bg);

    const radius = RADIUS_OPTIONS.find(r => r.name === settings.radius) || RADIUS_OPTIONS[2];
    root.style.setProperty('--radius', `${radius.rem}rem`);
  }, [settings.primaryColor, settings.accentColor, settings.backgroundTone, settings.radius, settings.theme]);

  // Compact / animations / language
  useEffect(() => {
    document.documentElement.classList.toggle('compact-mode', settings.compactMode);
  }, [settings.compactMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-animations', !settings.animationsEnabled);
  }, [settings.animationsEnabled]);

  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  }, [settings.language]);

  const updateTheme = (theme: ThemeType) => setSettings(p => ({ ...p, theme }));
  const updateLanguage = (language: LanguageType) => setSettings(p => ({ ...p, language }));
  const toggleCompactMode = () => setSettings(p => ({ ...p, compactMode: !p.compactMode }));
  const toggleAnimations = () => setSettings(p => ({ ...p, animationsEnabled: !p.animationsEnabled }));
  const updateAppearance = (newSettings: Partial<AppearanceSettings>) =>
    setSettings(prev => ({ ...prev, ...newSettings }));
  const resetAppearance = () => setSettings(defaultAppearanceSettings);

  return (
    <ThemeContext.Provider
      value={{
        theme: settings.theme,
        language: settings.language,
        compactMode: settings.compactMode,
        animationsEnabled: settings.animationsEnabled,
        primaryColor: settings.primaryColor,
        accentColor: settings.accentColor,
        backgroundTone: settings.backgroundTone,
        radius: settings.radius,
        updateTheme,
        updateLanguage,
        toggleCompactMode,
        toggleAnimations,
        updateAppearance,
        resetAppearance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
