import { Injectable } from '@angular/core';
import * as appSettings from 'application-settings';

@Injectable()
export class StorageService {

  store;

  constructor() {
    this.store = appSettings;
  }

}
