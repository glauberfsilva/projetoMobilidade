import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { LoadingController, MenuController, Platform, AlertController, LoadingOptions } from '@ionic/angular';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@awesome-cordova-plugins/native-geocoder/ngx';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { concatMap, delay, filter, finalize, map, mapTo, switchMap, take, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { Subject, concat, from, interval, of, timer } from 'rxjs';
import { GeolocationService } from '../mapsApi/geolocation.service';
import { LoginService } from '../servicos/login.service';
import { parse } from 'path';

declare var google: any;

interface Driver {
  uid: string;
  statusDriver: string;
  nome: string;
  localDrive: String;
  uidPassageiro: String;

  // Add other properties of the driver object as needed
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit{
  @ViewChild('search')
  public searchElementRef!: ElementRef;

  zoom = 12;
  address = '';
  lat: number;
  lng: number;
  sourceLocation: string = '';
  sourceLocation2: string = '';
  destinationLocation: string = '';
  destinationLocation2: string = '';
  @ViewChild('esconDer', {static: true}) esconDer;
  @ViewChild('esconDerx', {static: false}) esconDerx;
  @ViewChild('esconDerx3', {static: false}) esconDerx3;
  @ViewChild('mapElement', {static: false}) mapElement;
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  private googleAutocomplete = new google.maps.places.AutocompleteService();
  private googleAutocomplete2 = new google.maps.places.AutocompleteService();
  public searchResults = new Array<any>();
  public searchResults2 = new Array<any>();
  localizacaoUser: any;
  distancia;
  duracao;
  valorStandard;
  valorPlus;
  valorEncomenda;
  localizacao1;
  localizacao2;
  motoristas: any[] = [];
  driveEncontrado: any = [];
  alive: boolean = true;
  uidx : any;
  private destroy$ = new Subject<void>();
  motorista: string = 'Buscando motorista';
  dadosMotorista: any;
  localUser: string;
  kmeEtempo: string;
  statusRota: string;
  userDB: any = [];

  constructor(
    private geo: Geolocation,
    private menu: MenuController,
    private nativeGeocoder: NativeGeocoder,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private db: AngularFireDatabase,
    private alertController: AlertController,
    private changeDetectorRef: ChangeDetectorRef,
    private geolocationService: GeolocationService,
    private firebaseCrudService: LoginService,

  ) {
    console.log(google);
    if(this.driveEncontrado.statusRota == "Motorista chegou"){
    this.kmeEtempo = this.distancia+" km / "+this.duracao+" minutos";
    }
    const userDB =  localStorage.getItem('usuarioGo5');
    if (this.userDB) {
      this.userDB = JSON.parse(userDB);
      console.log(this.userDB);
    }
  }

  

  ngAfterViewInit(): void {
    this.loadMapWithDirection();
     this.whereIam();
     this.esconDer = true;
     this.esconDerx = false;
     this.esconDerx3 = false;
  }

  async presentPopup() {
    
    const alert = await this.alertController.create({
      header: 'Cadastro de Usuário',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome'
        },
        {
          name: 'dataNascimento',
          type: 'date',
          placeholder: 'Data de Nascimento'
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'E-mail'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Cancelado');
          }
        },
        {
          text: 'Salvar',
          handler: (data) => {
            console.log('Nome:', data.nome);
            console.log('Data de Nascimento:', data.dataNascimento);
            console.log('E-mail:', data.email);
          }
        }
      ]
    });
  
    await alert.present();
  }

 

 async pedirCarro(){

    const loading = await this.loadingCtrl.create({
      message: 'Procurando Motorista...',
      
    }).finally(()=>{
      let datauid =  localStorage.get('usuarioGo5');
  
      this.db.list('solicitacoes/' + datauid.uid).push({
        uid: datauid,
        data: new Date().toLocaleDateString('pt-BR'),
        horario: new Date().toLocaleTimeString(),
        passageiro: datauid.nome,
        telefone: datauid.telefone,
        enderecoPassageiro: this.localizacao1,
        status: "Buscando",
      }).then( data => {
        console.log('Pedido de carro enviado');
        
        console.log(data);
      }).catch((error) => {
        console.error('Erro pedir carro', error);
      });
    });
    setTimeout(() => {
      loading.dismiss();
    }, 3000);
  }

