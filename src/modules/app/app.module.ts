import { Module, Global } from '@nestjs/common';
import UserStrategy from '@modules/app/strategies/UserStrategy';
import UserOperation from '@modules/app/operations/UserOperation';
import UserService from '@modules/app/services/UserService';
import UserPreferenceService from '@modules/app/services/UserPreferenceService';
import UserRepository from '@modules/app/infra/repositories/user/UserRepository';
import UserPreferenceRepository from '@modules/app/infra/repositories/userPreference/UserPreferenceRepository';


@Global()
@Module({
	providers: [
		UserStrategy,
		UserOperation,
		UserService,
		UserPreferenceService,
		UserRepository,
		UserPreferenceRepository,
	],
	exports: [
		UserOperation,
		UserService,
		UserPreferenceService,
	],
})
export default class AppModule { }
