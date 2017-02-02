import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/platform";
import { NativeScriptHttpModule } from 'nativescript-angular/http';

import { AppComponent } from "./app.component";
import { FirebaseService } from './firebase.service';
import { StorageService } from './storage.service';

@NgModule({
    declarations: [AppComponent],
    bootstrap: [AppComponent],
    imports: [
      NativeScriptModule,
      NativeScriptHttpModule
    ],
    providers: [
      { provide: FirebaseService, useValue: new FirebaseService() },
      { provide: StorageService, useValue: new StorageService() }
    ],
    schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule { }
