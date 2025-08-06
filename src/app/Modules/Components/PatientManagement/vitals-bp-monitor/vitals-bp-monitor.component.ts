import { Component, ElementRef, ViewChild, inject, computed } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { CommonService } from '../../../../Service/common.service';
import { SharedServiceService } from '../../../../Service/Sharedservice/shared-service.service';
import { MatCardContent, MatCardModule } from "@angular/material/card";
import { MatTabGroup, MatTabsModule } from "@angular/material/tabs";


Chart.register(...registerables, annotationPlugin);

@Component({
  selector: 'app-vitals-bp-monitor',
  imports: [MatCardContent, MatTabGroup, MatTabsModule, MatCardModule],
  templateUrl: './vitals-bp-monitor.component.html',
  styleUrl: './vitals-bp-monitor.component.scss'
})
export class VitalsBpMonitorComponent {
  @ViewChild('bpTimeChart') bpTimeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bpTrendChart') bpTrendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sugarTimeChart') sugarTimeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sugarTrendChart') sugarTrendChartRef!: ElementRef<HTMLCanvasElement>;

  private commonService = inject(CommonService);
  private sharedService = inject(SharedServiceService);
  patientDetails = computed(() => this.sharedService.patientDetails());

  selectedTab = 0;
  readings: any[] = [];

  ngAfterViewInit() {
    this.loadVitals();
  }

  loadVitals() {
    const details = this.patientDetails();
    if (!details) return;

    this.commonService.Post('dashboard/vitalschart', { Mode: 'GET', PatientId: details.patientID })
      .subscribe((res: any) => {
        if (res.success && res.result) {
          this.readings = res.result.map((v: any) => ({
            date: v.readingDateTime.split('T')[0],
            systolic: v.systolic,
            diastolic: v.diastolic,
            sugarFasting: v.sugarFasting,
            sugarPP: v.sugarPP
          }));
          this.updateCharts();
        }
      });
  }

  updateCharts() {
    if (this.selectedTab === 0) {
      this.renderBpTimeSeries();
      this.renderBpTrends();
    } else {
      this.renderSugarTimeSeries();
      this.renderSugarTrends();
    }
  }

  renderBpTimeSeries() {
    new Chart(this.bpTimeChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.readings.map(r => r.date),
        datasets: [
          {
            label: 'Systolic',
            data: this.readings.map(r => r.systolic),
            borderColor: '#e53935',
            fill: false,
            pointBackgroundColor: ctx => (ctx.raw as number) > 140 ? 'red' : '#e53935'
          },
          {
            label: 'Diastolic',
            data: this.readings.map(r => r.diastolic),
            borderColor: '#1e88e5',
            fill: false,
            pointBackgroundColor: ctx => (ctx.raw as number) > 90 ? 'red' : '#1e88e5'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          annotation: {
            annotations: {
              systolicRange: { type: 'box', yMin: 90, yMax: 140, backgroundColor: 'rgba(255,0,0,0.05)' },
              diastolicRange: { type: 'box', yMin: 60, yMax: 90, backgroundColor: 'rgba(0,0,255,0.05)' }
            }
          }
        }
      }
    });
  }

  renderBpTrends() {
    const avgBp = this.readings.map(r => (r.systolic + r.diastolic) / 2);
    new Chart(this.bpTrendChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.readings.map(r => r.date),
        datasets: [{
          label: 'Avg BP',
          data: avgBp,
          backgroundColor: avgBp.map(v => v > 120 ? 'rgba(255,0,0,0.5)' : 'rgba(0,150,0,0.5)')
        }]
      }
    });
  }

  renderSugarTimeSeries() {
    new Chart(this.sugarTimeChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.readings.map(r => r.date),
        datasets: [
          {
            label: 'Fasting Sugar',
            data: this.readings.map(r => r.sugarFasting),
            borderColor: '#43a047',
            fill: false,
            pointBackgroundColor: ctx => (ctx.raw as number) > 100 ? 'red' : '#43a047'
          },
          {
            label: 'PP Sugar',
            data: this.readings.map(r => r.sugarPP),
            borderColor: '#fb8c00',
            fill: false,
            pointBackgroundColor: ctx => (ctx.raw as number) > 140 ? 'red' : '#fb8c00'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          annotation: {
            annotations: {
              fastingRange: { type: 'box', yMin: 70, yMax: 100, backgroundColor: 'rgba(0,255,0,0.05)' },
              ppRange: { type: 'box', yMin: 80, yMax: 140, backgroundColor: 'rgba(255,165,0,0.05)' }
            }
          }
        }
      }
    });
  }

  renderSugarTrends() {
    const avgSugar = this.readings.map(r => (r.sugarFasting + r.sugarPP) / 2);
    new Chart(this.sugarTrendChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.readings.map(r => r.date),
        datasets: [{
          label: 'Avg Sugar',
          data: avgSugar,
          backgroundColor: avgSugar.map(v => v > 120 ? 'rgba(255,0,0,0.5)' : 'rgba(0,150,0,0.5)')
        }]
      }
    });
  }
// @ViewChild('bpChart') bpChartRef!: ElementRef<HTMLCanvasElement>;
//   @ViewChild('bpTrendChart') bpTrendChartRef!: ElementRef<HTMLCanvasElement>;

//   private commonService = inject(CommonService);
//     private sharedService = inject(SharedServiceService);
//  patientDetails = computed(() => this.sharedService.patientDetails());
//   readings: any[] = [];

