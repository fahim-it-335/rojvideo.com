import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserCache } from '../classes/';
import { addClassname, removeClassname, supportsSvgAsImg } from '../helpers/';
import { config as mediacmsConfig } from '../settings/config.js';
import SiteContext from './SiteContext';

const config = mediacmsConfig(window.MediaCMS);

function initLogo(logo) {
  let light = null;
  let dark = null;

  if (logo.darkMode) {
    dark = supportsSvgAsImg() && logo.darkMode.svg ? logo.darkMode.svg : logo.darkMode.img;
  }

  if (logo.lightMode) {
    light = supportsSvgAsImg() && logo.lightMode.svg ? logo.lightMode.svg : logo.lightMode.img;
  }

  // If either light or dark is null, default to the other.
  if (!light && dark) {
    light = dark;
  } else if (!dark && light) {
    dark = light;
  }

  return {
    light,
    dark,
  };
}

function initMode(cachedValue, defaultValue) {
  return cachedValue === 'light' || cachedValue === 'dark' ? cachedValue : defaultValue;
}

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const site = useContext(SiteContext);
  const cache = new BrowserCache('MediaCMS[' + site.id + '][theme]', 86400);
  const [themeMode, setThemeMode] = useState(initMode(cache.get('mode'), config.theme.mode));
  const [logo, setLogo] = useState('');

  useEffect(() => {
    async function fetchLogo() {
      try {
        const response = await fetch('http://localhost/api/v1/site-logo/');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const logos = initLogo(data);
        setLogo(logos[themeMode]);
      } catch (error) {
        console.error('Error fetching logo data:', error);
      }
    }

    fetchLogo();
  }, [themeMode]);

  const changeMode = () => {
    setThemeMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (themeMode === 'dark') {
      addClassname(document.body, 'dark_theme');
    } else {
      removeClassname(document.body, 'dark_theme');
    }
    cache.set('mode', themeMode);
  }, [themeMode]);

  const value = {
    logo,
    currentThemeMode: themeMode,
    changeThemeMode: changeMode,
    themeModeSwitcher: config.theme.switch,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const ThemeConsumer = ThemeContext.Consumer;
