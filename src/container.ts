// // libs import
import {
	createContainer, InjectionMode,
	asClass, asFunction, asValue,
} from 'awilix';

// TODO: load all main modules
import Application from 'src/app/Application';
import syncCron from 'src/infra/cron/syncCron';
import eventsQueueConsumer from 'src/infra/integration/queues/consumers/eventsQueueConsumer';
import eventsQueueProducer from 'src/infra/integration/queues/producers/eventsQueueProducer';
import HttpServer from 'src/interface/http/server/httpServer';
import RestServer from 'src/interface/http/server/restServer';
import Router from 'src/interface/http/routers/router';
import SqsClient from 'src/infra/integration/aws/SqsClient';
import SnsClient from 'src/infra/integration/aws/SnsClient';
import S3Client from 'src/infra/integration/aws/S3Client';
import CognitoClient from 'src/infra/integration/aws/CognitoClient';
import RestClient from 'src/infra/integration/rest/RestClient';
import UserRepository from 'src/infra/repositories/user/UserRepository';
import UserPreferenceRepository from 'src/infra/repositories/userPreference/UserPreferenceRepository';
import configs from 'configs/configs';
import WebSocketServer from 'src/interface/webSocket/server/Server';
import socketEventsRegister from 'src/interface/webSocket/events/socketEventsRegister';
import WebSocketClient from 'src/interface/webSocket/client/Client';
import RedisClient from 'src/infra/cache/redisClient';
import logger, { LoggerStream } from 'src/infra/logging/logger';
import Exceptions from 'src/infra/errors/exceptions';


// ! container creation
const container = createContainer({
	injectionMode: InjectionMode.PROXY,
});

/**
 @asClass - register a class
 @asFunction - register a function
 @asValue - register a value
**/
container
	.register({
		// ? modules manual register
		application: asClass(Application).singleton(),
		configs: asValue(configs),
		httpServer: asClass(HttpServer).singleton(),
		restServer: asClass(RestServer).singleton(),
		router: asFunction(Router).singleton(),
		webSocketServer: asClass(WebSocketServer).singleton(),
		socketEventsRegister: asFunction(socketEventsRegister).singleton(),
		webSocketClient: asClass(WebSocketClient).singleton(),
		redisClient: asClass(RedisClient).singleton(),
		syncCron: asFunction(syncCron).singleton(),
		eventsQueueConsumer: asFunction(eventsQueueConsumer).singleton(),
		eventsQueueProducer: asClass(eventsQueueProducer).singleton(),
		sqsClient: asClass(SqsClient).singleton(),
		snsClient: asClass(SnsClient).singleton(),
		s3Client: asClass(S3Client).singleton(),
		cognitoClient: asClass(CognitoClient).singleton(),
		restClient: asClass(RestClient).singleton(),
		userRepository: asClass(UserRepository).singleton(),
		userPreferenceRepository: asClass(UserPreferenceRepository).singleton(),
		logger: asValue(logger),
		loggerStream: asClass(LoggerStream).singleton(),
		exceptions: asFunction(Exceptions).singleton(),
		container: asValue(container),
	})
	// * modules dynamic load
	.loadModules(
		[
			'src/app/helpers/**/*.ts',
			'src/app/mappers/**/*.ts',
			'src/app/operations/**/*.ts',
			'src/app/services/**/*.ts',
			'src/app/strategies/**/*.ts',
			'src/infra/integration/queues/handlers/**/*.ts',
			'src/infra/integration/queues/helpers/**/*.ts',
			'src/infra/providers/**/*.ts',
			'src/infra/security/**/*.ts',
			'src/interface/http/constants/**/*.ts',
			'src/interface/http/controllers/**/*.ts',
			'src/interface/http/middlewares/**/*.ts',
			'src/interface/http/schemas/**/*.ts',
			'src/interface/queue/schemas/**/*.ts',
			'src/interface/webSocket/helpers/**/*.ts',
			'src/interface/webSocket/events/**/*.ts',
			'src/interface/websocket/schemas/**/*.ts',
		],
		{
			formatName: 'camelCase',
			resolverOptions: {
				injectionMode: InjectionMode.PROXY,
			}
		},
	);

export default container;
