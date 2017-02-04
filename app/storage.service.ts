import { Injectable } from '@angular/core';
import * as appSettings from 'application-settings';

@Injectable()
export class StorageService {

  DARK_THEME_KEY = 'dark_theme';
  LAST_JOKE_KEY = 'last_joke';
  SCROLL_Y_KEY = 'scroll_y';

  store;

  constructor() {
    this.store = appSettings;
  }

  hasTheme() {
    return this.store.hasKey(this.DARK_THEME_KEY);
  }
  
  setTheme(theme) {
    this.store.setBoolean(this.DARK_THEME_KEY, theme);
  }

  getTheme() {
    this.store.getBoolean(this.DARK_THEME_KEY);
  }

  setScrollY(y): void {
    this.store.setNumber(this.SCROLL_Y_KEY, y);
  };

  getScrollY(): number {
    return this.store.getNumber(this.SCROLL_Y_KEY, 0);
  };
  
  setLastJoke(data): void {
    this.store.setString(this.LAST_JOKE_KEY, JSON.stringify(data));
  }

  getLastJoke() {

    const jokeString = this.store.getString(this.LAST_JOKE_KEY);

    try {
      return JSON.parse(jokeString);
    } catch(e) {
      return null;
    }

  }

}
