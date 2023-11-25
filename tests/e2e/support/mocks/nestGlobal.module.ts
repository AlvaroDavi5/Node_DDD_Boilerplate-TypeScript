import dotenv from 'dotenv';
import compression from 'compression';
import {
	INestApplication, Module, NestModule,
	MiddlewareConsumer, ValidationPipe
} from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { SqsModule } from '@ssut/nestjs-sqs';
import configs, { ConfigsInterface } from '@core/configs/configs.config';
import LifecycleService from '@core/infra/start/Lifecycle.service';
import { ProcessEventsEnum, ProcessSignalsEnum } from '@core/infra/start/processEvents.enum';
import Exceptions from '@core/infra/errors/Exceptions';
import { ExceptionsEnum } from '@core/infra/errors/exceptions.enum';
import { ErrorInterface } from 'src/types/_errorInterface';
import LoggerGenerator from '@core/infra/logging/LoggerGenerator.logger';
import CryptographyService from '@core/infra/security/Cryptography.service';
import databaseConnectionProvider from '@core/infra/database/connection';
import RedisClient from '@core/infra/cache/Redis.client';
import MongoClient from '@core/infra/data/Mongo.client';
import SqsClient from '@core/infra/integration/aws/Sqs.client';
import SnsClient from '@core/infra/integration/aws/Sns.client';
import S3Client from '@core/infra/integration/aws/S3.client';
import CognitoClient from '@core/infra/integration/aws/Cognito.client';
import RestMockedServiceClient from '@core/infra/integration/rest/RestMockedService.client';
import SyncCronJob from '@core/infra/cron/jobs/SyncCron.job';
import SyncCronTask from '@core/infra/cron/tasks/SyncCron.task';
import RegExConstants from '@common/constants/Regex.constants';
import SchemaValidator from '@common/utils/validators/SchemaValidator.validator';
import DataParserHelper from '@common/utils/helpers/DataParser.helper';
import CacheAccessHelper from '@common/utils/helpers/CacheAccess.helper';
import FileReaderHelper from '@common/utils/helpers/FileReader.helper';
import UserStrategy from '@app/strategies/User.strategy';
import UserOperation from '@app/operations/User.operation';
import UserService from '@app/services/User.service';
import UserPreferenceService from '@app/services/UserPreference.service';
import SubscriptionService from '@app/services/Subscription.service';
import UserRepository from '@app/repositories/user/User.repository';
import UserPreferenceRepository from '@app/repositories/userPreference/UserPreference.repository';
import WebSocketServer from '@events/websocket/server/WebSocket.server';
import WebSocketClient from '@events/websocket/client/WebSocket.client';
import EventsQueueConsumer from '@events/queue/consumers/EventsQueue.consumer';
import EventsQueueProducer from '@events/queue/producers/EventsQueue.producer';
import EventsQueueHandler from '@events/queue/handlers/EventsQueue.handler';
import MockedSqsClient from 'src/dev/localstack/queues/SqsClient';
import HttpConstants from '@api/constants/Http.constants';
import ContentTypeConstants from '@api/constants/ContentType.constants';
import LoggerMiddleware from '@api/middlewares/Logger.middleware';
import JwtDecodeMiddleware from '@api/middlewares/JwtDecode.middleware';
import DefaultController from '@api/controllers/Default.controller';
import UserController from '@api/controllers/User.controller';
import SubscriptionsController from '@api/controllers/Subscriptions.controller';


@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configs],
		}),
		ScheduleModule.forRoot(),
		EventEmitterModule.forRoot({
			maxListeners: 10,
			verboseMemoryLeak: true,
		}),
		SqsModule.register({
			consumers: [
				{
					sqs: new MockedSqsClient({
						logger: console,
						configs: configs(),
					}).getClient(),
					name: process.env.AWS_SQS_EVENTS_QUEUE_NAME || 'eventsQueue.fifo',
					queueUrl: process.env.AWS_SQS_EVENTS_QUEUE_URL || 'http://localhost:4566/000000000000/eventsQueue.fifo',
					region: process.env.AWS_REGION || 'us-east-1',
					batchSize: 10,
					shouldDeleteMessages: false,
					handleMessageTimeout: 1000,
					waitTimeSeconds: 20,
				},
			],
			producers: [],
		}),
	],
	controllers: [
		DefaultController,
		UserController,
		SubscriptionsController,
	],
	providers: [
		// * core
		LifecycleService,
		Exceptions,
		LoggerGenerator,
		CryptographyService,
		databaseConnectionProvider,
		RedisClient,
		MongoClient,
		SqsClient,
		SnsClient,
		S3Client,
		CognitoClient,
		RestMockedServiceClient,
		SyncCronJob,
		SyncCronTask,
		// * common
		RegExConstants,
		SchemaValidator,
		DataParserHelper,
		CacheAccessHelper,
		FileReaderHelper,
		// * app
		UserStrategy,
		UserOperation,
		UserService,
		UserPreferenceService,
		SubscriptionService,
		UserRepository,
		UserPreferenceRepository,
		// * events
		EventsQueueConsumer,
		EventsQueueProducer,
		EventsQueueHandler,
		WebSocketServer,
		WebSocketClient,
		// * api
		HttpConstants,
		ContentTypeConstants,
	],
	exports: [],
})
export class TestModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(LoggerMiddleware)
			.forRoutes(DefaultController, UserController, SubscriptionsController)
			.apply(JwtDecodeMiddleware)
			.forRoutes(UserController, SubscriptionsController);
	}
}

export async function startNestApplication(nestApp: INestApplication<any>) {
	dotenv.config({ path: '.env.test' });

	nestApp.setGlobalPrefix('api');
	nestApp.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	nestApp.enableShutdownHooks();

	nestApp.use(compression());
	nestApp.enableCors({
		origin: '*',
		allowedHeaders: '*',
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
	});
	nestApp.useWebSocketAdapter(new IoAdapter(nestApp)); // WsAdapter

	const appConfigs = nestApp.get<ConfigService>(ConfigService).get<ConfigsInterface['application'] | undefined>('application');
	await nestApp.listen(Number(appConfigs?.port)).catch((error: ErrorInterface | Error) => {
		const knowExceptions = Object.values(ExceptionsEnum).map(exception => exception.toString());

		if (error?.name && !knowExceptions.includes(error.name)) {
			const err = new Error(String(error.message));
			err.name = error.name;
			err.stack = error.stack;
			throw err;
		}
	});

	process.on(ProcessEventsEnum.UNCAUGHT_EXCEPTION, async (error: Error, origin: string) => {
		console.error(`\nApp received ${origin}: ${error}\n`);
		await nestApp.close();
	});
	process.on(ProcessEventsEnum.UNHANDLED_REJECTION, async (reason: unknown, promise: Promise<unknown>) => {
		console.error(`\nApp received ${ProcessEventsEnum.UNHANDLED_REJECTION}: \npromise: ${promise} \nreason: ${reason}\n`);
		await nestApp.close();
	});
	process.on(ProcessEventsEnum.MULTIPLE_RESOLVES, async (type: 'resolve' | 'reject', promise: Promise<unknown>, value: unknown) => {
		console.error(`\nApp received ${ProcessEventsEnum.MULTIPLE_RESOLVES}: \ntype: ${type} \npromise: ${promise} \nreason: ${value}\n`);
		await nestApp.close();
	});

	Object.values(ProcessSignalsEnum).map((signal) => process.on(signal, async (signal) => {
		console.error(`\nApp received signal: ${signal}\n`);
		await nestApp.close();
	}));
}
