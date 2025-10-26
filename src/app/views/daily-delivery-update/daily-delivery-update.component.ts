import { Component, OnInit,inject } from '@angular/core';
import { DailyDeliveryService } from '../../services/daily-delivery.service';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';


@Component({
  selector: 'app-daily-delivery-update',
  templateUrl: './daily-delivery-update.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule,RouterModule ]
})
export class DailyDeliveryUpdateComponent implements OnInit {
  form!: FormGroup;
  deliveryId!: number;
  header: any = {};
  driver:any={};

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private deliveryService: DailyDeliveryService
  ) {}

  ngOnInit(): void {
    this.deliveryId = +this.route.snapshot.params['id'];
    this.form = this.fb.group({
      returnTime: [''],
      completedInvoices: [0, Validators.required],
      pendingInvoices: [0, Validators.required],
      cashCollected: [0, Validators.required],
      emptyCylindersReturned: [0, Validators.required],
      remarks: ['']
    });

    this.deliveryService.getDeliveryById(this.deliveryId).subscribe(res => {
      this.header = res.header;
      this.driver = res.driver?.[0] ?? {};
      const m = res.metrics;
      this.form.patchValue({
        returnTime: m.returnTime,
        completedInvoices: m.completedInvoices,
        pendingInvoices: m.pendingInvoices,
        cashCollected: m.cashCollected,
        emptyCylindersReturned: m.emptyCylindersReturned,
        remarks: m.remarks
      });
    });
  }

  save(): void {
    this.deliveryService.updateActuals(this.deliveryId, this.form.value).subscribe(() => {
      alert('Updated successfully!');
      this.router.navigate(['/daily-delivery']);
    });
  }

  closeDelivery(): void {
    this.deliveryService.closeDelivery(this.deliveryId).subscribe(() => {
      alert('Delivery closed.');
      this.router.navigate(['/daily-delivery']);
    });
  }
}
