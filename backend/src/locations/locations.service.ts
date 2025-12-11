import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { District } from './entities/district.entity';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(City)
        private citiesRepository: Repository<City>,
        @InjectRepository(District)
        private districtsRepository: Repository<District>,
    ) { }

    findAllCities() {
        return this.citiesRepository.find();
    }

    findDistrictsByCity(cityId: number) {
        return this.districtsRepository.find({
            where: { city: { id: cityId } },
            relations: ['city'],
        });
    }

    findAllDistricts() {
        return this.districtsRepository.find({ relations: ['city'] });
    }
}
