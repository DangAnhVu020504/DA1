import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ContractService, ContractData } from '../../services/contract.service';

// Import html2canvas và jsPDF
// html2canvas: chụp ảnh DOM element thành Canvas
// jsPDF: tạo file PDF từ ảnh Canvas
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-contract-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './contract-preview.component.html',
  styleUrls: ['./contract-preview.component.css'],
})
export class ContractPreviewComponent implements OnInit {
  /**
   * ViewChild tham chiếu đến thẻ div chứa template hợp đồng.
   * Dùng để truyền vào html2canvas khi xuất PDF.
   */
  @ViewChild('contractContent', { static: false })
  contractContent!: ElementRef<HTMLDivElement>;

  /** Dữ liệu hợp đồng nhận từ API */
  contractData: ContractData | null = null;

  /** Trạng thái loading khi gọi API */
  loading = true;

  /** Thông báo lỗi nếu có */
  errorMessage = '';

  /** Trạng thái đang xuất PDF (để disable nút, hiển thị spinner) */
  exporting = false;

  /** Ngày hợp đồng đã format */
  formattedContractDate = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly contractService: ContractService,
  ) {}

  ngOnInit(): void {
    // Lấy appointmentId từ route params
    const appointmentId = Number(this.route.snapshot.paramMap.get('appointmentId'));

    if (!appointmentId || isNaN(appointmentId)) {
      this.errorMessage = 'ID lịch hẹn không hợp lệ.';
      this.loading = false;
      return;
    }

    // Gọi API lấy dữ liệu hợp đồng
    this.contractService.getContractData(appointmentId).subscribe({
      next: (data: ContractData) => {
        this.contractData = data;
        this.formattedContractDate = this.formatDate(data.contractDate);
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu hợp đồng:', err);
        this.errorMessage =
          err.error?.message || 'Không thể tải dữ liệu hợp đồng. Vui lòng thử lại.';
        this.loading = false;
      },
    });
  }

  /**
   * Format giá tiền sang dạng VNĐ: 1,500,000,000 VNĐ
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  }

  /**
   * Format ngày ISO string sang dạng dd/MM/yyyy
   */
  formatDate(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Lấy ngày, tháng, năm riêng biệt cho dòng ký "Ngày ... tháng ... năm ..."
   */
  getDay(): string {
    return String(new Date().getDate()).padStart(2, '0');
  }

  getMonth(): string {
    return String(new Date().getMonth() + 1).padStart(2, '0');
  }

  getYear(): string {
    return String(new Date().getFullYear());
  }

  /**
   * Chuyển số tiền thành chữ tiếng Việt (đơn giản)
   */
  priceInWords(price: number): string {
    if (!price) return '';
    // Format đơn giản cho demo: hiển thị số + đồng
    const formatted = new Intl.NumberFormat('vi-VN').format(price);
    return `${formatted} đồng`;
  }

  /**
   * ============================================================
   * HÀM XUẤT PDF - Sử dụng html2canvas + jsPDF
   * ============================================================
   *
   * Luồng xử lý:
   * 1. Dùng html2canvas để chụp (render) thẻ div#contractContent
   *    thành một đối tượng Canvas với độ phân giải cao (scale: 3)
   * 2. Convert Canvas thành ảnh dạng base64 (PNG)
   * 3. Tạo đối tượng jsPDF khổ A4
   * 4. Tính toán kích thước ảnh sao cho vừa khít khổ A4
   * 5. Thêm ảnh vào PDF và trigger download
   *
   * LƯU Ý QUAN TRỌNG:
   * - scale: 3 đảm bảo chữ sắc nét, không bị mờ khi in
   * - useCORS: true cho phép render ảnh cross-origin (nếu có)
   * - Template HTML có width cố định 794px (= A4 width) để
   *   không bị vỡ bố cục khi render
   * - Nếu nội dung dài hơn 1 trang A4, cần chia thành nhiều trang
   * ============================================================
   */
  async exportToPDF(): Promise<void> {
    if (!this.contractContent || !this.contractData) {
      return;
    }

    this.exporting = true;

    try {
      const element = this.contractContent.nativeElement;

      // ---- Bước 1: Chụp DOM element bằng html2canvas ----
      // scale: 3 → render với DPI cao (3x), ảnh rất sắc nét
      // useCORS: true → hỗ trợ ảnh từ domain khác
      // backgroundColor: '#ffffff' → đảm bảo nền trắng (tránh transparent)
      // logging: false → tắt console log của html2canvas
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Đảm bảo width cố định phù hợp A4
        windowWidth: 794,
      });

      // ---- Bước 2: Convert canvas → base64 PNG ----
      const imgData = canvas.toDataURL('image/png');

      // ---- Bước 3: Tạo đối tượng jsPDF khổ A4 ----
      // A4 kích thước: 210mm x 297mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // ---- Bước 4: Tính kích thước ảnh vừa khít A4 ----
      const pdfWidth = 210;  // A4 width in mm
      const pdfHeight = 297; // A4 height in mm

      // Tính tỷ lệ scale từ canvas → PDF
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // ---- Bước 5: Xử lý nhiều trang nếu nội dung dài ----
      // Nếu chiều cao ảnh vượt quá 1 trang A4, chia thành nhiều trang
      let heightLeft = imgHeight;
      let position = 0; // Vị trí Y hiện tại trên ảnh

      // Trang đầu tiên
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Thêm trang mới nếu nội dung tràn
      while (heightLeft > 0) {
        position -= pdfHeight; // Dịch vị trí lên (giá trị âm = phần tiếp theo)
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // ---- Bước 6: Tạo tên file và trigger download ----
      // Format: Hop_Dong_[TenBDS]_[dd-MM-yyyy].pdf
      const propertyTitle = this.contractData.property.title
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '_') // Replace ký tự đặc biệt
        .replace(/_+/g, '_') // Gom nhiều underscore thành 1
        .substring(0, 50); // Giới hạn độ dài tên file

      const dateStr = this.formattedContractDate.replace(/\//g, '-');
      const fileName = `Hop_Dong_${propertyTitle}_${dateStr}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error('Lỗi khi xuất PDF:', error);
      alert('Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.');
    } finally {
      this.exporting = false;
    }
  }
}
