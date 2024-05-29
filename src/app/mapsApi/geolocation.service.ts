import { Injectable } from '@angular/core';
import { NativeGeocoder, NativeGeocoderResult } from '@awesome-cordova-plugins/native-geocoder/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';


@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor(private geo: Geolocation, private nativeGeocoder: NativeGeocoder) { }

  async getCurrentLocation(): Promise<string> {
    try {
      const res = await this.geo.getCurrentPosition({
        timeout: 10000,
        enableHighAccuracy: true
      });

      return new Promise<string>((resolve, reject) => {
        const latlng = {
          lat: res.coords.latitude,
          lng: res.coords.longitude
        };

        this.nativeGeocoder.reverseGeocode(latlng.lat, latlng.lng)
          .then((result: NativeGeocoderResult[]) => {
            if (result && result.length > 0) {
              const address = result[0];
              const city = address.locality;
              const state = address.administrativeArea;

              const location = `${city} - ${state}`;
              resolve(location);
            } else {
              reject('Nenhum resultado encontrado para as coordenadas.');
            }
          })
          .catch((error: any) => {
            reject('Erro ao obter informações de geolocalização.');
          });
      });
    } catch (error) {
      throw new Error('Erro ao obter posição atual.');
    }
  }
}
