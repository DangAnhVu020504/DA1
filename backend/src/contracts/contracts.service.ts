import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { ContractDataDto } from './dto/contract-data.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
    // ─── Bước 1: Load appointment cùng toàn bộ chuỗi relations bằng findOne ───
    // Dùng 'relations' option thay vì QueryBuilder để tránh alias conflict
    // khi eager:true trên property.owner/propertyType/listingType bị double-join
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: [
        'listing',
        'listing.property',
        'listing.property.owner',
        'listing.property.propertyType',
        'listing.property.listingType',
        'customer',
      ],
    });

    // ─── Bước 2: Kiểm tra tồn tại ───
    if (!appointment) {
      throw new NotFoundException(
        `Không tìm thấy lịch hẹn với ID: ${appointmentId}`,
      );
    }

    // ─── Bước 3: Validate trạng thái ───
    const allowedStatuses = ['confirmed', 'completed'];
    if (!allowedStatuses.includes(appointment.status)) {
      throw new BadRequestException(
        `Chỉ có thể tạo hợp đồng cho lịch hẹn có trạng thái "Đã xác nhận" hoặc "Hoàn thành". ` +
        `Trạng thái hiện tại: ${appointment.status}`,
      );
    }

    // ─── Bước 4: Trích xuất property, owner và customer từ relations đã load ───
    const property = appointment.listing?.property;
    const owner = property?.owner;

    if (!property || !owner) {
      throw new NotFoundException(
        'Không tìm thấy thông tin bất động sản hoặc chủ nhà liên quan đến lịch hẹn này.',
      );
    }

    // ─── Bước 5: Customer đã được load qua relations, không cần query thêm ───
    const customerFull = appointment.customer ?? null;

    // Load đầy đủ thông tin owner từ userRepo (phòng hờ eager load thiếu field)
    const ownerFull = await this.userRepo.findOne({ where: { id: owner.id } });

    // ─── Bước 6: Xây dựng DTO trả về ───
    const contractData: ContractDataDto = {
      appointmentId: appointment.id,

      // Bên A - Chủ nhà (Seller)
      seller: {
        fullName: ownerFull?.fullName || owner.fullName || '',
        phone: ownerFull?.phone || owner.phone || '',
        email: ownerFull?.email || owner.email || '',
        address: ownerFull?.address || '',
      },

      // Bên B - Khách hàng (Buyer)
      // Ưu tiên dữ liệu từ bảng users, fallback sang thông tin đăng ký trong appointment
      buyer: {
        fullName: customerFull?.fullName || appointment.fullName || '',
        phone: customerFull?.phone || appointment.phone || '',
        email: customerFull?.email || '',
        address: customerFull?.address || '',
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
        propertyType: property.propertyType?.name || '',
        listingType: property.listingType?.name || '',
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
