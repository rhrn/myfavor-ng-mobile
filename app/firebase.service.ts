import { Injectable } from '@angular/core';
import firebase = require("nativescript-plugin-firebase");
import { Subject } from 'rxjs/Subject'

@Injectable()
export class FirebaseService {

  firebase;
  user;
  push = new Subject<any>();

  constructor() {

    firebase.init({
      persist: true,
      onMessageReceivedCallback: message => this.push.next(message)
    })
      .then(instance => {

        console.log("firebase.init done");

        return firebase.login({ type: firebase.LoginType.ANONYMOUS });
      })
      .then(user => {

        this.user = user;

        firebase.addOnPushTokenReceivedCallback(token => {
          console.log("Firebase push token: " + token);
          firebase.push(`/users/${this.user.uid}/pushTokens/`, token);
        });

        firebase.setValue(`/users/${this.user.uid}/initDate`, new Date().toISOString());

        console.log("User uid2: " + user.uid);
      })
      .catch(error => console.log("firebase.init error: " + error));

    this.firebase = firebase;
  }

  saveShare(id) {
    this.firebase.setValue(`/users/${this.user.uid}/share/${id}`, this.firebase.ServerValue.TIMESTAMP);
  }

}
