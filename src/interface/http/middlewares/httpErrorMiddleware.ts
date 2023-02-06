import { Request, Response, NextFunction } from 'express';
import { ErrorInterface } from 'src/types/_errorInterface';
import { ContainerInterface } from 'src/container';


export default ({
	httpConstants,
	logger,
	configs,
}: ContainerInterface) => (error: ErrorInterface, request: Request, response: Response, next: NextFunction) => {
	logger.error(error);
	const hasTrace = configs?.application?.stackErrorVisible;

	const options = hasTrace ? { stack: error.stack } : '';

	const statusCode = error?.statusCode || httpConstants.status.INTERNAL_SERVER_ERROR;

	const errorCustom = {
		message: error.message,
		statusCode,
		details: error.details || [],
	};
	return response.status(statusCode).json(Object.assign(errorCustom, options));
};
