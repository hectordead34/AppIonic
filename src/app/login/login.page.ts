import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  ToastController
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton
  ]
})
export class LoginPage {
  email = '';
  password = '';

  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  async onLogin() {
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigateByUrl('/tabs/home');
    } catch (error: any) {
      this.showToast('Error al iniciar sesión: ' + error.message);
    }
  }

  async onRegister() {
    try {
      await this.authService.register(this.email, this.password);
      this.showToast('¡Usuario registrado con éxito!');
      this.router.navigateByUrl('/tabs/home');
    } catch (error: any) {
      this.showToast('Error al registrarse: ' + error.message);
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 3000 });
    toast.present();
  }
}