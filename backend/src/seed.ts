import { UsersService } from './users/users.service';
import { UserRole } from './users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from './users/entities/user.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(app: any) {
    const usersService = app.get(UsersService);

    // Get the DataSource correctly from NestJS
    const dataSource: DataSource = app.get(getDataSourceToken());
    const userRepository: Repository<User> = dataSource.getRepository(User);

    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    // Check if this specific admin email exists
    const existingAdmin = await usersService.findOneByEmail(adminEmail);
    if (existingAdmin) {
        console.log('Admin admin@example.com already exists. Skipping seed.');
        return;
    }

    // Check if ANY admin exists
    const adminCount = await userRepository.count({ where: { role: UserRole.ADMIN } });
    if (adminCount > 0) {
        console.log(`Found ${adminCount} admin(s) in database. Skipping seed.`);
        console.log('If you want to login as admin, check existing admin accounts in the database.');

        // Find and display existing admin emails
        const admins = await userRepository.find({ where: { role: UserRole.ADMIN }, select: ['email'] });
        console.log('Existing admin emails:', admins.map(a => a.email).join(', '));
        return;
    }

    // No admin exists, create one directly (bypass service check)
    console.log('No admin found. Creating default admin...');
    try {
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        const admin = userRepository.create({
            email: adminEmail,
            passwordHash,
            fullName: 'System Admin',
            role: UserRole.ADMIN,
            phone: '0000000000',
            isActive: true,
        });
        await userRepository.save(admin);

        console.log('Default admin created successfully.');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
    } catch (error) {
        console.error('Failed to create admin:', error.message);
    }
}

