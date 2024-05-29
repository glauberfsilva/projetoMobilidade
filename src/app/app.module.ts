import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { NgModule  } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@awesome-cordova-plugins/native-geocoder/ngx';
import { environment } from '../environments/environment.prod';



import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ModalSolicitacaoComponent } from './componentes/modal-solicitacao/modal-solicitacao.component';
 
@NgModule({
    declarations: [AppComponent, ModalSolicitacaoComponent],
    imports: [
        BrowserModule, 
        IonicModule.forRoot(),
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFireAuthModule,
        AngularFireDatabaseModule,
        AppRoutingModule, 
        
    ],
    providers: [
        Geolocation, NativeGeocoder,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy, },
        
    ],
    
    bootstrap: [AppComponent]
})
export class AppModule {
    
}
