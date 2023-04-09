import Joi from 'joi';
import themesEnum from 'src/domain/enums/themesEnum';


export default () =>
	Joi.object().keys({
		body: Joi.object().keys({
			email: Joi.string().email().max(70).required(),
			password: Joi.string().min(8).max(60).required(),
			fullName: Joi.string().trim().max(100).required(),
			phone: Joi.string().empty('').max(16).trim(),
			docType: Joi.string().empty('').max(10).trim(),
			document: Joi.string().empty('').max(18).trim(),
			fu: Joi.string().empty('').trim().min(2).max(2),
			imagePath: Joi.string().empty('').max(255).trim(),
			defaultTheme: Joi.string().valid(...themesEnum.keys()).max(20),
		}),
	});
