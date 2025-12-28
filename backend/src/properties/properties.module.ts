import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { Property } from './entities/property.entity';
import { PropertyImage } from './entities/property-image.entity';
import { PropertyVideo } from './entities/property-video.entity';
import { Listing } from '../listings/entities/listing.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Property, PropertyImage, PropertyVideo, Listing])],
    controllers: [PropertiesController],
    providers: [PropertiesService],
})
export class PropertiesModule { }

