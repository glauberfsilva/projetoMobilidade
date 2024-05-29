import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { LoginService } from 'src/app/servicos/login.service';

@Component({
  selector: 'app-modal-solicitacao',
  templateUrl: './modal-solicitacao.component.html',
  styleUrls: ['./modal-solicitacao.component.scss'],
})
export class ModalSolicitacaoComponent {
  @Input() nome: string;
  @Input() origem: string;
  @Input() destino: string;
  @Input() custo: string;
  @Input() distaciatime: string;
  @Input() distaciaPassageiro: string;
  @Input() mylocation: string;
  @Input() uidMotorista: string;
  @Input() uidPassageiro: string;
  userdb: any = [];

  statusCorrida: number = 0;

  constructor(
    private modalController: ModalController,
    private firebaseCrudService: LoginService,
    ) {
      this.userdb = JSON.parse(localStorage.getItem('usuarioGo5')); 
      console.log('motoristauid = '+this.userdb.uid);
    }

  fecharModal() {
    this.modalController.dismiss();
  }

  mudaStatus(){
    this.statusCorrida+=1;

    if(this.statusCorrida >2){
      this.statusCorrida=0;
      console.log(this.statusCorrida);
    }
    if(this.statusCorrida <0){
      this.statusCorrida=0;
      console.log(this.statusCorrida);
    }
    if(this.statusCorrida == 1){
      this.aceitaCorrida();
    }
    if(this.statusCorrida == 2){
      this.iniciouTrajeto();
    }
  }

  goTrajeto() {
    // Formate as coordenadas ou endereços para a URL do Google Maps
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(this.origem)}&destination=${encodeURIComponent(this.destino)}&travelmode=driving`;
  
    // Abra a URL no navegador externo
    window.open(mapsUrl, '_system');
  }

  goPassageiro() {
    // Formate as coordenadas ou endereços para a URL do Google Maps
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(this.mylocation)}&destination=${encodeURIComponent(this.origem)}&travelmode=driving`;
  
    // Abra a URL no navegador externo
    window.open(mapsUrl, '_system');
  }

  async aceitaCorrida(){
    const horarioAtual: string = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newData = {
      acompahaDrive: this.distaciaPassageiro,
      endereco: this.mylocation,
      statusDriver: "aceitou",
      statusRota: "Motorista a caminho",
      horario: horarioAtual
    };
    await this.firebaseCrudService.updateData(newData, 'motoristas/'+this.userdb.uid);

    const registraRota = {
      nomePassageiro: this.userdb.nome,
      origem: this.origem,
      destino: this.destino,
      distaciatime: this.distaciatime,
      localMotorista: this.mylocation,
      data: new Date().toLocaleDateString('pt-BR'),
      horario: new Date().toLocaleTimeString(),
      uidMotorista: this.userdb.uid,
      uidPassageiro: this.uidPassageiro

    };
    await this.firebaseCrudService.createData(registraRota, 'hitoricoMotorista/'+this.userdb.uid); 
    await this.firebaseCrudService.createData(registraRota, 'hitoricoPassageiro/'+this.uidPassageiro); 
    
    this.goPassageiro();
  }
  

  
  async iniciouTrajeto(){

    const horarioAtual: string = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newData = {
      acompahaDrive: this.distaciatime,
      endereco: this.mylocation,
      statusRota: "Trajeto iniciado",
      horario: horarioAtual
    };
    await this.firebaseCrudService.updateData(newData, 'motoristas/'+this.userdb.uid); 
    this.goTrajeto()
  }
  async rejeitouCorrida(){

    const newData = {
      acompahaDrive: this.distaciaPassageiro,
      endereco: this.mylocation,
      statusDriver: "rejeitou",
    };
    await this.firebaseCrudService.updateData(newData, 'motoristas/'+this.userdb.uid); 
    location.reload();
  }
}