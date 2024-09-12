import { Catch, ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import LoggerService from '@core/logging/Logger.service';
import { ConfigsInterface } from '@core/configs/envs.config';
import DataParserHelper from '@common/utils/helpers/DataParser.helper';
import { ExceptionsEnum } from '@common/enums/exceptions.enum';
import externalErrorParser from '@common/utils/externalErrorParser.util';
import { getObjValues, isNullOrUndefined } from '@common/utils/dataValidations.util';
import { ErrorInterface } from '@shared/internal/interfaces/errorInterface';
import { RequestInterface, ResponseInterface } from '@shared/internal/interfaces/endpointInterface';

type errorResponseType = ErrorInterface & { description?: string };

@Catch(HttpException, AxiosError, Error)
export default class KnownExceptionFilter implements ExceptionFilter<HttpException | AxiosError | Error> {
	private readonly showStack: boolean;
	private readonly knownExceptions: string[];

	constructor(
		private readonly logger: LoggerService,
		private readonly configService: ConfigService,
		private readonly dataParserHelper: DataParserHelper,
	) {
		this.logger.setContextName(KnownExceptionFilter.name);

		this.knownExceptions = getObjValues<ExceptionsEnum>(ExceptionsEnum).map((exc) => exc.toString());

		const appConfigs = this.configService.get<ConfigsInterface['application']>('application')!;
		this.showStack = appConfigs.showDetailedLogs;
	}

	public catch(exception: HttpException | AxiosError | Error, host: ArgumentsHost) {
		const context = host.switchToHttp();
		const request = context.getRequest<RequestInterface>();
		const response = context.getResponse<ResponseInterface>();

		if (request.id)
			this.logger.setRequestId(request.id);
		this.logger.error(exception);

		let status: number;
		let errorResponse: errorResponseType = {
			name: exception.name,
			message: exception.message,
			stack: this.showStack ? exception.stack : undefined,
		};

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse();

			if (this.knownExceptions.includes(exception.name)) {
				if (typeof exceptionResponse === 'object' && !isNullOrUndefined(exceptionResponse)) {
					const { description, details } = exceptionResponse as errorResponseType;
					errorResponse.description = description;
					errorResponse.details = details;
				} else {
					const strData = this.dataParserHelper.toString(exceptionResponse);
					errorResponse.details = strData;
				}
			} else {
				errorResponse = exceptionResponse as errorResponseType;
			}

			errorResponse.cause = exception.cause;
		} else {
			const error = externalErrorParser(exception);
			status = error.getStatus();

			errorResponse.description = (error.getResponse() as errorResponseType).description ?? errorResponse.description;
			errorResponse.details = (error.getResponse() as errorResponseType).details ?? errorResponse.details;
			errorResponse.cause = error.cause;
		}

		response
			.status(status)
			.json(errorResponse);
	}
}
