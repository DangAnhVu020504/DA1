import { Controller, Get } from '@nestjs/common';
import { LookupsService } from './lookups.service';

@Controller('lookups')
export class LookupsController {
    constructor(private readonly lookupsService: LookupsService) { }

    @Get('amenities')
    findAllAmenities() {
        return this.lookupsService.findAllAmenities();
    }

    @Get('property-types')
    findAllPropertyTypes() {
        return this.lookupsService.findAllPropertyTypes();
    }

    @Get('listing-types')
    findAllListingTypes() {
        return this.lookupsService.findAllListingTypes();
    }
}
