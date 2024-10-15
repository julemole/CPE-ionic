import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddPhotoPage } from './add-photo.page';

describe('AddPhotoPage', () => {
  let component: AddPhotoPage;
  let fixture: ComponentFixture<AddPhotoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPhotoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
