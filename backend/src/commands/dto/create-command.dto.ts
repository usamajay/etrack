import { IsEnum, IsOptional, IsObject, IsNumber } from 'class-validator';
import { CommandType } from '../../entities/Command.entity';

export class CreateCommandDto {
    @IsEnum(CommandType)
    type: CommandType;

    @IsOptional()
    @IsObject()
    parameters?: Record<string, any>;
}

export class CommandResponseDto {
    id: string;
    type: CommandType;
    status: string;
    created_at: Date;
    device_id: number;
}
