import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    // Create comment - accepts propertyId from frontend
    @Post(':propertyId')
    @UseGuards(JwtAuthGuard)
    create(
        @Param('propertyId') propertyId: string,
        @Body('content') content: string,
        @Request() req,
    ) {
        return this.commentsService.create(+propertyId, content, req.user);
    }

    // Get comments by propertyId
    @Get(':propertyId')
    findByProperty(@Param('propertyId') propertyId: string) {
        return this.commentsService.findByProperty(+propertyId);
    }

    // Get all comments (for admin)
    @Get()
    findAll() {
        return this.commentsService.findAll();
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.commentsService.remove(+id);
    }
}


