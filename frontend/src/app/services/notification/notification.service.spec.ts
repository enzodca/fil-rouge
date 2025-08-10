import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NotificationService } from './notification.service';

class SnackBarMock {
  open = jasmine.createSpy('open');
}
class DialogMock {
  open() { return { afterClosed: () => of(true) } as any; }
}

describe('NotificationService', () => {
  let service: NotificationService;
  let snack: SnackBarMock;
  let dialog: DialogMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useClass: SnackBarMock },
        { provide: MatDialog, useClass: DialogMock }
      ]
    });

    service = TestBed.inject(NotificationService);
    snack = TestBed.inject(MatSnackBar) as any;
    dialog = TestBed.inject(MatDialog) as any;
  });

  it('showSuccess appelle MatSnackBar.open', () => {
    service.showSuccess('ok');
    expect(snack.open).toHaveBeenCalled();
  });

  it('showError appelle MatSnackBar.open', () => {
    service.showError('err');
    expect(snack.open).toHaveBeenCalled();
  });

  it('confirm retourne un observable', (done) => {
    service.confirm('sur?').subscribe(val => {
      expect(val).toBeTrue();
      done();
    });
  });
});
