import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { IncomeExpenseService } from '../../services/income-expense.service';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-income-expense-form',
  standalone: true,
  templateUrl: './income-expense-form.component.html',
  imports: [CommonModule, ReactiveFormsModule,  HttpClientModule,FormsModule]
})
export class IncomeExpenseFormComponent implements OnInit {
  form!: FormGroup;
  suggestions: string[] = [];

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
      remarks: ['']
    });

    this.watchTypeChanges();
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

  submit() {
    if (this.form.invalid) {
      this.toast.error('Please complete all required fields');
      return;
    }

    const data = this.form.getRawValue();
    this.svc.create(data).subscribe({
      next: () => {
        this.toast.success('Saved successfully!');
        this.form.reset({ entryDate: this.today(), type: 'Expense', paymentMode: 'Cash' });
        this.suggestions = [];
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.title || err?.message || 'Save failed';
        this.toast.error(msg);
      }
    });
  }
}
