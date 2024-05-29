import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { LoadingController, MenuController, Platform, AlertController, IonButton, ModalController } from '@ionic/angular';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@awesome-cordova-plugins/native-geocoder/ngx';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { LoginService } from '../servicos/login.service';
import { ModalSolicitacaoComponent } from '../componentes/modal-solicitacao/modal-solicitacao.component';

declare var google: any;

@Component({
  selector: 'app-motorista',
  templateUrl: './motorista.page.html',
  styleUrls: ['./motorista.page.scss'],
})
export class MotoristaPage implements OnInit {
  @ViewChild('search')
  public searchElementRef!: ElementRef;
  @ViewChild('myButton') myButton: IonButton;

  zoom = 12;
  address = '';
  lat: number;
  lng: number;
  sourceLocation = '';
  sourceLocation2 = '';
  destinationLocation = '';
  destinationLocation2 = '';
  @ViewChild('esconDer', {static: true}) esconDer;
  @ViewChild('esconDerx', {static: false}) esconDerx;
  @ViewChild('esconDerx3', {static: false}) esconDerx3;
  @ViewChild('mapElement', {static: false}) mapElement;

  directionsService = new google.maps.DirectionsService();
  directionsService2 = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  private googleAutocomplete = new google.maps.places.AutocompleteService();
  private googleAutocomplete2 = new google.maps.places.AutocompleteService();
  public searchResults = new Array<any>();
  public searchResults2 = new Array<any>();
  localizacaoUser: any;
  distancia;
  duracao;
  distancia2;
  duracao2;
  valorStandard;
  valorPlus;
  valorEncomenda;
  localizacao1;
  localizacao2;
  statusMotorista = "Estou Offline";
  uidx : any;
  userDados: any = []; 
  userData: any = [];
  updatex: string;
  botaoStatus: boolean = true;
  localUser: string;

  constructor(
    private geo: Geolocation,
    private menu: MenuController,
    private nativeGeocoder: NativeGeocoder,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private db: AngularFireDatabase,
    private alertController: AlertController,
    private firebaseCrudService: LoginService,
    private modalController: ModalController,
    private renderer: Renderer2

  ) {

    this.whereIam();
    this.userDados = JSON.parse(localStorage.getItem('usuarioGo5')); 
    console.log(this.userDados);
    this.getUserData();
    this.esconDer = false;
  }

  

  ngOnInit(): void {
  
    

     
  }

  

  async updateMotorista() {
    const alert = await this.alertController.create({
      header: 'Atualizar Motorista',
      inputs: [
        {
          name: 'condutor',
          type: 'text',
          placeholder: 'Condutor',
        },
        {
          name: 'modeloAutomovel',
          type: 'text',
          placeholder: 'Modelo Automóvel',
        },
        {
          name: 'placa',
          type: 'text',
          placeholder: 'Placa',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Atualizar',
          handler: async (data) => {
            const newData = {
              nome: data.condutor,
              modelCar: data.modeloAutomovel,
              PlacaCar: data.placa,
            };
            await this.firebaseCrudService.updateData(newData, 'motoristas/'+this.userDados.uid);
            this.getUserData();  
          },
        },
      ],
    });

    await alert.present();
  }

  async getUserData() {
    
    const path = 'motoristas/' + this.userDados.uid;
    this.firebaseCrudService.readData(path).subscribe((data) => {
      if (data) {
        localStorage.setItem('usuarioGo5', JSON.stringify(data)); 
        this.userData = JSON.parse(localStorage.getItem('usuarioGo5')); 
        console.log(this.userData);
      }
 
    console.log(this.userData);

    this.updatex = this.userData.PlacaCar;
    console.log(this.updatex);

    if(this.updatex == null){
      this.updateMotorista();
    }
    if(this.userData.statusDriver == "iniciando"){
      this.exibirModalSolicitacao();
      this.botaoStatus = false;
    }
    this.esconDer = true;
    this.esconDerx = false;
    this.esconDerx3 = false;
    console.log(google);
  }); 

  }

  async exibirModalSolicitacao() {
  
    this.sourceLocation = this.userData.trajetoA;
    this.destinationLocation = this.userData.trajetoB;
    await this. calculateAndDisplayRoute();

    
  }

