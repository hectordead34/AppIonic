import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonList,
  IonIcon,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonThumbnail,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline, addOutline, createOutline, closeOutline, checkmarkOutline, imageOutline, closeCircleOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { TaskService, Task } from '../services/task.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonList,
    IonIcon,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonThumbnail
  ]
})
export class HomePage implements OnInit, OnDestroy {
  title = '';
  description = '';
  tasks: Task[] = [];
  loading = true;
  currentUserId = '';
  editingTaskId: string | null = null;

  // Variable para guardar el texto Base64 de la imagen
  imagePreview: string | null = null;

  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  private authSub?: Subscription;
  private tasksSub?: Subscription;

  constructor() {
    addIcons({ trashOutline, addOutline, createOutline, closeOutline, checkmarkOutline, imageOutline, closeCircleOutline });
  }

  ngOnInit() {
    this.authSub = this.authService.user$.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid;
        this.loadTasks(user.uid);
      } else {
        this.router.navigateByUrl('/login');
      }
    });
  }

  loadTasks(userId: string) {
    if (this.tasksSub) {
      this.tasksSub.unsubscribe();
    }
    this.loading = true;
    this.tasksSub = this.taskService.getTasks(userId).subscribe({
      next: (data) => {
        this.tasks = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar tareas:', err);
        this.loading = false;
        this.showToast('Error al cargar tareas: ' + err.message);
        this.cdr.detectChanges();
      }
    });
  }

  // Convierte y comprime la imagen a Base64
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const scaleFactor = MAX_WIDTH / img.width;
          canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
          canvas.height = img.width > MAX_WIDTH ? img.height * scaleFactor : img.height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          this.imagePreview = canvas.toDataURL('image/jpeg', 0.7);
          this.cdr.detectChanges();
        };
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedImage() {
    this.imagePreview = null;
    this.cdr.detectChanges();
  }

  async saveTask() {
    if (!this.title.trim()) return;

    try {
      const taskData: Task = {
        title: this.title,
        description: this.description,
        userId: this.currentUserId,
        imageUrl: this.imagePreview || ''
      };

      if (this.editingTaskId) {
        await this.taskService.updateTask(this.editingTaskId, taskData);
        this.showToast('¡Tarea actualizada!');
        this.cancelEdit();
      } else {
        await this.taskService.addTask(taskData);
        this.showToast('¡Tarea agregada!');
        this.resetForm();
      }
    } catch (error: any) {
      console.error('Error al guardar:', error);
      this.showToast('Error al guardar: ' + error.message);
    }
  }

  selectTaskToEdit(task: Task) {
    if (task.id) {
      this.editingTaskId = task.id;
      this.title = task.title;
      this.description = task.description;
      this.imagePreview = task.imageUrl || null;
      this.cdr.detectChanges();
    }
  }

  cancelEdit() {
    this.editingTaskId = null;
    this.resetForm();
  }

  resetForm() {
    this.title = '';
    this.description = '';
    this.editingTaskId = null;
    this.imagePreview = null;
    this.cdr.detectChanges();
  }

  async deleteTask(id?: string) {
    if (id) {
      try {
        if (this.editingTaskId === id) {
          this.cancelEdit();
        }
        await this.taskService.deleteTask(id);
        this.showToast('Tarea eliminada');
      } catch (error: any) {
        this.showToast('Error al eliminar: ' + error.message);
      }
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500 });
    toast.present();
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
    this.tasksSub?.unsubscribe();
  }
}