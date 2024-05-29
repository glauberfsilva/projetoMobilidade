import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { LoginService } from '../servicos/login.service';
import { environment } from '../../environments/environment';
import { NavController } from '@ionic/angular';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { parse } from 'path';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  CountryJson = [
    { name: 'Brazil', dial_code: '+55', code: 'BR' }
  ];
  OTP: string = '';
  Code: any;
  PhoneNo: any;
  CountryCode: any = '+55';
  showOTPInput: boolean = false;
  OTPmessage: string = 'An OTP is sent to your number. You should receive it in 15 s';
  recaptchaVerifier: firebase.auth.RecaptchaVerifier;
  confirmationResult: any;
  telefoneUser;
  nomeUser;
  titulo = 'Cadastrar um nova conta';
  logadoStatus;
  clickLogin: string;
  logado: any = [];
  constructor(
    private alertController: AlertController,
    private authService: LoginService,
    private navCtrl: NavController,
    private db: AngularFireDatabase
  ) {}

  async ionViewDidEnter() {
    this.logado = localStorage.getItem('usuarioGo5');
  
    if (this.logado.motorista == true) {
      this.navCtrl.navigateForward('/motorista');
    }
    if (this.logado.passageiro == true) {
      this.navCtrl.navigateForward('/home');
    }

    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', {
      size: 'invisible',
      callback: (response) => {},
      'expired-callback': () => {}
    });
  }
  async signInWithGoogle() {

    try {
      const result = await this.authService.signInWithGoogle();
      const userData = {
        uid: result.user.uid,
        nome: result.user.displayName,
        telefone: result.user.phoneNumber,
        categoria: 'passageiro',
        data: new Date().toLocaleDateString('pt-BR'),
        horario: new Date().toLocaleTimeString(),
        passageiro: true
      };

      const path = 'passageiros/'+result.user.uid; // Altere isso para o caminho correto
      localStorage.setItem('usuarioGo5', JSON.stringify(userData))
      // Verifique se o usuário já existe no banco de dados
      this.authService.checkIfUserExists(userData, path).subscribe(user => {
        if (user) {
        localStorage.setItem('usuarioGo5', JSON.stringify(user))
        this.navCtrl.navigateForward('/home');
        }
        if (!user) {
          // Se o usuário não existir, salve os dados no banco de dados
          this.authService.saveUserData(userData, path)
            .then(() => {
              // Dados salvos com sucesso
              localStorage.setItem('usuarioGo5', JSON.stringify(userData))
              this.navCtrl.navigateForward('/home');
            })
            .catch(error => {
              console.error('Erro ao salvar dados do usuário: ', error);
            });
        }
      });
    } catch (error) {
      console.error('Erro ao fazer login com o Google:', error);
    }
  }

  async signInWithGoogle2() {

    try {
      const result = await this.authService.signInWithGoogle();
      const userData = {
        uid: result.user.uid,
        nome: result.user.displayName,
        telefone: result.user.phoneNumber,
        categoria: 'motorista',
        data: new Date().toLocaleDateString('pt-BR'),
        horario: new Date().toLocaleTimeString(),
        passageiro: true
      };

      const path = 'motoristas/'+result.user.uid; // Altere isso para o caminho correto
      localStorage.setItem('usuarioGo5', JSON.stringify(userData))
      // Verifique se o usuário já existe no banco de dados
      this.authService.checkIfUserExists(userData, path).subscribe(user => {
        if (user) {
        localStorage.setItem('usuarioGo5', JSON.stringify(user))
        this.navCtrl.navigateForward('/motorista');
        }
        if (!user) {
          // Se o usuário não existir, salve os dados no banco de dados
          this.authService.saveUserData(userData, path)
            .then(() => {
              // Dados salvos com sucesso
              localStorage.setItem('usuarioGo5', JSON.stringify(userData))
              this.navCtrl.navigateForward('/motorista');
            })
            .catch(error => {
              console.error('Erro ao salvar dados do usuário: ', error);
            });
        }
      });
    } catch (error) {
      console.error('Erro ao fazer login com o Google:', error);
    }
  }

  async ionViewDidLoad() {
    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', {
      size: 'invisible',
      callback: (response) => {},
      'expired-callback': () => {}
    });
  }

  countryCodeChange($event) {
    this.CountryCode = $event.detail.value;
  }

  // Button event after the number is entered and button is clicked
  signinWithPhoneNumber($event) {
    this.clickLogin = $event.target.innerHTML;

    if (this.PhoneNo && this.CountryCode) {
      this.authService.signInWithPhoneNumber(this.recaptchaVerifier, this.CountryCode + this.PhoneNo).then(
        success => {
          this.OtpVerification();
        }
      );
    }
  }

  async showSuccess() {
    const alert = await this.alertController.create({
      header: 'Login com sucesso',
      buttons: [
        {
          text: 'Ok',
          handler: (res) => {
            alert.dismiss();
          }
        }
      ]
    });
    alert.present();
  }

  async OtpVerification() {
    const alert = await this.alertController.create({
      header: 'Verificação SMS',
      backdropDismiss: false,
      inputs: [
        {
          name: 'otp',
          type: 'text',
          placeholder: 'Digite o código OTP'
        }
      ],
      buttons: [
        {
          text: 'Enter',
          handler: (res) => {
            this.authService.enterVerificationCode(res.otp).then(
              userData => {
                this.showSuccess();
                this.salvaLogin();

              }
            );
          }
        }
      ]
    });
    await alert.present();
  }

  salvaLogin() {

    if (this.clickLogin === 'Login Passageiro') {
      this.navCtrl.navigateForward('/home');
      this.salvarPassageiro();
    } else if (this.clickLogin === 'Login Motorista') {
      this.navCtrl.navigateForward('/motorista');
      this.salvarMotorista();
    }
  }

  salvarPassageiro() {
    this.db.object('passageiros/' + this.CountryCode + this.PhoneNo).update({
      uid: this.CountryCode + this.PhoneNo,
      data: new Date().toLocaleDateString('pt-BR'),
      horario: new Date().toLocaleTimeString(),
      passageiro: true,
      telefone: this.CountryCode + this.PhoneNo,
      nome: this.nomeUser,
      categoria: 'passageiro'
    }).then(data => {
      const jsonData = JSON.stringify({
        uid: this.CountryCode + this.PhoneNo,
        data: new Date().toLocaleDateString('pt-BR'),
        horario: new Date().toLocaleTimeString(),
        passageiro: true,
        nome: this.nomeUser,
        telefone: this.PhoneNo,
        categoria: 'passageiro'
      });
      localStorage.setItem('usuarioGo5', jsonData);
      console.log('Passageiro Logado!');
      console.log(jsonData);
    }).catch((error) => {
      console.error('Erro ao adicionar o novo usuário: ', error);
    });
  }

  salvarMotorista() {
    this.db.object('motoristas/' + this.CountryCode + this.PhoneNo).update({
      uid: this.CountryCode + this.PhoneNo,
      data: new Date().toLocaleDateString('pt-BR'),
      horario: new Date().toLocaleTimeString(),
      motorista: true,
      telefone: this.CountryCode + this.PhoneNo,
      nome: this.nomeUser,
      categoria: 'motorista',
      statusDriver: 'Online'
    }).then(data => {
      const jsonData = JSON.stringify({
        uid: this.CountryCode + this.PhoneNo,
        data: new Date().toLocaleDateString('pt-BR'),
        horario: new Date().toLocaleTimeString(),
        motorista: true,
        nome: this.nomeUser,
        telefone: this.PhoneNo,
        categoria: 'motorista'
      });
      localStorage.setItem('usuarioGo5', jsonData);
      console.log('Motorista Logado!');
      console.log(jsonData);
    }).catch((error) => {
      console.error('Erro ao adicionar o novo usuário: ', error);
    });
  }
}
