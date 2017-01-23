import { Injectable } from '@angular/core';
import firebase = require("nativescript-plugin-firebase");

@Injectable()
export class FirebaseService {

  firebase;
  user;

  constructor() {

    firebase.init({
      persist: true,
      onPushTokenReceivedCallback: (token) => {
        console.log("Firebase push token: " + token);
        firebase.push(`/users/${this.user.uid}/pushTokens/`, token);
      },
      onMessageReceivedCallback: (message) => {
        console.log("Message:");
        console.log(JSON.stringify(message, null, 2));
      }
    })
      .then(instance => {

        console.log("firebase.init done");

        return firebase.login({ type: firebase.LoginType.ANONYMOUS });
      })
      .then(user => {

        this.user = user;

        console.log("User uid2: " + user.uid);
      })
      .catch(error => console.log("firebase.init error: " + error));

    this.firebase = firebase;
  }

}