//   ngAfterViewInit() {
//     this.loadVitals();
//   }

//   loadVitals() {
//      const details = this.patientDetails();
//     if (!details) return;
//     const payload = {

//       Mode: 'GET',
//   PatientId: details.patientID
 
//     };
//     this.commonService.Post('dashboard/vitalschart', payload).subscribe((res: any) => {
//       if (res.success && res.result) {
//         this.readings = res.result.map((v: any) => ({
//           date: v.readingDateTime.split('T')[0],
//           systolic: v.systolic,
//           diastolic: v.diastolic
//         }));
//         this.renderBpChart();
//         this.renderDailyTrendChart();
//       }
//     });
//   }

// renderBpChart() {
//   const canvas = this.bpChartRef?.nativeElement;
//   if (!canvas) return;

//   const ctx = canvas.getContext('2d');
//   if (!ctx) return;

//   // Gradient colors
//   const systolicGradient = ctx.createLinearGradient(0, 0, 0, 400);
//   systolicGradient.addColorStop(0, 'rgba(244,67,54,0.4)'); // red top
//   systolicGradient.addColorStop(1, 'rgba(244,67,54,0)');   // fade bottom

//   const diastolicGradient = ctx.createLinearGradient(0, 0, 0, 400);
//   diastolicGradient.addColorStop(0, 'rgba(33,150,243,0.4)'); // blue top
//   diastolicGradient.addColorStop(1, 'rgba(33,150,243,0)');   // fade bottom

//   const labels = this.readings.map(r => r.date);

//   const config: ChartConfiguration<'line'> = {
//     type: 'line',
//     data: {
//       labels,
//       datasets: [
//         {
//           label: 'Systolic (mmHg)',
//           data: this.readings.map(r => r.systolic),
//           borderColor: '#f44336',
//           backgroundColor: systolicGradient,
//           fill: true,
//           tension: 0.4,
//           borderWidth: 3,
//           pointRadius: 6,
//           pointHoverRadius: 8,
//           pointBackgroundColor: (ctx) => {
//             const val = ctx.raw as number;
//             return val > 140 ? '#ff1744' : '#f44336';
//           },
//           pointBorderWidth: 2,
//           pointBorderColor: '#fff',
//         },
//         {
//           label: 'Diastolic (mmHg)',
//           data: this.readings.map(r => r.diastolic),
//           borderColor: '#2196f3',
//           backgroundColor: diastolicGradient,
//           fill: true,
//           tension: 0.4,
//           borderWidth: 3,
//           pointRadius: 6,
//           pointHoverRadius: 8,
//           pointBackgroundColor: (ctx) => {
//             const val = ctx.raw as number;
//             return val > 90 ? '#2979ff' : '#2196f3';
//           },
//           pointBorderWidth: 2,
//           pointBorderColor: '#fff',
//         }
//       ]
//     },
//     options: {
//       responsive: true,
//       maintainAspectRatio: false,
//       plugins: {
//         legend: {
//           position: 'top',
//           labels: {
//             font: { size: 14, family: 'Segoe UI, Arial, sans-serif' },
//             color: '#333'
//           }
//         },
//         tooltip: {
//           callbacks: {
//             label: (context) => {
//               return `${context.dataset.label}: ${context.formattedValue} mmHg`;
//             }
//           },
//           backgroundColor: 'rgba(0,0,0,0.8)',
//           titleFont: { size: 14 },
//           bodyFont: { size: 13 },
//           padding: 10
//         },
//         annotation: {
//           annotations: {
//             normalZone: {
//               type: 'box',
//               yMin: 60,
//               yMax: 90,
//               backgroundColor: 'rgba(76,175,80,0.1)',
//               borderWidth: 0
//             },
//             cautionZone: {
//               type: 'box',
//               yMin: 90,
//               yMax: 140,
//               backgroundColor: 'rgba(255,193,7,0.1)',
//               borderWidth: 0
//             },
//             highZone: {
//               type: 'box',
//               yMin: 140,
//               yMax: 200,
//               backgroundColor: 'rgba(244,67,54,0.1)',
//               borderWidth: 0
//             }
//           }
//         }
//       },
//       scales: {
//         x: {
//           grid: { color: 'rgba(0,0,0,0.05)' },
//           ticks: { font: { size: 12 }, color: '#666' }
//         },
//         y: {
//           grid: { color: 'rgba(0,0,0,0.05)' },
//           ticks: { font: { size: 12 }, color: '#666' },
//           beginAtZero: false
//         }
//       }
//     }
//   };

//   new Chart(ctx, config);
// }




//   renderDailyTrendChart() {
//     const labels = this.readings.map(r => r.date);
//     const avgBp = this.readings.map(r => (r.systolic + r.diastolic) / 2);

//     const config: ChartConfiguration<'bar'> = {
//       type: 'bar',
//       data: {
//         labels,
//         datasets: [
//           {
//             label: 'Average BP',
//             data: avgBp,
//             backgroundColor: avgBp.map(v => v > 120 ? 'rgba(255,0,0,0.5)' : 'rgba(0,150,0,0.5)'),
//             borderRadius: 5
//           }
//         ]
//       },
//       options: {
//         responsive: true,
//         plugins: { legend: { display: false } },
//         scales: { y: { beginAtZero: false } }
//       }
//     };

//     new Chart(this.bpTrendChartRef.nativeElement, config);
//   }
}
