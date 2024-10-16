import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignaturePadPage } from './signature-pad.page';

describe('SignaturePadPage', () => {
  let component: SignaturePadPage;
  let fixture: ComponentFixture<SignaturePadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SignaturePadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
