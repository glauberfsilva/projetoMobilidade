import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, first } from 'rxjs';
import { getDatabase, ref, onValue } from 'firebase/database';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  confirmationResult: firebase.auth.ConfirmationResult;


  constructor(private fireAuth: AngularFireAuth, private afDB: AngularFireDatabase) { }
  
  public signInWithPhoneNumber(recaptchaVerifier, phoneNumber) {
    return new Promise<any>((resolve, reject) => {

      this.fireAuth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
        .then((confirmationResult) => {
          this.confirmationResult = confirmationResult;
          resolve(confirmationResult); 
        }).catch((error) => {
          console.log(error);
          reject('SMS not sent');
        });
    });
  }
  
  public async enterVerificationCode(code) {
    return new Promise<any>((resolve, reject) => {
      this.confirmationResult.confirm(code).then(async (result) => {
        console.log(result);
        const user = result.user;
        resolve(user);
      }).catch((error) => {
        reject(error.message);
      });

    });
  }
  signInWithGoogle(): Promise<firebase.auth.UserCredential> {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.fireAuth.signInWithPopup(provider);
  }

  checkIfUserExists(data: any, path: string): Observable<any> {
    return this.afDB.object(path + '/' + data.uid).valueChanges();
  }

  saveUserData(data: any, path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.afDB.object(path).update(data)
        .then(() => {
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  createData(data: any, path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.afDB.list(path).push(data)
        .then(() => {
          resolve(); // Resolvendo a promessa quando a operação estiver concluída
        })
        .catch(error => {
          reject(error); // Rejeitando a promessa em caso de erro
        });
    });
  }

  readData2(path: string): Observable<any[]> {
    return this.afDB.list(path).valueChanges();
  }

  readData(path: string): Observable<any> {
    const dbRef = ref(getDatabase(this.afDB.database.app), path);

    return new Observable((observer) => {
      onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        observer.next(data);
      });
    });
  }

  readDataX(path: string): Observable<any> {
    const dbRef = ref(getDatabase(this.afDB.database.app), path);

    return new Observable((observer) => {
      onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        observer.next(data);
      });
    });
  }

  updateData(newData: any, path: string): Promise<void> {
    return this.afDB.object(`${path}/`).update(newData);
  }

  deleteData(key: string, path: string): Promise<void> {
    return this.afDB.object(`${path}/${key}`).remove();
  }
}
