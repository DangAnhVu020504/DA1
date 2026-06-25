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

    /**
     * Proxy endpoint cho Nominatim geocoding API.
     * Lý do cần proxy:
     *   1. Nominatim YÊU CẦU User-Agent header — browser không thể set được
     *   2. Tránh CORS issue khi gọi trực tiếp từ Angular
     * Route đặt TRƯỚC ':id' để NestJS không nhầm 'geocode' là một property ID.
     *
     * Chiến lược tìm kiếm (fallback):
     *   1. Tìm với địa chỉ gốc (có dấu tiếng Việt)
     *   2. Tìm với địa chỉ bỏ dấu
     *   3. Tìm với structured search (tách street/city)
     *   4. Tìm với chỉ tên đường + thành phố (đơn giản nhất)
     */
    @Get('geocode')
    async geocode(@Query('address') address: string) {
        if (!address || address.trim().length === 0) {
            throw new BadRequestException('Address is required');
        }

        const trimmed = address.trim();
        const noAccent = this.removeDiacritics(trimmed);
        const isDifferentFromOriginal = noAccent !== trimmed;

        // Xây danh sách các query cần thử, tránh trùng lặp
        const queries: Array<{ params: Record<string, string>; structured?: boolean; label: string }> = [];

        // Chiến lược 1: Tìm với địa chỉ gốc + ", Vietnam"
        queries.push({
            params: { q: `${trimmed}, Vietnam` },
            label: `[1] Free-form original: "${trimmed}, Vietnam"`,
        });

        // Chiến lược 2: Bỏ dấu tiếng Việt rồi tìm lại (chỉ khi khác gốc)
        if (isDifferentFromOriginal) {
            queries.push({
                params: { q: `${noAccent}, Vietnam` },
                label: `[2] Free-form no-accent: "${noAccent}, Vietnam"`,
            });
        }

        // Chiến lược 3: Structured search — tách street và city
        const parsed = this.parseVietnameseAddress(trimmed);
        if (parsed.street) {
            const streetNoAccent = this.removeDiacritics(parsed.street);
            const cityNoAccent = this.removeDiacritics(parsed.city || 'Ho Chi Minh City');

            queries.push({
                params: {
                    street: streetNoAccent,
                    city: cityNoAccent,
                    country: 'Vietnam',
                },
                structured: true,
                label: `[3] Structured: street="${streetNoAccent}", city="${cityNoAccent}"`,
            });
        }

        // Chiến lược 4: Chỉ tìm tên đường + thành phố (free-form, bỏ dấu)
        const simpleParts = noAccent.split(',').map(s => s.trim()).filter(Boolean);
        if (simpleParts.length >= 2) {
            const simpleQuery = `${simpleParts[0]}, ${simpleParts[simpleParts.length - 1]}, Vietnam`;
            queries.push({
                params: { q: simpleQuery },
                label: `[4] Simplified: "${simpleQuery}"`,
            });
        }

        // Chiến lược 5: Chỉ tìm tên đường
        if (simpleParts.length > 0) {
            queries.push({
                params: { q: `${simpleParts[0]}, Vietnam` },
                label: `[5] Street only: "${simpleParts[0]}, Vietnam"`,
            });
        }

        // Thực hiện lần lượt, có delay giữa các request để tránh 429
        for (let i = 0; i < queries.length; i++) {
            const { params, structured, label } = queries[i];

            // Chờ 1.1 giây giữa mỗi request để tôn trọng rate limit Nominatim (1 req/s)
            if (i > 0) {
                await this.delay(1100);
            }

            console.log(`Geocoding attempt ${label}`);
            const results = await this.nominatimSearch(params, structured || false);

            if (results.length > 0) {
                console.log(`Geocoding success with ${label}: found ${results.length} result(s)`);
                return results;
            }
        }

        console.log(`Geocoding: no results found for "${trimmed}" after ${queries.length} attempts`);
        return [];
    }

    /**
     * Delay helper — dừng N milliseconds.
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gọi Nominatim search API.
     * Tự động retry 1 lần nếu gặp 429 Too Many Requests.
     * @param queryParams - Tham số tìm kiếm (q cho free-form, hoặc street/city/country cho structured)
     * @param structured - Nếu true, dùng structured search (không thêm q)
     */
    private async nominatimSearch(
        queryParams: Record<string, string>,
        structured = false,
    ): Promise<any[]> {
        const params = new URLSearchParams({
            ...queryParams,
            format: 'json',
            limit: '5',
            addressdetails: '1',
        });

        // Chỉ thêm countrycodes khi dùng free-form search
        if (!structured) {
            params.set('countrycodes', 'vn');
        }

        const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

        // Thử tối đa 2 lần (retry 1 lần nếu gặp 429)
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'BatDongSanVIP/1.0 (contact@batdongsanvip.vn)',
                        'Accept': 'application/json',
                    },
                });

                if (response.status === 429) {
                    console.warn(`Geocoding 429 rate limited (attempt ${attempt + 1}), waiting 2s before retry...`);
                    await this.delay(2000);
                    continue; // retry
                }

                if (!response.ok) {
                    console.error(`Geocoding HTTP error: ${response.status} for URL: ${url}`);
                    return [];
                }

                const data = await response.json();
                return Array.isArray(data) ? data : [];
            } catch (error) {
                console.error('Geocoding error:', error?.message);
                return [];
            }
        }

        console.error('Geocoding: exhausted retries due to 429');
        return [];
    }

    /**
     * Bỏ dấu tiếng Việt (ví dụ: "Lê Duẩn" → "Le Duan").
     * Sử dụng NFD normalization + regex loại bỏ combining diacritical marks,
     * và xử lý thêm các ký tự đặc biệt tiếng Việt (đ → d, Đ → D).
     */
    private removeDiacritics(str: string): string {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')    // Bỏ combining marks
            .replace(/đ/g, 'd')                 // đ → d
            .replace(/Đ/g, 'D');                // Đ → D
    }

    /**
     * Phân tích địa chỉ Việt Nam thành các thành phần.
     * Ví dụ: "47 Lê Duẩn, Bến Nghé, Quận 1, Hồ Chí Minh"
     * → { street: "47 Le Duan", district: "Quan 1", city: "Ho Chi Minh" }
     */
    private parseVietnameseAddress(address: string): {
        street?: string;
        district?: string;
        city?: string;
    } {
        const parts = address.split(',').map(s => s.trim()).filter(Boolean);

        if (parts.length === 0) return {};

        // Thành phố thường ở cuối cùng
        const cityKeywords = [
            'hồ chí minh', 'ho chi minh', 'hà nội', 'ha noi',
            'đà nẵng', 'da nang', 'hải phòng', 'hai phong',
            'cần thơ', 'can tho', 'tp', 'thành phố',
        ];

        let city: string | undefined;
        let street: string | undefined;
        const remaining: string[] = [];

        for (let i = parts.length - 1; i >= 0; i--) {
            const lower = parts[i].toLowerCase();
            if (!city && cityKeywords.some(kw => lower.includes(kw))) {
                city = parts[i];
            } else {
                remaining.unshift(parts[i]);
            }
        }

        // Phần đầu tiên là đường
        if (remaining.length > 0) {
            street = remaining[0];
        }

        // Tìm quận / huyện
        let district: string | undefined;
        for (const part of remaining.slice(1)) {
            const lower = part.toLowerCase();
            if (lower.startsWith('quận') || lower.startsWith('quan') ||
                lower.startsWith('huyện') || lower.startsWith('huyen') ||
                lower.startsWith('q.') || lower.startsWith('q ')) {
                district = part;
                break;
            }
        }

        return { street, district, city };
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
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: string,
    ) {
        return this.propertiesService.findAll({
            search, listingTypeId, minPrice, maxPrice,
            cityId, districtId, minArea, maxArea, bedrooms, bathrooms,
            page, limit, sortBy, sortOrder
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
