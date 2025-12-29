import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'visitasegura_notification_settings';

interface NotificationSettings {
  soundEnabled: boolean;
}

const defaultSettings: NotificationSettings = {
  soundEnabled: true,
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
    setLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error('Error saving notification settings:', error);
      }
      return newSettings;
    });
  }, []);

  const toggleSound = useCallback(() => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  return {
    settings,
    loaded,
    updateSettings,
    toggleSound,
    soundEnabled: settings.soundEnabled,
  };
}
