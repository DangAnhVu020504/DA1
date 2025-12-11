import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenity } from './entities/amenity.entity';
import { PropertyType } from './entities/property-type.entity';
import { ListingType } from './entities/listing-type.entity';

@Injectable()
export class LookupsService {
    constructor(
        @InjectRepository(Amenity)
        private amenitiesRepository: Repository<Amenity>,
        @InjectRepository(PropertyType)
        private propertyTypesRepository: Repository<PropertyType>,
        @InjectRepository(ListingType)
        private listingTypesRepository: Repository<ListingType>,
    ) { }

    findAllAmenities() {
        return this.amenitiesRepository.find();
    }

    findAllPropertyTypes() {
        return this.propertyTypesRepository.find();
    }

    findAllListingTypes() {
        return this.listingTypesRepository.find();
    }
}
