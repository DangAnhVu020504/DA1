import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig, multerVideoConfig } from '../config/multer.config';

@Controller('properties')
export class PropertiesController {
    constructor(private readonly propertiesService: PropertiesService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() createPropertyDto: any, @Request() req) {
        return this.propertiesService.create(createPropertyDto, req.user);
    }

    @Get('my')
    @UseGuards(JwtAuthGuard)
    getMyProperties(@Request() req) {
        return this.propertiesService.findByOwner(req.user.id);
    }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('listingTypeId') listingTypeId?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('cityId') cityId?: string,
        @Query('districtId') districtId?: string,
        @Query('minArea') minArea?: string,
        @Query('maxArea') maxArea?: string,
        @Query('bedrooms') bedrooms?: string,
        @Query('bathrooms') bathrooms?: string,
    ) {
        return this.propertiesService.findAll({
            search, listingTypeId, minPrice, maxPrice,
            cityId, districtId, minArea, maxArea, bedrooms, bathrooms
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.propertiesService.findOne(+id);
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', multerConfig))
    uploadImage(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('File is not an image');
        }
        return { url: `/uploads/${file.filename}` };
    }

    @Post('upload-video')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', multerVideoConfig))
    uploadVideo(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('File is not a video');
        }
        return { url: `/uploads/videos/${file.filename}` };
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body() updatePropertyDto: any) {
        return this.propertiesService.update(+id, updatePropertyDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.propertiesService.remove(+id);
    }
}
