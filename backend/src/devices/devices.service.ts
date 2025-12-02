import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/Device.entity';

@Injectable()
export class DevicesService {
    private readonly logger = new Logger(DevicesService.name);

    constructor(
        @InjectRepository(Device)
        private devicesRepository: Repository<Device>,
    ) { }

    async create(createDeviceDto: any, userId: number): Promise<Device> {
        const device = this.devicesRepository.create({
            ...createDeviceDto,
            user_id: userId,
        });
        this.logger.log(`Creating device: ${JSON.stringify(device)}`);
        try {
            const saved = await this.devicesRepository.save(device);
            this.logger.log(`Saved device: ${JSON.stringify(saved)}`);
            return saved as unknown as Device;
        } catch (err) {
            this.logger.error(`Error saving device: ${err.message}`, err.stack);
            throw err;
        }
    }

    async findAll(userId: number): Promise<Device[]> {
        return this.devicesRepository.find({ where: { user_id: userId } });
    }

    async findOne(id: number, userId: number): Promise<Device> {
        const device = await this.devicesRepository.findOne({ where: { id, user_id: userId } });
        if (!device) {
            throw new NotFoundException(`Device with ID ${id} not found`);
        }
        return device;
    }

    async update(id: number, updateDeviceDto: any, userId: number): Promise<Device> {
        const device = await this.findOne(id, userId);
        Object.assign(device, updateDeviceDto);
        return this.devicesRepository.save(device);
    }

    async remove(id: number, userId: number): Promise<void> {
        const device = await this.findOne(id, userId);
        await this.devicesRepository.remove(device);
    }
}
