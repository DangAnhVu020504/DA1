import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { ContractDataDto } from './dto/contract-data.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  /**
   * Lấy toàn bộ dữ liệu cần thiết để tạo hợp đồng BĐS.
   *
   * Luồng join: Appointment → Listing → Property → Owner (User)
   *                        → Customer (User)
   *
   * @param appointmentId - ID của cuộc hẹn
   * @returns ContractDataDto - dữ liệu hợp đồng type-safe
   */
  async generateContractData(appointmentId: number): Promise<ContractDataDto> {
    // Bước 1: Tìm appointment kèm tất cả relations cần thiết
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: [
        'listing',                          // Bảng listings
        'listing.property',                 // Bảng properties
        'listing.property.owner',           // Bảng users (chủ nhà)
        'listing.property.propertyType',    // Bảng property_types
        'listing.property.listingType',     // Bảng listing_types
        'customer',                         // Bảng users (khách hàng)
      ],
    });

    // Bước 2: Kiểm tra tồn tại
    if (!appointment) {
      throw new NotFoundException(
        `Không tìm thấy lịch hẹn với ID: ${appointmentId}`,
      );
    }

    // Bước 3: Chỉ cho phép tạo hợp đồng với lịch hẹn đã confirmed hoặc completed
    const allowedStatuses = ['confirmed', 'completed'];
    if (!allowedStatuses.includes(appointment.status)) {
      throw new BadRequestException(
        `Chỉ có thể tạo hợp đồng cho lịch hẹn có trạng thái "Đã xác nhận" hoặc "Hoàn thành". ` +
        `Trạng thái hiện tại: ${appointment.status}`,
      );
    }

    // Bước 4: Trích xuất thông tin từ relations
    const property = appointment.listing?.property;
    const owner = property?.owner;
    const customer = appointment.customer;

    if (!property || !owner) {
      throw new NotFoundException(
        'Không tìm thấy thông tin bất động sản hoặc chủ nhà liên quan đến lịch hẹn này.',
      );
    }

    // Bước 5: Xây dựng DTO trả về
    const contractData: ContractDataDto = {
      appointmentId: appointment.id,

      // Bên A - Chủ nhà (Seller / Landlord)
      seller: {
        fullName: owner.fullName || '',
        phone: owner.phone || '',
        email: owner.email || '',
        address: owner.address || '',
      },

      // Bên B - Khách hàng (Buyer / Tenant)
      // Ưu tiên thông tin từ bảng users, fallback sang thông tin trong appointment
      buyer: {
        fullName: customer?.fullName || appointment.fullName || '',
        phone: customer?.phone || appointment.phone || '',
        email: customer?.email || '',
        address: customer?.address || '',
      },

      // Chi tiết bất động sản
      property: {
        title: property.title || '',
        address: property.address || '',
        price: Number(property.price) || 0,
        area: Number(property.area) || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        direction: property.direction || null,
        legalStatus: property.legalStatus || null,
        propertyType: (property as any).propertyType?.name || '',
        listingType: (property as any).listingType?.name || '',
      },

      // Ngày tháng
      contractDate: new Date().toISOString(),
      appointmentDate: appointment.scheduledAt
        ? new Date(appointment.scheduledAt).toISOString()
        : '',
    };

    return contractData;
  }
}
