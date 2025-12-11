import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './entities/comment.entity';
import { Listing } from '../listings/entities/listing.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Comment, Listing])],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule { }

