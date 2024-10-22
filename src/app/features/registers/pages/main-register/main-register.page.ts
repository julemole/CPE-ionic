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
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonBackButton,
  IonSelect,
  IonIcon,
  IonLabel,
  IonList,
  IonItem,
  IonSelectOption,
  LoadingController,
} from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';
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
import { loadSignatureImage } from 'src/app/shared/utils/functions';

@Component({
  selector: 'app-main-register',
  templateUrl: './main-register.page.html',
  styleUrls: ['./main-register.page.scss'],
  standalone: true,
  imports: [
    IonItem,
    IonList,
    IonSelectOption,
    IonContent,
    IonHeader,
    IonSelect,
    IonTabs,
    IonTabBar,
    IonTabButton,
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

  idInstitution: string = '';
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
  institution: any;

  photoData: WritableSignal<PhotoData[]> = signal<PhotoData[]>([]);
  attachedData: WritableSignal<attachedData[]> = signal<attachedData[]>([]);

  loading!: HTMLIonLoadingElement;

  constructor(
    private aRoute: ActivatedRoute,
    private parametricsService: ParametricsService,
    private loadingController: LoadingController,
    private saveInSessionService: SaveInSessionService,
    private registersService: RegistersService,
    private connectivityService: ConnectivityService,
    private dbService: DatabaseService
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
    this.idInstitution = this.aRoute.snapshot.params['idInstitution'];
    this.idRegister = this.aRoute.snapshot.params['idRegister'];
    if (this.idInstitution || this.idRegister) {
      if(this.isOnline()){
        this.showLoading();
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
        console.error(error);
        this.hideLoading();
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

    this.hideLoading();
  }

  getTaxonomies(): void {
    const approachList = this.parametricsService.getTaxonomyItems('approach');
    const activitiesList =
      this.parametricsService.getTaxonomyItems('activities');
    const subactivitiesList =
      this.parametricsService.getTaxonomyItems('sub_activities');
    let institution = null;
    if (this.idInstitution) {
      institution = this.registersService.getInstitutionById(
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
          this.institution = institution;
          this.hideLoading();
        }
        if (this.idRegister) {
          this.getRegisterData();
        }
      },
      error: (error) => {
        console.error(error);
        this.hideLoading();
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
              this.imgUrl = await loadSignatureImage(register.signature_file);
            }

            this.registerForm.disable();
          }

        }
      }
      if(this.idInstitution){
        this.institution = await this.dbService.getSedeById(this.idInstitution)
      }
    } catch (error) {
      console.error('Erroooooor', error);
    }
  }

  removePhoto(id: number): void {
    this.saveInSessionService.removePhotoData(id);
  }

  removeAttached(id: number): void {
    this.saveInSessionService.removeAttachedData(id);
  }

  async showLoading() {
    this.loading = await this.loadingController.create();
    await this.loading.present();
  }

  async hideLoading() {
    await this.loading.dismiss();
  }
}
