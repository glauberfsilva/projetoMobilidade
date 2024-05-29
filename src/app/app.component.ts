import { Component } from '@angular/core';
import { MenuController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  constructor(private navCtrl: NavController, private menu: MenuController) {}

  sair(){
    localStorage.removeItem('usuarioGo5');
    this.menu.close();
    this.navCtrl.navigateForward('/login');
  }
}
