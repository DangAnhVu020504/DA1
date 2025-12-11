import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from './entities/amenity.entity';
import { PropertyType } from './entities/property-type.entity';
import { ListingType } from './entities/listing-type.entity';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';

@Module({
    imports: [TypeOrmModule.forFeature([Amenity, PropertyType, ListingType])],
    controllers: [LookupsController],
    providers: [LookupsService],
    exports: [LookupsService],
})
export class LookupsModule { }
