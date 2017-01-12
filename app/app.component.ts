import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { Page } from 'ui/page';
import { Color } from 'color';
import { topmost } from 'ui/frame';
import * as platform from 'platform';
import * as app from 'application';

import { SwipeDirection } from 'ui/gestures';
import * as SocialShare from 'nativescript-social-share';

import { Observable } from 'rxjs/Observable'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/first';

declare var android;

const endpoint = 'https://myfavor.ru/joke/any.json';

@Component({
  selector: 'my-app',
  template: `
    <GridLayout class="p-20" [class.content-dark]="darkTheme">

      <ActivityIndicator class="spinner" *ngIf="loading | async" busy="true"></ActivityIndicator>

      <ScrollView
        (swipe)="loadJoke($event)"
        (doubleTap)="switchTheme()"
        (longPress)="share()">

        <Label
          class="content"
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

    .content {
      background-color: #fff;
      color: #000;
      font-family: 'Roboto-Thin', 'monospace';
      font-size: 23;
      opacity: 0;
      margin-left: 40;
      margin-right: 40;
      vertical-align: center;
    }

    .content-dark {
      color: #fff;
      background-color: #000;
    }

    .visible {
      animation-name: show;
      animation-duration: .7s;
    }

    @keyframes show {
      from { opacity: 0; }
      to { opacity: 1; }
    }

  `]
})
export class AppComponent implements OnInit {

  darkTheme: boolean = false;

  loading = new BehaviorSubject(false);

  joke = new BehaviorSubject({ title: 'loading...', content: '...' });

  constructor(private http: Http, private page: Page) {
    this.page.actionBarHidden = true;
    this.page.backgroundSpanUnderStatusBar = true;
    this.switchTheme();
  }

  share() {

    this.joke
      .first()
      .subscribe(data => SocialShare.shareText(data.content, data.title));
  }

  switchTheme() {

    this.darkTheme = !this.darkTheme;

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

  }

  loadJoke(event?: any) {

    if (event) {
      if (event.direction !== SwipeDirection.left && event.direction !== SwipeDirection.right) {
        return;
      }
    }

    this.loading.next(true);

    this.http.get(endpoint)
      .map(res => res.json())
      .do(() => this.loading.next(false))
      .subscribe(data => this.joke.next(data.joke))
  }

  ngOnInit() {

    this.loadJoke();
  }
}
