import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component';

class MatDialogRefMock {
  close = jasmine.createSpy('close');
}

describe('ConfirmDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: { message: 'Confirmer ?' } }
      ]
    });
  });

  it('ferme avec false sur onCancel', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const comp = fixture.componentInstance;
    const ref = TestBed.inject(MatDialogRef) as any;
    comp.onCancel();
    expect(ref.close).toHaveBeenCalledWith(false);
  });

  it('ferme avec true sur onConfirm', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const comp = fixture.componentInstance;
    const ref = TestBed.inject(MatDialogRef) as any;
    comp.onConfirm();
    expect(ref.close).toHaveBeenCalledWith(true);
  });
});
