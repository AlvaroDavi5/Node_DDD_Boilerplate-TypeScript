import { Injectable } from '@nestjs/common';
import UserEntity from '@modules/boilerplate/domain/entities/User';
import UserPreferenceEntity from '@modules/boilerplate/domain/entities/UserPreference';
import UserService from '@modules/boilerplate/app/services/UserService';
import UserPreferenceService from '@modules/boilerplate/app/services/UserPreferenceService';
import UserStrategy from '@modules/boilerplate/app/strategies/UserStrategy';
import Exceptions from '@infra/errors/exceptions';
import { userAuthType } from 'src/types/_userAuthInterface';


@Injectable()
export default class UserOperation {
	constructor(
		private readonly userService: UserService,
		private readonly userPreferenceService: UserPreferenceService,
		private readonly userStrategy: UserStrategy,
		private readonly exceptions: Exceptions,
	) { }

	async listUsers(data: any): Promise<any> {
		const usersList = await this.userService.list(data);
		return usersList;
	}

	async createUser(data: any, userAgent?: userAuthType): Promise<any> {
		if (!userAgent?.username)
			throw this.exceptions.unauthorized({
				message: 'Invalid userAgent'
			});

		const newUser = new UserEntity(data);
		const createdUser = await this.userService.create(newUser);

		const newPreference = new UserPreferenceEntity(data);
		if (createdUser?.getId()) {
			newPreference.setUserId(createdUser.getId());
			await this.userPreferenceService.create(newPreference);
		}

		const result = await this.userService.getById(createdUser?.getId() || 0);
		return result;
	}

	async getUser(id: number, userAgent?: userAuthType): Promise<any> {
		if (!userAgent?.username)
			throw this.exceptions.unauthorized({
				message: 'Invalid userAgent'
			});

		const foundedUser = await this.userService.getById(id);
		const foundedPreference = await this.userPreferenceService.getByUserId(id);

		if (!foundedUser)
			throw this.exceptions.conflict({
				message: 'User not found!'
			});

		if (foundedPreference)
			foundedUser.setPreference(foundedPreference);

		return foundedUser;
	}

	async updateUser(id: number, data: any, userAgent?: userAuthType): Promise<any> {
		if (!userAgent?.username)
			throw this.exceptions.unauthorized({
				message: 'Invalid userAgent'
			});

		const user = await this.userService.getById(id);
		const preference = await this.userPreferenceService.getByUserId(id);

		if (!user || !preference)
			throw this.exceptions.contract({
				message: 'User or preference not found!'
			});

		const isAllowedToUpdateUser = this.userStrategy.manageAuth(user, userAgent);
		if (!isAllowedToUpdateUser)
			throw this.exceptions.unauthorized({
				message: 'userAgent not allowed to execute this action'
			});

		const updatedPreference = await this.userPreferenceService.update(preference.getId(), data);
		const updatedUser = await this.userService.update(user.getId(), data);
		if (updatedPreference)
			updatedUser?.setPreference(updatedPreference);

		return updatedUser;
	}

	async deleteUser(id: number, userAgent?: userAuthType): Promise<any> {
		if (!userAgent?.username)
			throw this.exceptions.unauthorized({
				message: 'Invalid userAgent'
			});

		const user = await this.userService.getById(id);
		const preference = await this.userPreferenceService.getByUserId(id);

		if (!user || !preference)
			throw this.exceptions.conflict({
				message: 'User or preference not found!'
			});

		await this.userPreferenceService.delete(preference.getId(), {
			softDelete: true,
		});
		const updatedUser = await this.userService.delete(user.getId(), {
			softDelete: true,
			userAgentId: userAgent.username,
		});

		return updatedUser;
	}
}
