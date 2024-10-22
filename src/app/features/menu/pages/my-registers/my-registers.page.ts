import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonCard,
  IonIcon,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonInfiniteScrollContent,
  IonInfiniteScroll,
  IonSelectOption,
  LoadingController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline, save } from 'ionicons/icons';
import { RegistersService } from 'src/app/features/registers/services/registers.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { RouterLinkWithHref } from '@angular/router';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { DatabaseService } from 'src/app/shared/services/database.service';

@Component({
  selector: 'app-my-registers',
  templateUrl: './my-registers.page.html',
  styleUrls: ['./my-registers.page.scss'],
  standalone: true,
  imports: [
    RouterLinkWithHref,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSelectOption,
    IonButton,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonBackButton,
    IonButtons,
    IonCard,
    IonIcon,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class MyRegistersPage implements OnInit {
  isOnline: WritableSignal<boolean> = signal(true);

  fb: FormBuilder = inject(FormBuilder);
  searchForm = this.fb.group({
    department: [''],
    zone: [''],
    city: [''],
    headquarters: [''],
  });
  myRegisters: any[] = [];
  hasMoreData: boolean = false;
  loading!: HTMLIonLoadingElement;

  constructor(
    private registersService: RegistersService,
    private localStorageSv: LocalStorageService,
    private loadingController: LoadingController,
    private connectivityService: ConnectivityService,
    private dbService: DatabaseService
  ) {
    addIcons({ documentTextOutline });
    this.isOnline = this.connectivityService.getNetworkStatus();
  }

  async ngOnInit() {
    const idUser = this.localStorageSv.getItem('USER_ID');
    if (idUser) {
      if (this.isOnline()) {
        this.showLoading();
        this.getRegisters(idUser);
      } else {
        await this.getRegistersOffline(idUser);
      }
    }
  }

  getRegisters(idUser: string): void {
    this.registersService.getRegistersByUser(idUser).subscribe({
      next: (resp) => {
        this.myRegisters = resp;
        this.hideLoading();
      },
      error: (error) => {
        this.hideLoading();
        console.error(error);
      },
    });
  }

  async getRegistersOffline(idUser: string) {
    try {
      this.myRegisters = await this.registersService.getRegistersByUserOffline(
        idUser
      );
    } catch (error) {
      throw new Error('Error al obtener los registros');
    }
  }

  loadMoreData(event: any) {}

  clearFields(): void {
    this.searchForm.reset();
  }

  async showLoading() {
    this.loading = await this.loadingController.create();
    await this.loading.present();
  }

  async hideLoading() {
    await this.loading.dismiss();
  }
}
