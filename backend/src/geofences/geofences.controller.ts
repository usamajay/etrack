import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { GeofencesService } from './geofences.service';
import { CreateGeofenceDto } from './dto/create-geofence.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('geofences')
@UseGuards(JwtAuthGuard)
export class GeofencesController {
    constructor(private readonly geofencesService: GeofencesService) { }

    @Post()
    create(@Body() createGeofenceDto: CreateGeofenceDto, @Request() req) {
        return this.geofencesService.create(createGeofenceDto, req.user);
    }

    @Get()
    findAll(@Request() req) {
        return this.geofencesService.findAll(req.user);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.geofencesService.findOne(id, req.user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.geofencesService.remove(id, req.user);
    }
}
