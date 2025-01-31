import { User } from '@sentry/nestjs';


export interface ErrorInterface {
	name?: string,
	message: string,
	code?: string | number,
	details?: unknown,
	cause?: unknown,
	stack?: string,
}

export interface ExceptionMetadataInterface {
	data?: unknown,
	user?: User,
}
