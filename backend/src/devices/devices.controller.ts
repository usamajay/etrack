import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('devices')
export class DevicesController {
    constructor(private readonly devicesService: DevicesService) { }

    @Post()
    create(@Body() createDeviceDto: any, @Request() req) {
        return this.devicesService.create(createDeviceDto, req.user.userId);
    }

    @Get()
    findAll(@Request() req) {
        return this.devicesService.findAll(req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.devicesService.findOne(+id, req.user.userId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDeviceDto: any, @Request() req) {
        return this.devicesService.update(+id, updateDeviceDto, req.user.userId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.devicesService.remove(+id, req.user.userId);
    }
}
