import { Component, OnInit, inject, signal, WritableSignal, effect, DestroyRef, Renderer2, DOCUMENT } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardSummary } from '../../models/dashboard-summary.model';
import { ChartOptions } from 'chart.js';
import { DashboardChartsData, IChartProps } from './dashboard_old-charts-data';
import { FormGroup, FormControl } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// CoreUI Components
import {
  CardComponent,
  CardBodyComponent,
  CardFooterComponent,
  RowComponent,
  ColComponent,
  ProgressComponent,
  ButtonDirective,
  ButtonGroupComponent,
  FormCheckLabelDirective,
  GutterDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { WidgetsDropdownComponent } from '../widgets/widgets-dropdown/widgets-dropdown.component';
import { WidgetsBrandComponent } from '../widgets/widgets-brand/widgets-brand.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    CardComponent,
    CardBodyComponent,
    CardFooterComponent,
    RowComponent,
    ColComponent,
    ProgressComponent,
    ButtonDirective,
    ButtonGroupComponent,
    FormCheckLabelDirective,
    GutterDirective,
    IconDirective,
    ChartjsComponent,
    WidgetsDropdownComponent,
    WidgetsBrandComponent
  ]
})
export class DashboardComponent implements OnInit {
  private dashboardSvc = inject(DashboardService);
  private chartsData = inject(DashboardChartsData);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  summary: DashboardSummary | null = null;

  public mainChart: IChartProps = { type: 'line' };
  public mainChartRef: WritableSignal<any> = signal(undefined);
  public trafficRadioGroup = new FormGroup({
    trafficRadio: new FormControl('Month')
  });

  ngOnInit(): void {
    this.loadSummary();
    this.initCharts();
    this.setupColorSchemeWatcher();
  }

  loadSummary() {
    this.dashboardSvc.getSummary().subscribe({
      next: (res) => this.summary = res,
      error: (err) => console.error('Dashboard summary fetch failed', err)
    });
  }

  initCharts(): void {
    this.mainChartRef()?.stop();
    this.mainChart = this.chartsData.mainChart;
  }

  setTrafficPeriod(value: string): void {
    this.trafficRadioGroup.setValue({ trafficRadio: value });
    this.chartsData.initMainChart(value);
    this.initCharts();
  }

  handleChartRef($chartRef: any) {
    if ($chartRef) this.mainChartRef.set($chartRef);
  }

  setupColorSchemeWatcher() {
    const unListen = this.renderer.listen(this.document.documentElement, 'ColorSchemeChange', () => {
      this.setChartStyles();
    });

    this.destroyRef.onDestroy(() => {
      unListen();
    });
  }

  setChartStyles() {
    if (this.mainChartRef()) {
      setTimeout(() => {
        const options: ChartOptions = { ...this.mainChart.options };
        const scales = this.chartsData.getScales();
        this.mainChartRef().options.scales = { ...options.scales, ...scales };
        this.mainChartRef().update();
      });
    }
  }
}
