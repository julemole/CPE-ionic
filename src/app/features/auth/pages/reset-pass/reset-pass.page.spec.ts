import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPassPage } from './reset-pass.page';

describe('ResetPassPage', () => {
  let component: ResetPassPage;
  let fixture: ComponentFixture<ResetPassPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResetPassPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
