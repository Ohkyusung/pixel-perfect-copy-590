import React, { createContext, useContext, useState, type ReactNode } from "react";

export type GameMode = "pick-one" | "pick-n" | "teams" | "order";

interface Settings {
  mode: GameMode;
  pickCount: number;
  waitTime: number; // seconds
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  mode: "pick-one",
  pickCount: 2,
  waitTime: 2,
  soundEnabled: true,
  vibrationEnabled: true,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
