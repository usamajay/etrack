import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User.entity';

@Entity('api_keys')
export class ApiKey {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @ManyToOne(() => User, (user) => user.api_keys, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ unique: true })
    key_hash: string;

    @Column()
    name: string;

    @Column({ type: 'jsonb', default: { read: true, write: false } })
    permissions: Record<string, boolean>;

    // Usage tracking
    @Column({ nullable: true })
    last_used_at: Date;

    @Column({ default: 0 })
    usage_count: number;

    // Expiration
    @Column({ nullable: true })
    expires_at: Date;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
