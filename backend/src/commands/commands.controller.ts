import { Controller, Post, Get, Param, Body, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommandsService } from './commands.service';
import { CreateCommandDto } from './dto/create-command.dto';

@Controller('commands')
@UseGuards(JwtAuthGuard)
export class CommandsController {
    constructor(private commandsService: CommandsService) { }

    @Post('device/:deviceId')
    async createCommand(
        @Param('deviceId', ParseIntPipe) deviceId: number,
        @Body() createCommandDto: CreateCommandDto,
        @Request() req: any,
    ) {
        const command = await this.commandsService.createCommand(
            createCommandDto.type,
            deviceId,
            req.user,
            createCommandDto.parameters,
        );

        return {
            id: command.id,
            type: command.type,
            status: command.status,
            created_at: command.created_at,
        };
    }

    @Get('device/:deviceId')
    async getCommandHistory(@Param('deviceId', ParseIntPipe) deviceId: number) {
        return this.commandsService.getCommandHistory(deviceId);
    }

    @Get(':id')
    async getCommand(@Param('id') id: string) {
        return this.commandsService.getCommand(id);
    }
}
