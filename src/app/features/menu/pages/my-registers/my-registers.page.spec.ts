import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyRegistersPage } from './my-registers.page';

describe('MyRegistersPage', () => {
  let component: MyRegistersPage;
  let fixture: ComponentFixture<MyRegistersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyRegistersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
