import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post()
    create(@Body() createDto: any) {
        return this.appointmentsService.create(createDto);
    }

    // Get appointments for current user's properties (notifications)
    @Get('my')
    @UseGuards(JwtAuthGuard)
    findMy(@Request() req) {
        return this.appointmentsService.findByOwner(req.user.id);
    }

    // Get count of pending appointments (for badge)
    @Get('my/count')
    @UseGuards(JwtAuthGuard)
    countMy(@Request() req) {
        return this.appointmentsService.countPendingByOwner(req.user.id);
    }

    // Get appointments sent by current user
    @Get('sent')
    @UseGuards(JwtAuthGuard)
    findSent(@Request() req) {
        return this.appointmentsService.findByCustomer(req.user.id);
    }

    @Get()
    findAll() {
        return this.appointmentsService.findAll();
    }

    @Get('listing/:listingId')
    findByListing(@Param('listingId') listingId: string) {
        return this.appointmentsService.findByListing(+listingId);
    }

    // Confirm an appointment
    @Post(':id/confirm')
    @UseGuards(JwtAuthGuard)
    confirm(@Param('id') id: string) {
        return this.appointmentsService.confirm(+id);
    }

    // Delete an appointment
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.appointmentsService.remove(+id);
    }
}



