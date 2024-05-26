import { MigrationInterface, QueryRunner } from 'typeorm';
import UsersModel from '../models/Users.model';
import UserPreferencesModel from '../models/UserPreferences.model';


export class InsertUsersAndUserPreferences1716538631918 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		const dataSource = queryRunner.connection;
		const usersRepository = dataSource.getRepository(UsersModel);
		const preferencesRepository = dataSource.getRepository(UserPreferencesModel);

		const user = await usersRepository.create({
			fullName: 'Tester',
			email: 'tester@nomail.test',
			password: 'pass',
			phone: '000000000',
			docType: 'invalid',
			document: '00000000000',
			fu: 'SP',
		}).save();
		const preference = await preferencesRepository.create({
			user: user,
			imagePath: './generic.png',
			defaultTheme: 'DARK',
		}).save();
		user.preference = preference;
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// await queryRunner.query(``, []);
	}
}