whereIam(){
  this.geo.getCurrentPosition({
  timeout:1000,
  enableHighAccuracy:true
}).then((res)=>{
  this.lat = res.coords.latitude;
  this.lng = res.coords.longitude;
  console.log(res);

  const map = new google.maps.Map(this.mapElement.nativeElement,
    {
      zoom: 16,
      center: { lat: this.lat, lng: this.lng },
      disableDefaultUI: true,

      
    });

    this.platform.ready().then(() => {
      if (this.platform.is('cordova')) {
        this.nativeGeocoder
          .reverseGeocode(this.lat, this.lng, options)
          .then((result: NativeGeocoderResult[]) => {
            this.localizacaoUser = result[0];
            console.log('Endereço: ', this.localizacaoUser.thoroughfare + ', ' + this.localizacaoUser.subLocality + ', ' + this.localizacaoUser.locality + ', ' + this.localizacaoUser.administrativeArea + ', ' + this.localizacaoUser.countryName);
          })
          .catch((error: any) => console.log(error));
      } else {
        // código para geolocalização na web aqui
        console.log("testeaqui");
        this.reverseGeocode();
      }
    });

    const svgMarker = {
      path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
      fillColor: "black",
      fillOpacity: 1,
      strokeWeight: 0,
      rotation: 0,
      scale: 2,
      anchor: new google.maps.Point(15, 30),
    };

    const infowindow = new google.maps.InfoWindow();
    

    new google.maps.Marker({
      position:{ lat: this.lat, lng: this.lng },
      map,
      icon: svgMarker,
      title: "Localização",
      
    });
  
  this.directionsRenderer.setMap(map);
  console.log(this.lat, this.lng);
}).catch((e) => {
///reload
  console.log(e);
});

let options: NativeGeocoderOptions = {
  useLocale: true,
  maxResults: 5
};

}

reverseGeocode() {
  const geocoder = new google.maps.Geocoder();

  const latLng = new google.maps.LatLng(this.lat, this.lng);

geocoder.geocode({ 'location': latLng }, (results: any, status: any) => {
  if (status === 'OK') {
    if (results[0]) {
      this.localUser = results[0].address_components[3].long_name+' - '+results[0].address_components[4].short_name
      console.log(this.localUser);
      console.log(results[0].formatted_address);
      this.localizacao1 = results[0].formatted_address;
    } else {
      console.log('Nenhum resultado encontrado');
    }
  } else {
    console.log('Geocode falhou: ' + status);
  }
});
}

  loadMapWithDirection(){

  /*const map = new google.maps.Map(this.mapElement.nativeElement,
    {
      zoom: 14,
      center: { lat: -17.5407744, lng: -39.7685154 },
    }
  );*/

  //this.directionsRenderer.setMap(map);

  }

  salvarSolicitacao(){
    let datauid =  localStorage.getItem('usuarioGo5');
  
    this.db.object('usuarios/'+datauid).set({
      uid: datauid,
      data: new Date().toLocaleDateString('pt-BR'),
      horario: new Date().toLocaleTimeString(),

    }).then(() => {
      console.log('Novo post adicionado com sucesso!');
    }).catch((error) => {
      console.error('Erro ao adicionar o novo post: ', error);
    });
  }

  calculateAndDisplayRoute(){
    this.directionsService.route(
      {
        origin: {
          query: this.sourceLocation||this.sourceLocation2,
          
        },
        destination: {
          query: this.destinationLocation||this.destinationLocation2,
        },
        travelMode: google.maps.TravelMode.DRIVING,
      },
     (response, status) => {
       if (status === 'OK') {
        this.directionsRenderer.setDirections(response);
        this.esconDer = false;
        this.esconDerx = true;
        this.esconDerx3 = false;
        console.log(this.directionsRenderer);
        this.distancia = this.directionsRenderer.directions.routes[0].legs[0].distance.text;
        this.duracao = this.directionsRenderer.directions.routes[0].legs[0].duration.text;
        let tempo = this.directionsRenderer.directions.routes[0].legs[0].duration.value;
        let minuto = Math.floor(tempo / 60);
        this.valorStandard = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(minuto + 5);
        this.valorPlus = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(minuto + 12);
        this.valorEncomenda = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(minuto + 5);
        console.log(this.distancia+"  /  "+this.duracao);
      } else {
      window.alert("Directions request failed due to " + status);
      this.esconDer = false;
      this.esconDerx = true;
      this.esconDerx3 = false;
  }
     }
     );
    
}

