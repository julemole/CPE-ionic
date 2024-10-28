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
  IonProgressBar,
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline, save } from 'ionicons/icons';
import { RegistersService } from 'src/app/features/registers/services/registers.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { RouterLinkWithHref } from '@angular/router';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';

@Component({
  selector: 'app-my-registers',
  templateUrl: './my-registers.page.html',
  styleUrls: ['./my-registers.page.scss'],
  standalone: true,
  imports: [
    RouterLinkWithHref,
    IonProgressBar,
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
  isLoading: boolean = false;

  fb: FormBuilder = inject(FormBuilder);
  searchForm = this.fb.group({
    department: [''],
    zone: [''],
    city: [''],
    headquarters: [''],
  });
  myRegisters: any[] = [];
  hasMoreData: boolean = false;

  constructor(
    private registersService: RegistersService,
    private localStorageSv: LocalStorageService,
    private connectivityService: ConnectivityService,
  ) {
    addIcons({ documentTextOutline });
    this.isOnline = this.connectivityService.getNetworkStatus();
  }

  async ngOnInit() {
    const idUser = this.localStorageSv.getItem('USER_ID');
    if (idUser) {
      if (this.isOnline()) {
        this.isLoading = true;
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
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error(error);
      },
    });
  }

  async getRegistersOffline(idUser: string) {
    try {
      this.myRegisters = await this.registersService.getRegistersByUserOffline(
        idUser
      );
      this.myRegisters.sort((a, b) => {
        const dateA = new Date(a.date_created).getTime();
        const dateB = new Date(b.date_created).getTime();

        return dateB - dateA;
      });
    } catch (error) {
      throw new Error('Error al obtener los registros');
    }
  }

  loadMoreData(event: any) {}

  clearFields(): void {
    this.searchForm.reset();
  }
}
