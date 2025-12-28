import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FavoriteService, Favorite } from '../../services/favorite.service';

@Component({
    selector: 'app-favorites',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './favorites.component.html',
    styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
    favorites: Favorite[] = [];
    filteredFavorites: Favorite[] = [];
    loading = true;

    // Search and filter
    searchTerm = '';
    typeFilter = 'all'; // 'all', 'sale', 'rent'

    constructor(private favoriteService: FavoriteService) { }

    ngOnInit(): void {
        this.loadFavorites();
    }

    loadFavorites() {
        this.loading = true;
        this.favoriteService.getAll().subscribe({
            next: (data) => {
                this.favorites = data;
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load favorites:', err);
                this.loading = false;
            }
        });
    }

    applyFilters() {
        let result = [...this.favorites];

        // Filter by listing type
        if (this.typeFilter !== 'all') {
            result = result.filter(f => f.property?.listingType?.code === this.typeFilter);
        }

        // Filter by search term
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(f =>
                f.property?.title?.toLowerCase().includes(term) ||
                f.property?.address?.toLowerCase().includes(term)
            );
        }

        this.filteredFavorites = result;
    }

    onSearchChange() {
        this.applyFilters();
    }

    onTypeFilterChange() {
        this.applyFilters();
    }

    removeFavorite(propertyId: number, event: Event) {
        event.stopPropagation();
        this.favoriteService.remove(propertyId).subscribe({
            next: () => {
                this.favorites = this.favorites.filter(f => f.propertyId !== propertyId);
                this.applyFilters();
            },
            error: (err) => console.error('Failed to remove favorite:', err)
        });
    }

    getProperty(fav: Favorite) {
        return fav.property;
    }
}
