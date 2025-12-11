import { Controller, Get, Param } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    @Get('cities')
    findAllCities() {
        return this.locationsService.findAllCities();
    }

    @Get('cities/:cityId/districts')
    findDistrictsByCity(@Param('cityId') cityId: string) {
        return this.locationsService.findDistrictsByCity(+cityId);
    }

    @Get('districts')
    findAllDistricts() {
        return this.locationsService.findAllDistricts();
    }
}
