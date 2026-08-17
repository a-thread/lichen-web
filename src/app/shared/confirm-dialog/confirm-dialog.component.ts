import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  open = input(false);
  title = input('');
  message = input('');
  confirmLabel = input('Confirm');
  cancelLabel = input('Cancel');

  confirmed = output<void>();
  cancelled = output<void>();
}
