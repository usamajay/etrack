import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Device } from './Device.entity';
import { User } from './User.entity';

export enum CommandType {
    ENGINE_CUT = 'engine_cut',
    ENGINE_RESUME = 'engine_resume',
    REQUEST_LOCATION = 'request_location',
    SET_SPEED_LIMIT = 'set_speed_limit',
    REBOOT = 'reboot',
    CUSTOM = 'custom',
}

export enum CommandStatus {
    PENDING = 'pending',
    SENT = 'sent',
    ACKNOWLEDGED = 'acknowledged',
    FAILED = 'failed',
    EXPIRED = 'expired',
}

@Entity('commands')
@Index(['device', 'status'])
@Index(['created_at'])
export class Command {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: CommandType,
    })
    type: CommandType;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    device: Device;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column({
        type: 'enum',
        enum: CommandStatus,
        default: CommandStatus.PENDING,
    })
    status: CommandStatus;

    @Column({ type: 'jsonb', default: {} })
    parameters: Record<string, any>;

    @Column({ nullable: true })
    sent_at: Date;

    @Column({ nullable: true })
    acknowledged_at: Date;

    @Column({ nullable: true })
    expires_at: Date;

    @Column({ nullable: true })
    error_message: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
