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
import { Subject } from 'rxjs/Subject'

import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/retryWhen';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/filter';

import { FirebaseService } from './firebase.service';
import { StorageService } from './storage.service';

declare var android;

const endpoint = 'https://myfavor.ru/joke/any.json';

@Component({
  selector: 'my-app',
  template: `
    <GridLayout class="p-20" [class.content-dark]="darkTheme">

      <ScrollView
        #scrollView
        [class.visible]="!loading"
        (swipe)="loadJoke($event)"
        (doubleTap)="setTheme()"
        (scroll)="this.scroll.next($event)"
        (longPress)="share()">

        <Label
          class="content"
          [class.content-small-screen]="screen === 'small'"
          [class.content-big-screen]="screen === 'big'"
          [class.content-dark]="darkTheme"
          [text]="(joke | async).content"
          textWrap="true">
        </Label>

      </ScrollView>

      <ActivityIndicator class="spinner" *ngIf="loading" busy="true"></ActivityIndicator>

    </GridLayout>
  `,
  styles: [`

    .spinner {
      horizontal-align: center;
      veritical-align: center;
    }

    .content-big-screen {
      width: 65%;
    }

    .content-small-screen {
      width: 80%;
    }

    .scroll {
      opacity: 0;
    }

    .content {
      background-color: #fff;
      color: #000;
      font-family: 'Roboto-Thin', 'monospace';
      font-size: 23;
      vertical-align: center;
    }

    .content-dark {
      color: #fff;
      background-color: #000;
    }

    .visible {
      animation-name: show;
      animation-duration: 0.6s;
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

  scroll = new Subject();

  loading: boolean = false;

  joke = new BehaviorSubject({ _id: null, title: 'loading...', content: '...' });

  isDarkThemeByTime() {
    const hours = new Date().getHours();
    return hours < 8 || hours >= 20;
  }

  constructor(
    private http: Http,
    private page: Page,
    private firebaseService: FirebaseService,
    private storageService: StorageService
  ) {

    this.screen = platform.screen.mainScreen.widthDIPs <= 640 ? 'small' : 'big';

    this.page.actionBarHidden = true;
    this.page.backgroundSpanUnderStatusBar = true;

    const theme = this.storageService.hasTheme() ?
      this.storageService.getTheme() :
      this.isDarkThemeByTime();

    this.switchTheme(theme);

    this.scroll
      .debounceTime(300)
      .subscribe(event => this.saveScroll(event));

    this.firebaseService.push
      .filter(message => !message.foreground)
      .filter(message => message.type === 'joke')
      .subscribe(message => {

        this.joke.next({
          _id: message._id,
          content: message.content,
          title: message.title
        });

      });

  }

  saveScroll(event) {
    this.storageService.setScrollY(event.scrollY);
  }

  share() {

    this.joke
      .first()
      .do(data => this.firebaseService.saveShare(data._id))
      .subscribe(data => SocialShare.shareText(data.content, data.title));
  }

  setTheme() {
    this.storageService.setTheme(this.switchTheme());
  }

  switchTheme(forceDarkTheme?): boolean {

    this.darkTheme = forceDarkTheme !== undefined ? forceDarkTheme : !this.darkTheme;

    const color = this.darkTheme ? new Color('black') : new Color('white');

    this.page.backgroundColor = color;

    if (platform.isIOS) {
      topmost().ios.controller.navigationBar.barStyle = this.darkTheme ? 1 : 0;
    }

    if (platform.isAndroid && platform.device.sdkVersion >= '21') {

      let flag = android.view.View.SYSTEM_UI_FLAG_FULLSCREEN;

      const window = app.android.startActivity.getWindow();

      if (platform.device.sdkVersion >= '23') {

        window.setStatusBarColor(color.android);

        flag = this.darkTheme ?
          android.view.View.SYSTEM_UI_FLAG_VISIBLE :
          android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      }

      const decorView = window.getDecorView();
      decorView.setSystemUiVisibility(flag);

    }

    return this.darkTheme;
  }

  loadJoke(event?: any) {

    if (this.loading) {
      return;
    }

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

    this.loading = true;

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
        data => {

          if (this.scrollView) {
            this.scrollView.nativeElement.scrollToVerticalOffset(0);
          }

          this.joke.next(data.joke);
          this.storageService.setLastJoke(data.joke);
        },
        err => {
          this.loading = false;
          Toast.makeText('Не смог загрузить ¯\\_(ツ)_/¯').show();
        },
        () => this.loading = false
      );
  }

  ngOnInit() {

    const joke = this.storageService.getLastJoke();

    if (joke) {

      this.joke.next(joke);

      setTimeout(() => {

        const scrollY = this.storageService.getScrollY();

        if (scrollY && this.scrollView) {
          this.scrollView.nativeElement.scrollToVerticalOffset(scrollY);
        }

      }, 300);

      return;
    }

    this.loadJoke();
  }
}
