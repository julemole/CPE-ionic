import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecoverPassPage } from './recover-pass.page';

describe('RecoverPassPage', () => {
  let component: RecoverPassPage;
  let fixture: ComponentFixture<RecoverPassPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecoverPassPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
