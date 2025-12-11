import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Property, Comment, Appointment])],
    controllers: [StatisticsController],
})
export class StatisticsModule { }
