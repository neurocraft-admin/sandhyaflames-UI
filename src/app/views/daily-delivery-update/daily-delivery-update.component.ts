import { Component, OnInit,inject } from '@angular/core';
import { DailyDeliveryService } from '../../services/daily-delivery.service';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-daily-delivery-update',
  standalone: true,
  imports: [ ReactiveFormsModule],
  templateUrl: './daily-delivery-update.component.html'
})
export class DailyDeliveryUpdateComponent implements OnInit {

  private fb = inject(FormBuilder);
  form = this.fb.group({
    deliveryId: [0],
    returnTime: [''],
    completedInvoices: [0, [Validators.required, Validators.min(0)]],
    pendingInvoices: [0, [Validators.required, Validators.min(0)]],
    cashCollected: [0, [Validators.required, Validators.min(0)]],
    emptyCylindersReturned: [0, [Validators.required, Validators.min(0)]],
    remarks: ['']
  });

  constructor(
    private fbs: FormBuilder,
    private svc: DailyDeliveryService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.form.patchValue({ deliveryId: id });
  }

  save() {
    const id = this.form.value.deliveryId!;
    this.svc.updateActuals(id, this.form.value).subscribe({
      next: () => {
        this.toast.success('Delivery actuals updated successfully');
        this.router.navigate(['/daily-delivery']);
      },
      error: () => this.toast.error('Failed to update actuals')
    });
  }
}