searchChanged() {
  

  const searchTerm = this.sourceLocation.trim();
  if (searchTerm === '') {
    this.searchResults = [];
    return;
  }

  // Faça sua lógica para buscar o endereço com base no searchTerm
  // e atribua os resultados à propriedade searchResults
  this.googleAutocomplete.getPlacePredictions({ 
    input: searchTerm,
    location: new google.maps.LatLng(this.lat, this.lng),
    radius: 3000,
    componentRestrictions: { country: 'br' },
  }, predictions => {
    this.searchResults = predictions;
    console.log(this.searchResults);
  });

  console.log(this.searchResults);
  console.log("teste");
  
}



searchChanged2(){

  const searchTerm2 = this.destinationLocation.trim();
  if (searchTerm2 === '') {
    this.searchResults2 = [];
    return;
  }

  this.googleAutocomplete.getPlacePredictions({ 
    input: searchTerm2,
    location: new google.maps.LatLng(this.lat, this.lng),
    radius: 3000,
    componentRestrictions: { country: 'br' },
  }, predictions => {
    this.searchResults2 = predictions;
    console.log(this.searchResults2);
  });

  }


calcRoute(item: any) {
  const resEnd = item.description;
  console.log(item); 
  //this.sourceLocation = '';
  this.sourceLocation = item.description;
  console.log(this.sourceLocation);
  console.log(this.sourceLocation2);
  this.searchResults = [];
}

calcRoute2(item2: any) {
  const resEnd = item2.description;
  console.log(item2.description);
  this.destinationLocation = item2.description;
  //this.destinationLocation = '';
  this.searchResults2 = [];

}

openFirst() {
  this.menu.enable(true, 'first');
  this.menu.open('first');
}

