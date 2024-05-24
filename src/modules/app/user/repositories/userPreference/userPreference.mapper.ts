import UserPreferenceEntity from '@domain/entities/UserPreference.entity';
import UserPreferencesModel from '@core/infra/database/models/UserPreferences.model';


const toDomainEntity = (dataValues: UserPreferencesModel): UserPreferenceEntity => {
	return new UserPreferenceEntity(dataValues);
};

const toDatabaseEntity = (entity: UserPreferenceEntity): any => {
	if (!(entity.validate().valid))
		return null;

	const { id, ...userPreferenceAttributes } = entity.getAttributes();

	return userPreferenceAttributes;
};

export default {
	toDomainEntity,
	toDatabaseEntity,
};
