import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsService, Statistics } from '../../../services/statistics.service';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

Chart.register(...registerables);

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
    @ViewChild('dashboardContent') dashboardContent!: ElementRef;
    @ViewChild('totalsChart') totalsChartRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('appointmentsChart') appointmentsChartRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('propertiesChart') propertiesChartRef!: ElementRef<HTMLCanvasElement>;

    statistics: Statistics | null = null;
    loading = true;
    exporting = false;
    today = new Date();

    private totalsChart: Chart | null = null;
    private appointmentsChart: Chart | null = null;
    private propertiesChart: Chart | null = null;

    constructor(private statisticsService: StatisticsService) { }

    ngOnInit(): void {
        this.loadStatistics();
    }

    ngAfterViewInit(): void {
        // Charts will be rendered after statistics are loaded
    }

    loadStatistics() {
        this.statisticsService.getStatistics().subscribe({
            next: (data) => {
                this.statistics = data;
                this.loading = false;
                // Wait for view to update, then render charts
                setTimeout(() => this.renderCharts(), 100);
            },
            error: (err) => {
                console.error('Failed to load statistics:', err);
                this.loading = false;
            }
        });
    }

    renderCharts() {
        if (!this.statistics) return;

        // Totals Bar Chart
        if (this.totalsChartRef) {
            this.totalsChart = new Chart(this.totalsChartRef.nativeElement, {
                type: 'bar',
                data: {
                    labels: ['Người dùng', 'Tin đăng', 'Bình luận', 'Lịch hẹn'],
                    datasets: [{
                        label: 'Số lượng',
                        data: [
                            this.statistics.totals.users,
                            this.statistics.totals.properties,
                            this.statistics.totals.comments,
                            this.statistics.totals.appointments
                        ],
                        backgroundColor: [
                            'rgba(52, 152, 219, 0.8)',
                            'rgba(46, 204, 113, 0.8)',
                            'rgba(155, 89, 182, 0.8)',
                            'rgba(241, 196, 15, 0.8)'
                        ],
                        borderColor: [
                            'rgb(52, 152, 219)',
                            'rgb(46, 204, 113)',
                            'rgb(155, 89, 182)',
                            'rgb(241, 196, 15)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Thống kê tổng quan', font: { size: 16 } }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // Appointments Pie Chart
        if (this.appointmentsChartRef) {
            this.appointmentsChart = new Chart(this.appointmentsChartRef.nativeElement, {
                type: 'doughnut',
                data: {
                    labels: ['Chờ xác nhận', 'Đã xác nhận', 'Hoàn thành'],
                    datasets: [{
                        data: [
                            this.statistics.appointmentsByStatus.pending,
                            this.statistics.appointmentsByStatus.confirmed,
                            this.statistics.appointmentsByStatus.completed
                        ],
                        backgroundColor: [
                            'rgba(241, 196, 15, 0.8)',
                            'rgba(46, 204, 113, 0.8)',
                            'rgba(52, 152, 219, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: { display: true, text: 'Lịch hẹn theo trạng thái', font: { size: 16 } }
                    }
                }
            });
        }

        // Properties Pie Chart
        if (this.propertiesChartRef) {
            this.propertiesChart = new Chart(this.propertiesChartRef.nativeElement, {
                type: 'pie',
                data: {
                    labels: ['Đang bán/cho thuê', 'Đã bán', 'Đã cho thuê'],
                    datasets: [{
                        data: [
                            this.statistics.propertiesByStatus.available,
                            this.statistics.propertiesByStatus.sold,
                            this.statistics.propertiesByStatus.rented
                        ],
                        backgroundColor: [
                            'rgba(46, 204, 113, 0.8)',
                            'rgba(231, 76, 60, 0.8)',
                            'rgba(155, 89, 182, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: { display: true, text: 'Bất động sản theo trạng thái', font: { size: 16 } }
                    }
                }
            });
        }
    }

    async exportToPDF() {
        if (!this.dashboardContent) return;

        this.exporting = true;

        try {
            const element = this.dashboardContent.nativeElement;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`BatDongSanVIP_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('Không thể xuất PDF. Vui lòng thử lại.');
        }

        this.exporting = false;
    }
}
