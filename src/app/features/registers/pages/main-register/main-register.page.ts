import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonProgressBar,
  IonCardTitle,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonLabel,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  AlertController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router, RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  camera,
  documentAttach,
  pencil,
  save,
  cameraOutline,
  documentAttachOutline,
  documentTextOutline,
  trashOutline,
} from 'ionicons/icons';
import { ParametricsService } from 'src/app/shared/services/parametrics.service';
import { forkJoin, of } from 'rxjs';
import { SaveInSessionService } from 'src/app/shared/services/save-in-session.service';
import {
  attachedData,
  PhotoData,
} from 'src/app/shared/models/save-in-session.interface';
import { RegistersService } from '../../services/registers.service';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { DatabaseService } from 'src/app/shared/services/database.service';
import { loadSignatureFile } from 'src/app/shared/utils/functions';

@Component({
  selector: 'app-main-register',
  templateUrl: './main-register.page.html',
  styleUrls: ['./main-register.page.scss'],
  standalone: true,
  imports: [
    IonItem,
    IonCardTitle,
    IonList,
    IonProgressBar,
    IonSelect,
    IonSelectOption,
    IonContent,
    IonHeader,
    IonIcon,
    IonLabel,
    IonTitle,
    IonToolbar,
    IonButton,
    IonButtons,
    IonBackButton,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLinkWithHref,
  ],
})
export class MainRegisterPage implements OnInit {
  isOnline: WritableSignal<boolean> = signal(true);
  isLoading: boolean = false;

  idInstitution: string = '';
  origIdInstitution: string = '';
  idRegister: string = '';

  registerContent: any;

  fb: FormBuilder = inject(FormBuilder);
  registerForm: FormGroup = this.fb.group({
    approach: ['', [Validators.required]],
    activity: ['', [Validators.required]],
    subactivity: ['', [Validators.required]],
  });

  imgUrl: string | null = '';

  approachList: any[] = [];
  activitiesList: any[] = [];
  subactivitiesList: any[] = [];
  teacher: any;
  institutionName: string = '';
  institutionBased: string = '';

  photoData: WritableSignal<PhotoData[]> = signal<PhotoData[]>([]);
  attachedData: WritableSignal<attachedData[]> = signal<attachedData[]>([]);

  constructor(
    private aRoute: ActivatedRoute,
    private router: Router,
    private parametricsService: ParametricsService,
    private saveInSessionService: SaveInSessionService,
    private registersService: RegistersService,
    private connectivityService: ConnectivityService,
    private dbService: DatabaseService,
    private alertController: AlertController,
  ) {
    addIcons({
      documentTextOutline,
      trashOutline,
      cameraOutline,
      documentAttachOutline,
      camera,
      documentAttach,
      pencil,
      save,
    });
    this.isOnline = this.connectivityService.getNetworkStatus();
    this.photoData = this.saveInSessionService.getPhotoData();
    this.attachedData = this.saveInSessionService.getAttachedData();

    this.registerForm.valueChanges.subscribe({
      next: () => {
        if (this.registerForm.valid) {
          saveInSessionService.saveRegisterPayload(
            this.registerForm.getRawValue()
          );
        }
      },
    });
  }

  //controles
  get approach() {
    return this.registerForm.get('approach') as FormControl;
  }
  get activity() {
    return this.registerForm.get('activity') as FormControl;
  }
  get subactivity() {
    return this.registerForm.get('subactivity') as FormControl;
  }

  async ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state) {
      this.institutionName = navigation.extras.state['institution'] as string;
      this.institutionBased = navigation.extras.state['institutionBased'] as string;
      const id = navigation.extras.state['id'] as string;
      this.saveInSessionService.saveOrigIdInstitution(id);
    }
    this.idInstitution = this.aRoute.snapshot.params['idInstitution'];
    this.idRegister = this.aRoute.snapshot.params['idRegister'];
    if (this.idInstitution || this.idRegister) {
      if(this.isOnline()){
        this.isLoading = true;
        this.getTaxonomies();
      } else {
        await this.getTaxonomiesOffline();
      }
    }
  }

  getRegisterData(): void {
    this.registersService.getRegisterById(this.idRegister).subscribe({
      next: (resp) => {
        this.registerContent = resp;
        this.loadDataRegister();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('error trayendo el registro', error);
      },
    });
  }

  loadDataRegister(): void {
    const { field_approach, field_activities, field_sub_activities } =
      this.registerContent.relationships;

    this.registerForm.patchValue({
      approach: field_approach.data ? field_approach.data.id : '',
      activity: field_activities.data ? field_activities.data.id : '',
      subactivity: field_sub_activities.data
        ? field_sub_activities.data.id
        : '',
    });

    this.registerForm.disable();
    this.isLoading = false;
  }

  getTaxonomies(): void {
    const approachList = this.parametricsService.getTaxonomyItems('approach');
    const activitiesList =
      this.parametricsService.getTaxonomyItems('activities');
    const subactivitiesList =
      this.parametricsService.getTaxonomyItems('sub_activities');
    let institution = null;
    if (this.idInstitution) {
      institution = this.registersService.getTeacherByid(
        this.idInstitution
      );
    } else {
      institution = of(null);
    }

    forkJoin([
      approachList,
      activitiesList,
      subactivitiesList,
      institution,
    ]).subscribe({
      next: ([approach, activities, subactivities, institution]) => {
        this.approachList = approach;
        this.activitiesList = activities;
        this.subactivitiesList = subactivities;
        if (institution) {
          this.teacher = institution;
          this.isLoading = false;
        }
        if (this.idRegister) {
          this.getRegisterData();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error(error);
      },
    });
  }

  async getTaxonomiesOffline() {
    try {
      const data = await this.parametricsService.getTaxonomyItemsOffline();
      if(data){
        this.approachList = data.approaches;
        this.activitiesList = data.activities;
        this.subactivitiesList = data.subActivities;
        if (this.idRegister) {
          const register = await this.registersService.getRegisterByIdOffline(this.idRegister);
          this.registerContent = register;
          if(register){
            this.registerForm.patchValue({
              approach: register.approach_uuid,
              activity: register.activity_uuid,
              subactivity: register.subactivity_uuid,
            });

            if(register.signature_file){
              this.imgUrl = await loadSignatureFile(register.signature_file);
            }

            this.registerForm.disable();
          }

        }
      }
      if(this.idInstitution){
        this.teacher = await this.dbService.getTeacherById(this.idInstitution)
      }
    } catch (error) {
      console.error('Erroooooor', error);
    }
  }

  async removePhoto(id: number) {
    const alert = await this.alertController.create({
      header: 'Advertencia',
      message: 'Desear eliminar la foto?',
      cssClass: 'warning-alert',
      buttons: [
        {
          text: 'Eliminar',
          handler: () => {
            this.saveInSessionService.removePhotoData(id);
            alert.dismiss();
          },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        }
      ],
    });

    await alert.present();
  }

  async removeAttached(id: number) {
    const alert = await this.alertController.create({
      header: 'Advertencia',
      message: 'Desear eliminar el anexo?',
      cssClass: 'warning-alert',
      buttons: [
        {
          text: 'Eliminar',
          handler: () => {
            this.saveInSessionService.removeAttachedData(id);
            alert.dismiss();
          },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        }
      ],
    });

    alert.onDidDismiss().then(() => {
      this.saveInSessionService.removeAttachedData(id);
    });

    await alert.present();
  }
}
