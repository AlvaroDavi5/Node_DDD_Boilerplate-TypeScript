import { Provider, Scope } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import { Logger } from 'winston';
import { config as DBConfig } from './db.config';
import { LOGGER_PROVIDER, LoggerProviderInterface } from '@core/logging/Logger.provider';
import { LoggerInterface } from '@core/logging/logger';


/* connecting to a database */
/* passing Parameters separately (other dialects) */
export const connection = new Sequelize(DBConfig);
/* passing a connection URI - example for postgres */
// const connection = new Sequelize('postgres://user:pass@example.com:5432/dbname')

export async function testConnection(connection: Sequelize, logger?: Logger | LoggerInterface | Console): Promise<boolean> {
	try {
		await connection.authenticate({
			logging: false,
		});
		logger?.info('Database connection has been established successfully');
		return true;
	}
	catch (error) {
		logger?.warn('Unable to connect to the database:');
		logger?.error(error);
		return false;
	}
}

export async function syncConnection(connection: Sequelize, logger?: Logger | LoggerInterface | Console): Promise<void> {
	try {
		await connection.sync({ force: false, logging: false }).then(
			(value: Sequelize) => {
				logger?.debug(`Database synced: ${value.config.database}`);
			}
		);
	}
	catch (error) {
		logger?.error(error);
	}
}

export const DATABASE_CONNECTION_PROVIDER = Symbol('DatabaseConnectionProvider');

const databaseConnectionProvider: Provider = {
	provide: DATABASE_CONNECTION_PROVIDER,
	scope: Scope.DEFAULT,

	inject: [
		LOGGER_PROVIDER,
	],
	useFactory: async (
		loggerProvider: LoggerProviderInterface,
		...args: any[]
	): Promise<Sequelize> => {
		const connection = new Sequelize(DBConfig);

		await syncConnection(connection, loggerProvider.getLogger('DatabaseConnectionProvider'));

		return connection;
	},
	/*
			? Provider Use Options
		* useClass
		* useFactory
		* useValue
		* useExisting
	*/

	durable: false,
};

export default databaseConnectionProvider;
