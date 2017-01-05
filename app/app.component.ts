import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { Page } from 'ui/page';

import { SwipeDirection } from 'ui/gestures';
import * as SocialShare from 'nativescript-social-share';

import { Observable } from 'rxjs/Observable'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/first';

const endpoint = 'https://myfavor.ru/joke/any.json';

@Component({
  selector: 'my-app',
  template: `
    <GridLayout class="p-20" (swipe)="loadJoke($event)" (doubleTap)="toggleActionBar()" (longPress)="share()">

      <ActivityIndicator *ngIf="loading | async" busy="true" horizontalAlignment="center" verticalAlignment="center"></ActivityIndicator>

      <ActionBar [title]="(joke | async).title">
        <ActionItem text="Share" (tap)="share()" android.systemIcon="ic_menu_share_holo_dark" ios.systemIcon="9" ios.position="right"></ActionItem>
      </ActionBar>

      <ScrollView>

        <Label
          class="content"
          [class.visible]="!(loading | async)"
          [text]="(joke | async).content"
          (longPress)="share()"
          (swipe)="loadJoke($event)"
          (doubleTap)="toggleActionBar()"
          textWrap="true">
        </Label>

      </ScrollView>

    </GridLayout>
  `,
  styles: [`

    ActionBar {
      background-color: gray;
      font-size: 12;
      color: white;
    }

    .content {
      opacity: 0;
      margin-left: 20;
      margin-right: 20;
      color: #000;
      font-family: 'OpenSans-CondLight', 'monospace';
      font-size: 23;
      background-color: #fff;
    }

    .visible {
      animation-name: show;
      animation-duration: 1s;
    }

    @keyframes show {
      from { opacity: 0; }
      to { opacity: 1; }
    }

  `]
})
export class AppComponent implements OnInit {

  loading = new BehaviorSubject(false);

  joke = new BehaviorSubject({ title: 'loading...', content: '...' });

  constructor(private http: Http, private page: Page) {}

  share() {

    this.joke
      .first()
      .subscribe(data => SocialShare.shareText(data.content, data.title));
  }

  toggleActionBar() {

    this.page.actionBarHidden = !this.page.actionBarHidden;
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
