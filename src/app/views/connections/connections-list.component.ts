import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonDirective, CardModule, FormModule, GridModule, TableModule } from '@coreui/angular';
import { ConnectionService, ConnectionTransaction } from '../../services/connection.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-connections-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonDirective,
    CardModule,
    FormModule,
    GridModule,
    TableModule
  ],
  templateUrl: './connections-list.component.html'
})
export class ConnectionsListComponent {
  private connectionSvc = inject(ConnectionService);
  private toastSvc = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  connections = signal<ConnectionTransaction[]>([]);
  loading = signal(false);

  filterForm = this.fb.group({
    transactionType: [''],
    fromDate: [''],
    toDate: ['']
  });

  ngOnInit() {
    // Load all connections on init
    this.loadConnections();
  }

  loadConnections() {
    this.loading.set(true);
    
    const filters = this.filterForm.value;
    const transactionType = filters.transactionType || undefined;
    const fromDate = filters.fromDate || undefined;
    const toDate = filters.toDate || undefined;

    this.connectionSvc.listConnectionTransactions(
      transactionType,
      fromDate,
      toDate
    ).subscribe({
      next: (data) => {
        this.connections.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.toastSvc.error('Failed to load connections: ' + (err.error?.message || err.message));
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    this.loadConnections();
  }

  clearFilters() {
    this.filterForm.reset({
      transactionType: '',
      fromDate: '',
      toDate: ''
    });
    this.loadConnections();
  }

  editConnection(connection: ConnectionTransaction) {
    // Navigate to connections form with connection ID as query param
    this.router.navigate(['/connections/form'], { 
      queryParams: { 
        edit: connection.connectionId 
      } 
    });
  }

  viewDetails(connection: ConnectionTransaction) {
    // Could implement a modal or details view later
    this.toastSvc.info(`Transaction: ${connection.transactionNo}`);
  }

  getTransactionTypeBadgeClass(type: string): string {
    switch (type) {
      case 'NewConnection': return 'bg-success';
      case 'Transfer': return 'bg-warning';
      case 'Surrender': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getTransactionTypeLabel(type: string): string {
    switch (type) {
      case 'NewConnection': return 'New Connection';
      case 'Transfer': return 'Transfer';
      case 'Surrender': return 'Surrender';
      default: return type;
    }
  }

  getStatusBadgeClass(status: string): string {
    return status === 'Active' ? 'bg-success' : 'bg-secondary';
  }

  createNewConnection() {
    this.router.navigate(['/connections/form']);
  }

  getConnectionCountByType(type: string): number {
    return this.connections().filter(c => c.transactionType === type).length;
  }
}
