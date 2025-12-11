import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PropertyService, Property } from '../../services/property.service';
import { LookupService, ListingType } from '../../services/lookup.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    properties: Property[] = [];
    listingTypes: ListingType[] = [];
    filters = {
        search: '',
        listingTypeId: null as number | null,
        minPrice: null as number | null,
        maxPrice: null as number | null
    };

    constructor(
        private propertyService: PropertyService,
        private lookupService: LookupService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadListingTypes();
        this.loadProperties();
    }

    loadListingTypes() {
        this.lookupService.getListingTypes().subscribe(data => this.listingTypes = data);
    }

    loadProperties() {
        const params: any = {};
        if (this.filters.search) params.search = this.filters.search;
        if (this.filters.listingTypeId) params.listingTypeId = this.filters.listingTypeId;
        if (this.filters.minPrice) params.minPrice = this.filters.minPrice;
        if (this.filters.maxPrice) params.maxPrice = this.filters.maxPrice;

        this.propertyService.findAll(params).subscribe({
            next: (data) => this.properties = data,
            error: (err) => console.error(err)
        });
    }

    goToCreate() {
        this.router.navigate(['/properties/create']);
    }

    toggleLike(prop: any, event: Event) {
        event.stopPropagation();
        prop.liked = !prop.liked;
    }

    resetFilters() {
        this.filters = { search: '', listingTypeId: null, minPrice: null, maxPrice: null };
        this.loadProperties();
    }
}
