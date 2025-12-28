import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PropertyService, Property } from '../../services/property.service';
import { LookupService, ListingType, City, District } from '../../services/lookup.service';
import { FavoriteService } from '../../services/favorite.service';
import { forkJoin } from 'rxjs';

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
    cities: City[] = [];
    districts: District[] = [];

    // Pagination
    currentPage = 1;
    totalPages = 1;
    totalItems = 0;
    itemsPerPage = 12;

    // Sorting
    sortBy = 'createdAt';
    sortOrder = 'DESC';

    filters = {
        search: '',
        listingTypeId: null as number | null,
        minPrice: null as number | null,
        maxPrice: null as number | null,
        cityId: null as number | null,
        districtId: null as number | null,
        minArea: null as number | null,
        maxArea: null as number | null,
        bedrooms: null as number | null,
        bathrooms: null as number | null
    };

    constructor(
        private propertyService: PropertyService,
        private lookupService: LookupService,
        private favoriteService: FavoriteService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadListingTypes();
        this.loadCities();
        this.loadProperties();
    }

    loadListingTypes() {
        this.lookupService.getListingTypes().subscribe(data => this.listingTypes = data);
    }

    loadCities() {
        this.lookupService.getCities().subscribe(data => this.cities = data);
    }

    onCityChange() {
        this.filters.districtId = null;
        this.districts = [];
        if (this.filters.cityId) {
            this.lookupService.getDistrictsByCity(this.filters.cityId).subscribe(data => {
                this.districts = data;
            });
        }
    }

    loadProperties() {
        const params: any = {
            page: this.currentPage,
            limit: this.itemsPerPage,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder
        };
        if (this.filters.search) params.search = this.filters.search;
        if (this.filters.listingTypeId) params.listingTypeId = this.filters.listingTypeId;
        if (this.filters.minPrice) params.minPrice = this.filters.minPrice;
        if (this.filters.maxPrice) params.maxPrice = this.filters.maxPrice;
        if (this.filters.cityId) params.cityId = this.filters.cityId;
        if (this.filters.districtId) params.districtId = this.filters.districtId;
        if (this.filters.minArea) params.minArea = this.filters.minArea;
        if (this.filters.maxArea) params.maxArea = this.filters.maxArea;
        if (this.filters.bedrooms) params.bedrooms = this.filters.bedrooms;
        if (this.filters.bathrooms) params.bathrooms = this.filters.bathrooms;

        this.propertyService.findAll(params).subscribe({
            next: (response) => {
                this.properties = response.data;
                this.currentPage = response.pagination.page;
                this.totalPages = response.pagination.totalPages;
                this.totalItems = response.pagination.total;
                // Kiểm tra trạng thái yêu thích cho từng property
                this.loadFavoriteStatus();
            },
            error: (err) => console.error(err)
        });
    }

    loadFavoriteStatus() {
        if (this.properties.length === 0) return;

        // Gọi API check cho từng property
        this.properties.forEach(prop => {
            if (prop.id === undefined) return;
            this.favoriteService.check(prop.id).subscribe({
                next: (isLiked) => {
                    (prop as any).liked = isLiked;
                },
                error: () => {
                    (prop as any).liked = false;
                }
            });
        });
    }

    onSortChange() {
        this.currentPage = 1;
        this.loadProperties();
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadProperties();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadProperties();
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadProperties();
        }
    }

    getPageNumbers(): number[] {
        const pages: number[] = [];
        const start = Math.max(1, this.currentPage - 2);
        const end = Math.min(this.totalPages, this.currentPage + 2);
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }

    goToCreate() {
        this.router.navigate(['/properties/create']);
    }

    toggleLike(prop: any, event: Event) {
        event.stopPropagation();
        const currentStatus = prop.liked || false;

        this.favoriteService.toggle(prop.id, currentStatus).subscribe({
            next: () => {
                prop.liked = !currentStatus;
            },
            error: (err) => console.error('Toggle favorite failed:', err)
        });
    }

    resetFilters() {
        this.filters = {
            search: '',
            listingTypeId: null,
            minPrice: null,
            maxPrice: null,
            cityId: null,
            districtId: null,
            minArea: null,
            maxArea: null,
            bedrooms: null,
            bathrooms: null
        };
        this.districts = [];
        this.currentPage = 1;
        this.sortBy = 'createdAt';
        this.sortOrder = 'DESC';
        this.loadProperties();
    }
}
