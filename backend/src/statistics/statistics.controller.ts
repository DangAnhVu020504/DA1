import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Property, PropertyStatus } from '../properties/entities/property.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { AppointmentStatus } from '../appointments/entities/appointment.entity';

@Controller('statistics')
export class StatisticsController {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
        @InjectRepository(Comment)
        private commentsRepository: Repository<Comment>,
        @InjectRepository(Appointment)
        private appointmentsRepository: Repository<Appointment>,
    ) { }

    @Get()
    async getStatistics() {
        const [users, properties, comments, appointments] = await Promise.all([
            this.usersRepository.count(),
            this.propertiesRepository.count(),
            this.commentsRepository.count(),
            this.appointmentsRepository.count(),
        ]);

        // Get appointments by status
        const pendingAppointments = await this.appointmentsRepository.count({ where: { status: AppointmentStatus.PENDING } });
        const confirmedAppointments = await this.appointmentsRepository.count({ where: { status: AppointmentStatus.CONFIRMED } });
        const completedAppointments = await this.appointmentsRepository.count({ where: { status: AppointmentStatus.COMPLETED } });

        // Get properties by status
        const availableProperties = await this.propertiesRepository.count({ where: { status: PropertyStatus.AVAILABLE } });
        const soldProperties = await this.propertiesRepository.count({ where: { status: PropertyStatus.SOLD } });
        const rentedProperties = await this.propertiesRepository.count({ where: { status: PropertyStatus.RENTED } });

        return {
            totals: {
                users,
                properties,
                comments,
                appointments,
            },
            appointmentsByStatus: {
                pending: pendingAppointments,
                confirmed: confirmedAppointments,
                completed: completedAppointments,
            },
            propertiesByStatus: {
                available: availableProperties,
                sold: soldProperties,
                rented: rentedProperties,
            },
        };
    }
}

