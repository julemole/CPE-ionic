import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhotoEvidencePage } from './photo-evidence.page';

describe('PhotoEvidencePage', () => {
  let component: PhotoEvidencePage;
  let fixture: ComponentFixture<PhotoEvidencePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PhotoEvidencePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
