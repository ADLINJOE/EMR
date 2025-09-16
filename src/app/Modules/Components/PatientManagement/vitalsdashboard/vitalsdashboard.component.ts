import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration ,registerables} from 'chart.js';
import { MatTab, MatTabsModule } from "@angular/material/tabs";
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

Chart.register(...registerables); // Required for Chart.js v4+

interface VitalReading {
  date: string; // YYYY-MM-DD
  systolic: number;
  diastolic: number;
  sugarFasting: number;
  sugarPP: number;
}
@Component({
  selector: 'app-vitalsdashboard',
  standalone: true,
  imports: [MatTabsModule, MatCardModule, CommonModule],
  templateUrl: './vitalsdashboard.component.html',
  styleUrls: ['./vitalsdashboard.component.scss', '../../../Shared/styles/table-template.scss']
})
export class VitalsdashboardComponent {
 @ViewChild('timeSeriesChart') timeSeriesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyTrendChart') dailyTrendChartRef!: ElementRef<HTMLCanvasElement>;

  alerts: string[] = [];
  criticalAlerts: any[] = [];
  summaryCards: any[] = [];
  bpChartData: any = {};
  sugarChartData: any = {};
  chartOptions: any = {};

  // Dummy data - replace with API results
  readings: VitalReading[] = [
    { date: '2025-08-01', systolic: 120, diastolic: 80, sugarFasting: 90, sugarPP: 120 },
    { date: '2025-08-02', systolic: 150, diastolic: 95, sugarFasting: 95, sugarPP: 130 },
    { date: '2025-08-03', systolic: 118, diastolic: 78, sugarFasting: 60, sugarPP: 110 },
    { date: '2025-08-04', systolic: 140, diastolic: 92, sugarFasting: 85, sugarPP: 150 }
  ];

  ngAfterViewInit() {
    this.generateAlerts();
    this.buildTimeSeriesChart();
    this.buildDailyTrendsChart();
  }

  generateAlerts() {
    this.alerts = [];
    this.readings.forEach(r => {
      if (r.systolic > 140 || r.diastolic > 90) {
        this.alerts.push(`High BP on ${r.date}: ${r.systolic}/${r.diastolic} mmHg`);
      }
      if (r.sugarFasting < 70 || r.sugarFasting > 100) {
        this.alerts.push(`Abnormal fasting sugar on ${r.date}: ${r.sugarFasting} mg/dL`);
      }
      if (r.sugarPP > 140) {
        this.alerts.push(`High postprandial sugar on ${r.date}: ${r.sugarPP} mg/dL`);
      }
    });
  }

  buildTimeSeriesChart() {
    const labels = this.readings.map(r => r.date);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Systolic', data: this.readings.map(r => r.systolic), borderColor: 'red', fill: false, tension: 0.2 },
          { label: 'Diastolic', data: this.readings.map(r => r.diastolic), borderColor: 'blue', fill: false, tension: 0.2 },
          { label: 'Fasting Sugar', data: this.readings.map(r => r.sugarFasting), borderColor: 'green', fill: false, tension: 0.2 },
          { label: 'PP Sugar', data: this.readings.map(r => r.sugarPP), borderColor: 'orange', fill: false, tension: 0.2 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: { beginAtZero: false }
        }
      }
    };

    new Chart(this.timeSeriesChartRef.nativeElement, config);
  }

  buildDailyTrendsChart() {
    const labels = this.readings.map(r => r.date);
    const avgBP = this.readings.map(r => (r.systolic + r.diastolic) / 2);
    const avgSugar = this.readings.map(r => (r.sugarFasting + r.sugarPP) / 2);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Avg BP', data: avgBP, backgroundColor: 'rgba(255,0,0,0.5)' },
          { label: 'Avg Sugar', data: avgSugar, backgroundColor: 'rgba(0,128,0,0.5)' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: { beginAtZero: false }
        }
      }
    };

    new Chart(this.dailyTrendChartRef.nativeElement, config);
  }
}
