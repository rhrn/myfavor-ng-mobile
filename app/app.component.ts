import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Http } from '@angular/http';
import { Page } from 'ui/page';
import { Color } from 'color';
import { topmost } from 'ui/frame';
import * as platform from 'platform';
import * as app from 'application';
import * as connectivity from 'connectivity';
import * as Toast from 'nativescript-toast';

import { SwipeDirection } from 'ui/gestures';
import * as SocialShare from 'nativescript-social-share';

import { Observable } from 'rxjs/Observable'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/retryWhen';
import 'rxjs/add/operator/scan';

import { FirebaseService } from './firebase.service';
import * as appSettings from 'application-settings';

declare var android;

const endpoint = 'https://myfavor.ru/joke/any.json';

@Component({
  selector: 'my-app',
  template: `
    <GridLayout class="p-20" [class.content-dark]="darkTheme">

      <ActivityIndicator class="spinner" *ngIf="loading | async" busy="true"></ActivityIndicator>

      <ScrollView
        #scrollView
        (swipe)="loadJoke($event)"
        (doubleTap)="setTheme()"
        (longPress)="share()">

        <Label
          class="content"
          [class.content-small-screen]="screen === 'small'"
          [class.content-big-screen]="screen === 'big'"
          [class.content-dark]="darkTheme"
          [class.visible]="!(loading | async)"
          [text]="(joke | async).content"
          textWrap="true">
        </Label>

      </ScrollView>

    </GridLayout>
  `,
  styles: [`

    .spinner {
      horizontal-align: center;
      veritical-align: center;
    }

    .content-big-screen {
      padding-left: 100;
      padding-right: 100;
    }

    .content-small-screen {
      padding-left: 30;
      padding-right: 30;
    }

    .content {
      background-color: #fff;
      color: #000;
      font-family: 'Roboto-Thin', 'monospace';
      font-size: 23;
      opacity: 0;
      vertical-align: center;
    }

    .content-dark {
      color: #fff;
      background-color: #000;
    }

    .visible {
      animation-name: show;
      animation-duration: .3s;
    }

    @keyframes show {
      from { opacity: 0; }
      to { opacity: 1; }
    }

  `]
})
export class AppComponent implements OnInit {

  @ViewChild('scrollView') scrollView: ElementRef;

  darkTheme: boolean = false;
  screen: string = 'small';

  DARK_THEME_KEY = 'darkTheme';

  loading = new BehaviorSubject(false);

  joke = new BehaviorSubject({ title: 'loading...', content: '...' });

  isDarkThemeByTime() {
    const hours = new Date().getHours();
    return hours < 8 || hours >= 20;
  }

  constructor(private http: Http, private page: Page, private firebaseService: FirebaseService) {

    this.screen = platform.screen.mainScreen.widthDIPs <= 640 ? 'small' : 'big';

    this.page.actionBarHidden = true;
    this.page.backgroundSpanUnderStatusBar = true;

    const theme = appSettings.hasKey(this.DARK_THEME_KEY) ?
      appSettings.getBoolean(this.DARK_THEME_KEY) :
      this.isDarkThemeByTime();

    this.switchTheme(theme);
  }

  share() {

    this.joke
      .first()
      .subscribe(data => SocialShare.shareText(data.content, data.title));
  }

  setTheme() {
    appSettings.setBoolean(this.DARK_THEME_KEY, this.switchTheme());
  }

  switchTheme(forceDarkTheme?): boolean {

    this.darkTheme = forceDarkTheme !== undefined ? forceDarkTheme : !this.darkTheme;

    const color = this.darkTheme ? new Color('black') : new Color('white');

    this.page.backgroundColor = color;

    if (platform.isIOS) {
      topmost().ios.controller.navigationBar.barStyle = this.darkTheme ? 1 : 0;
    }

    if (platform.isAndroid && platform.device.sdkVersion >= '21') {

      const window = app.android.startActivity.getWindow();
      window.setStatusBarColor(color.android);

      const decorView = window.getDecorView();
      let flag = this.darkTheme ? 0 : android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      decorView.setSystemUiVisibility(flag);

    }

    return this.darkTheme;
  }

  loadJoke(event?: any) {

    if (event) {
      if (event.direction !== SwipeDirection.left && event.direction !== SwipeDirection.right) {
        return;
      }
    }

    const connectionType = connectivity.getConnectionType();

    if (connectionType === connectivity.connectionType.none) {
      Toast.makeText('Интернета нет ¯\\_(ツ)_/¯').show();
      return;
    }

    if (this.scrollView) {
      this.scrollView.nativeElement.scrollToVerticalOffset(0);
    }

    this.loading.next(true);

    this.http.get(endpoint)
      .map(res => res.json())
      .retryWhen(errors => {

        return errors
          .scan((count, err) => {
            
            if (count > 2) {
              throw err;
            }

            return ++count;
          }, 0);

      })
      .subscribe(
        data => this.joke.next(data.joke),
        err => {
          this.loading.next(false);
          Toast.makeText('Не смог загрузить ¯\\_(ツ)_/¯').show();
        },
        () => this.loading.next(false)
      );
  }

  ngOnInit() {

    this.loadJoke();
  }
}
