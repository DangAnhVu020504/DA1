import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Listing } from './entities/listing.entity';
import { Transaction } from './entities/transaction.entity';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { Property } from '../properties/entities/property.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Listing, Transaction, Property])],
    controllers: [ListingsController],
    providers: [ListingsService],
    exports: [ListingsService],
})
export class ListingsModule { }
