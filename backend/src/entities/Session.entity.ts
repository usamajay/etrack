import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User.entity';

@Entity('sessions')
export class Session {
    @PrimaryColumn()
    id: string;

    @Column()
    user_id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ unique: true })
    token_hash: string;

    @Column({ type: 'inet', nullable: true })
    ip_address: string;

    @Column({ type: 'text', nullable: true })
    user_agent: string;

    @Column()
    @Index()
    expires_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
