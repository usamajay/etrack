import { IsString, IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';
import type { Geometry } from 'geojson';

export class CreateGeofenceDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(['circle', 'polygon'])
    type: 'circle' | 'polygon';

    @IsObject()
    @IsOptional()
    area?: Geometry;

    @IsNumber()
    @IsOptional()
    radius?: number;

    @IsObject()
    @IsOptional()
    center?: Geometry;
}
