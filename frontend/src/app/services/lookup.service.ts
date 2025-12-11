import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface City {
    id: number;
    name: string;
}

export interface District {
    id: number;
    name: string;
    city?: City;
}

export interface PropertyType {
    id: number;
    name: string;
}

export interface ListingType {
    id: number;
    code: string;
    name: string;
}

export interface Amenity {
    id: number;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class LookupService {
    private locationsUrl = 'http://localhost:3000/locations';
    private lookupsUrl = 'http://localhost:3000/lookups';

    constructor(private http: HttpClient) { }

    getCities(): Observable<City[]> {
        return this.http.get<City[]>(`${this.locationsUrl}/cities`);
    }

    getDistrictsByCity(cityId: number): Observable<District[]> {
        return this.http.get<District[]>(`${this.locationsUrl}/cities/${cityId}/districts`);
    }

    getAllDistricts(): Observable<District[]> {
        return this.http.get<District[]>(`${this.locationsUrl}/districts`);
    }

    getPropertyTypes(): Observable<PropertyType[]> {
        return this.http.get<PropertyType[]>(`${this.lookupsUrl}/property-types`);
    }

    getListingTypes(): Observable<ListingType[]> {
        return this.http.get<ListingType[]>(`${this.lookupsUrl}/listing-types`);
    }

    getAmenities(): Observable<Amenity[]> {
        return this.http.get<Amenity[]>(`${this.lookupsUrl}/amenities`);
    }
}
