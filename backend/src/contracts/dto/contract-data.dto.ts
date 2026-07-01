/**
 * DTO (Data Transfer Object) cho dữ liệu hợp đồng BĐS.
 * Gom toàn bộ thông tin cần thiết để render template hợp đồng phía Frontend.
 */

/** Thông tin một bên tham gia hợp đồng (Bên A - Chủ nhà hoặc Bên B - Khách hàng) */
export interface ContractPartyDto {
  /** Họ và tên đầy đủ */
  fullName: string;
  /** Số điện thoại liên hệ */
  phone: string;
  /** Địa chỉ email */
  email: string;
  /** Địa chỉ thường trú */
  address: string;
}

/** Thông tin bất động sản trong hợp đồng */
export interface ContractPropertyDto {
  /** Tiêu đề / Tên bất động sản */
  title: string;
  /** Địa chỉ BĐS */
  address: string;
  /** Giá (VNĐ) */
  price: number;
  /** Diện tích (m²) */
  area: number;
  /** Số phòng ngủ */
  bedrooms: number;
  /** Số phòng tắm */
  bathrooms: number;
  /** Hướng nhà */
  direction: string | null;
  /** Tình trạng pháp lý */
  legalStatus: string | null;
  /** Loại BĐS (Căn hộ, Nhà phố, ...) */
  propertyType: string;
  /** Hình thức (Cho thuê / Bán) */
  listingType: string;
}

/** Payload đầy đủ cho hợp đồng - trả về từ API */
export interface ContractDataDto {
  /** ID cuộc hẹn gốc */
  appointmentId: number;

  /** Thông tin Bên A - Chủ nhà / Người bán */
  seller: ContractPartyDto;

  /** Thông tin Bên B - Khách hàng / Người mua (thuê) */
  buyer: ContractPartyDto;

  /** Chi tiết bất động sản */
  property: ContractPropertyDto;

  /** Ngày tạo hợp đồng (ISO string) */
  contractDate: string;

  /** Ngày hẹn xem nhà ban đầu */
  appointmentDate: string;
}
