import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators, FormArray } from '@angular/forms';
import { IncomeExpenseService } from '../../services/income-expense.service';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-income-expense-form',
  standalone: true,
  templateUrl: './income-expense-form.component.html',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, FormsModule]
})
export class IncomeExpenseFormComponent implements OnInit {
  form!: FormGroup;
  suggestions: string[] = [];
  useSplitPayment: boolean = false;

  constructor(
    private fb: FormBuilder,
    private svc: IncomeExpenseService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      entryDate: [this.today(), Validators.required],
      type: ['Expense', Validators.required],
      categoryName: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMode: ['Cash', Validators.required],
      remarks: [''],
      paymentSplits: this.fb.array([])
    });

    this.watchTypeChanges();
    this.fetchList(); // Load recent entries on page load
  }
  incomeExpenseList: any[] = [];
filterType = '';
filterFrom = '';
filterTo = '';

fetchList() {
  this.svc.fetchList(this.filterType, this.filterFrom, this.filterTo)
    .subscribe({
      next: (res) => this.incomeExpenseList = res,
      error: (err) => this.toast.error(err?.error?.title || 'Failed to load')
    });
}

deleteEntry(id: number) {
  if (!confirm('Delete this entry?')) return;
  this.svc.delete(id).subscribe({
    next: () => {
      this.toast.success('Deleted successfully');
      this.fetchList();
    },
    error: (err) => this.toast.error(err?.error?.title || 'Delete failed')
  });
}


  private today(): string {
    return new Date().toISOString().substring(0, 10);
  }

  watchTypeChanges() {
    this.form.get('type')?.valueChanges.subscribe(() => {
      this.suggestions = [];
      this.form.get('categoryName')?.setValue('');
    });
  }

  onSearchCategory(term: string) {
    const type = this.form.get('type')?.value;
    if (!type || term.length < 1) return;
    this.svc.getCategories(type, term).subscribe(res => {
      this.suggestions = res.map(c => c.CategoryName);
    });
  }
selectCategory(name: string) {
  this.form.get('categoryName')?.setValue(name);
  this.suggestions = [];
}

  // Payment Split Management
  get paymentSplits(): FormArray {
    return this.form.get('paymentSplits') as FormArray;
  }

  toggleSplitPayment() {
    // ngModel already toggled the value, just react to the change
    if (this.useSplitPayment) {
      // Clear split array and add first split with current amount
      this.paymentSplits.clear();
      this.addPaymentSplit();
    } else {
      // Clear splits when switching back to single payment
      this.paymentSplits.clear();
    }
  }

  addPaymentSplit() {
    const split = this.fb.group({
      paymentMode: ['Cash', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]]
    });
    this.paymentSplits.push(split);
  }

  removePaymentSplit(index: number) {
    this.paymentSplits.removeAt(index);
  }

  getSplitTotal(): number {
    return this.paymentSplits.controls.reduce((sum, control) => {
      return sum + (Number(control.get('amount')?.value) || 0);
    }, 0);
  }

  getSplitDifference(): number {
    const totalAmount = Number(this.form.get('amount')?.value) || 0;
    return totalAmount - this.getSplitTotal();
  }

  isSplitValid(): boolean {
    return Math.abs(this.getSplitDifference()) < 0.01;
  }

  submit() {
    if (this.form.invalid) {
      this.toast.error('Please complete all required fields');
      return;
    }

    // Validate split payments if enabled
    if (this.useSplitPayment) {
      if (this.paymentSplits.length === 0) {
        this.toast.error('Please add at least one payment split');
        return;
      }
      if (!this.isSplitValid()) {
        this.toast.error(`Payment splits total (${this.getSplitTotal()}) must equal entry amount (${this.form.get('amount')?.value})`);
        return;
      }
    }

    const data = this.form.getRawValue();
    
    // Include payment splits only if split mode is enabled
    if (this.useSplitPayment && this.paymentSplits.length > 0) {
      data.paymentSplits = this.paymentSplits.getRawValue();
    } else {
      data.paymentSplits = null;
    }

    this.svc.create(data).subscribe({
      next: () => {
        this.toast.success('Saved successfully!');
        this.form.reset({ entryDate: this.today(), type: 'Expense', paymentMode: 'Cash' });
        this.suggestions = [];
        this.useSplitPayment = false;
        this.paymentSplits.clear();
        this.fetchList(); // Refresh recent entries after successful save
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.title || err?.message || 'Save failed';
        this.toast.error(msg);
      }
    });
  }
}