  statusDriver(){

    this.uidx = JSON.parse(localStorage.getItem('usuarioGo5')); 

    if(this.statusMotorista == "Estou Offline"){
      console.log(this.uidx.uid);
      this.db.object('motoristas/' + this.uidx.uid).update({
        endereco: this.localizacao1,
        statusDriver:"online",
        localDrive: this.localUser,
        uid: this.uidx.uid

      }).then( data => {
        this.statusMotorista = "Estou Online"
        this.myButton.color = "success";
        console.log('atualizou o status para Online');
        console.log(this.uidx);
      }).catch((error) => {
        console.error('Erro', error);
      });
    }
    else {
      console.log(this.uidx.uid);
      this.db.object('motoristas/' + this.uidx.uid).update({
        endereco:"Ed. Itaparica Top Business - Rodovia do Sol - Praia de Itaparica, Vila Velha - ES, Brasil",
        statusDriver:"Offline"
      }).then( data => {
        this.statusMotorista = "Estou Offline"
        this.myButton.color = "danger";
        console.log('atualizou o status para Offline');
        console.log(this.uidx);
      }).catch((error) => {
        console.error('Erro', error);
      });
    }
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
      console.log(results[0].formatted_address);
      this.localizacao1 = results[0].formatted_address;
      this.localUser = results[0].address_components[3].long_name+' - '+results[0].address_components[4].short_name
    } else {
      console.log('Nenhum resultado encontrado');
    }
  } else {
    console.log('Geocode falhou: ' + status);
  }
});
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

  calculateAndDisplayRoute() {
  this.directionsService.route(
    {
      origin: {
        query: this.sourceLocation,
      },
      destination: {
        query: this.destinationLocation,
      },
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (response, status) => {
      if (status === 'OK') {
        this.directionsRenderer.setDirections(response);
        this.esconDer = false;
        this.esconDerx = true;
        this.esconDerx3 = false;

        // Obtém uma referência ao objeto do mapa
        const map = this.directionsRenderer.getMap();

        // Obtém o centro atual do mapa
        const currentCenter = map.getCenter();

        // Define o deslocamento vertical desejado (em graus)
        const verticalOffsetDegrees = 0.02; // Ajuste conforme necessário

        // Calcula as novas coordenadas do centro do mapa
        const newCenter = new google.maps.LatLng(
          currentCenter.lat() + verticalOffsetDegrees,
          currentCenter.lng()
        );

        // Atualiza o centro do mapa
        map.setCenter(newCenter);

        // Ajusta o nível de zoom
        const newZoom = 12; // Ajuste o nível de zoom conforme necessário
        map.setZoom(newZoom);

        console.log(this.directionsRenderer);
        this.distancia = this.directionsRenderer.directions.routes[0].legs[0].distance.text;
        this.duracao = this.directionsRenderer.directions.routes[0].legs[0].duration.text;
        let tempo = this.directionsRenderer.directions.routes[0].legs[0].duration.value;
        let minuto = Math.floor(tempo / 60);
        this.valorStandard = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(minuto + 5);
        this.valorPlus = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(minuto + 12);
        this.valorEncomenda = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(minuto + 5);
        console.log(this.distancia + " / " + this.duracao);
        this.calculateRoute();
      } else {
        window.alert("Directions request failed due to " + status);
        this.esconDer = false;
        this.esconDerx = true;
        this.esconDerx3 = false;
      }
    }
  );
}

calculateRoute() {
  console.log(this.userData.trajetoA +"/"+ this.localizacao1)
  this.directionsService2.route(
    {
      origin: {
        query: this.localizacao1,
      },
      destination: {
        query: this.userData.trajetoA,
      },
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (response, status) => {
      if (status === 'OK') {
        // Você pode acessar informações da rota diretamente em 'response'
        this.distancia2 = response.routes[0].legs[0].distance.text;
        this.duracao2 = response.routes[0].legs[0].duration.text;
        let tempo = response.routes[0].legs[0].duration.value;
        let minuto = Math.floor(tempo / 60);
        //this.valorStandard = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(minuto + 5);
        //this.valorPlus = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(minuto + 12);
        //this.valorEncomenda = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(minuto + 5);
        console.log(this.distancia2 + " / " + this.duracao2);
        this.openModalSocita();
      } else {
        window.alert("Directions request failed due to " + status);
        this.esconDer = false;
        this.esconDerx = true;
        this.esconDerx3 = false;
      }
    }
  );
}


alterarTamanhoDaDiv() {
  // Seletor para a div que você deseja alterar o tamanho
  const divElement = document.querySelector('.map') as HTMLElement;

  // Verifique se o elemento foi encontrado
  if (divElement) {
    // Altere os estilos do elemento
    this.renderer.setStyle(divElement, 'margin-top', '65%'); // Ajuste conforme necessário
  }
}

async openModalSocita(){
  this.alterarTamanhoDaDiv();
  const nome = this.userData.nomePassageiro;
  const origem = this.userData.trajetoA;
  const destino = this.userData.trajetoB;
  const custo = this.userData.valor;
  const distaciatime = this.distancia+"  /  "+this.duracao;
  const distaciaPassageiro = this.distancia2+"  /  "+this.duracao2;
  const mylocation = this.localizacao1
  const uidMotorista = this.userData.uid
  const uidPassageiro = this.userData.uidPassageiro

  
  const modal = await this.modalController.create({
    component: ModalSolicitacaoComponent,
    componentProps: {
      nome,
      origem,
      destino,
      custo,
      distaciatime,
      distaciaPassageiro,
      mylocation,
      uidMotorista,
      uidPassageiro     
    },
    cssClass: 'custom-modal',
  });

  return await modal.present();
}




searchChanged(){
if(!this.sourceLocation.trim().length) return;
this.googleAutocomplete.getPlacePredictions({ 
  input: this.sourceLocation,
  location: new google.maps.LatLng(this.lat, this.lng),
  radius: 50000,
  //types: ['address'],
  componentRestrictions: { country: 'br'},
}, predictions =>{
this.searchResults = predictions
});
}


searchChanged2(){

  if(!this.destinationLocation.trim().length) return;
this.googleAutocomplete2.getPlacePredictions({ 
  input: this.destinationLocation,
  location: new google.maps.LatLng(this.lat, this.lng),
  radius: 50000,
  //types: ['address'],
  componentRestrictions: { country: 'br'},
}, predictions =>{
this.searchResults2 = predictions
});

  }


calcRoute(item: any) {
  const resEnd = item.description;
  console.log(item.description);
  this.sourceLocation2 = item.description;
  this.sourceLocation = '';
}

calcRoute2(item2: any) {
  const resEnd = item2.description;
  console.log(item2.description);
  this.destinationLocation2 = item2.description;
  this.destinationLocation = '';
}

openFirst() {
  this.menu.enable(true, 'first');
  this.menu.open('first');
}

openEnd() {
  this.menu.open('end');
}

openCustom() {
  this.menu.enable(true, 'custom');
  this.menu.open('custom');
}

}