openEnd() {
  this.menu.open('end');
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

async whereIam2() {
  try {
    const location = await this.geolocationService.getCurrentLocation();
    console.log('Localização:', location);

    // Aqui você pode utilizar a localização conforme necessário

  } catch (error) {
    console.error(error);
  } 
}

async showLoading(categoria: string, valor: string) {


  const loading = await this.loadingCtrl.create({
    message: 'Procurando Motorista...',
    duration: 100,
  }).finally(()=>{
    this.atualizarMotoristas(categoria, valor);
  });
  this.esconDer = false;
  this.esconDerx = false;
  this.esconDerx3 = false;
  loading.present();

}

async atualizarMotoristas(categoria: string, valor: string) {
  const dataAtual: string = new Date().toLocaleDateString('pt-BR');
  const localUser = this.localUser; // Suponha que você já tenha definido o local do usuário
  this.presentLoadingWithOptions();

  try {
    // Navegue até o nó "motoristas" e liste os motoristas disponíveis
    const driversRef = this.db.list<Driver>('motoristas');
    const driversSnapshot = await driversRef.snapshotChanges().pipe(take(1)).toPromise();
    
    const availableDrivers = driversSnapshot
      .map(snapshot => snapshot.payload.val())
      .filter(driver =>
        driver.statusDriver === 'online' &&
        driver.localDrive === localUser
      );
  
    if (availableDrivers.length === 0) {
      this.loadingCtrl.dismiss(); 
      this.esconDerx = true;
      console.log('Nenhum motorista disponível no momento');
      return;
    }

    let accepted = false;

    for (const driver of availableDrivers) {
      // Atualize o status do motorista para 'iniciando' para indicar que ele está ocupado
      try {        

        const newData = {
          valor: valor,
          statusDriver: "iniciando",
          categoriaDrive: categoria,
          dataCorrida: dataAtual,
          trajetoA: this.sourceLocation,
          trajetoB: this.destinationLocation,
          uidPassageiro: this.userDB.uid
        };
        await this.firebaseCrudService.updateData(newData, 'motoristas/'+driver.uid); 

        this.firebaseCrudService.readDataX(`motoristas/${driver.uid}`).subscribe((data) => {
          if (data) {
            this.driveEncontrado = data;
          }
        });

        console.log('Buscando Motorista', driver);
      } catch (error) {
        console.log('Falha ao atualizar o status do motorista:', error);
        continue;
      }

      // Monitorar as mudanças do status do motorista em tempo real
      const driverStatusSubscription = this.db.object<Driver>(`motoristas/${driver.uid}/statusDriver`).valueChanges().subscribe(async (status: any) => {
        if (status === 'aceitou') {

          this.firebaseCrudService.readDataX(`motoristas/${driver.uid}`).subscribe((data) => {
            if (data) {
              this.driveEncontrado = data;
            }
          });

          console.log('Motorista aceitou a corrida:', driver);
          this.kmeEtempo = this.driveEncontrado.acompahaDrive;
          console.log('tempo e km', this.kmeEtempo);
          accepted = true;
          driverStatusSubscription.unsubscribe(); // Cancela a assinatura após o motorista aceitar a corrida
          this.loadingCtrl.dismiss(); 
          this.esconDerx3 = true;
          // Realize as ações necessárias com o motorista aceito
          // ...
         

        } else if (status === 'rejeitou' && !accepted) {
          // Reverte o status do motorista para 'online'
          console.log(`Revertendo motorista ${driver.uid} para status 'online'`);
          await this.db.object(`motoristas/${driver.uid}/statusDriver`).set('online');
        }
      });

      // Espera o motorista aceitar ou rejeitar a corrida (simulando um processo de aceitação)
      await new Promise(resolve => setTimeout(resolve, 15000));

      driverStatusSubscription.unsubscribe(); // Cancela a assinatura após os 15 segundos de espera

      if (accepted) {
        break; // Sai do loop se um motorista aceitar a corrida
      } else {
        // Atualiza o status do motorista para 'rejeitou' após o tempo de espera
        await this.db.object(`motoristas/${driver.uid}/statusDriver`).set('rejeitou');
      }
    }

    if (!accepted) {
      console.log('Nenhum motorista aceitou a corrida');
      this.loadingCtrl.dismiss(); 
      this.esconDerx = true;
    }

  } catch (error) {
    console.error('Erro ao buscar motoristas:', error);
    this.loadingCtrl.dismiss(); 
    this.esconDerx = true;
  }
}


async presentLoadingWithOptions() {
  const loading = await this.loadingCtrl.create({
    //spinner: null,
   // duration: 5000,
    message: 'Buscando Motorista...',
    //translucent: true,
    cssClass: 'custom-class custom-loading',
    //backdropDismiss: true
  });
  await loading.present();
  //this.loadData();
}

atualizarRotaMotorista(uidMotorista, endereco, destino, valorCorrida, uidPassageiro, nomePassageiro, nomeMotorista) {


  // Construa o objeto com os dados a serem atualizados
  const rotaUpdate = {
    endereco: endereco,
    destino: destino,
    valorcorrida: valorCorrida,
    uidpassageiro: uidPassageiro,
    nomepassageiro: nomePassageiro,
    uidmotorista: uidMotorista,
    nomemotorista: nomeMotorista
  };

  // Atualize a rota do motorista no Realtime Database
  return this.db.object(`rotamotorista/${uidMotorista}`).update(rotaUpdate);
}

}
