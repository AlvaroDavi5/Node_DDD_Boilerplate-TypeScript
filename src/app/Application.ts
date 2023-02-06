import { config } from 'aws-sdk';
import HttpServer from 'src/interface/http/server/httpServer';
import WebSocketServer from 'src/interface/webSocket/server/Server';
import { Consumer } from 'sqs-consumer';
import { ScheduledTask } from 'node-cron';
import { Logger } from 'winston';
import { ConfigsInterface } from 'configs/configs';
import { ContainerInterface } from 'src/container';


export default class Application {
	private httpServer: HttpServer;
	private webSocketServer: WebSocketServer;
	private eventsQueueConsumer: Consumer;
	private syncCron: ScheduledTask;
	private logger: Logger;
	private configs: ConfigsInterface;
	private isSocketEnvEnabled: boolean;

	/**
	@param {Object} ctx - Dependency Injection (container)
	@param {import('configs/configs')} ctx.configs
	**/
	constructor({
		httpServer,
		webSocketServer,
		eventsQueueConsumer,
		syncCron,
		logger,
		configs,
	}: ContainerInterface) {
		this.httpServer = httpServer;
		this.webSocketServer = webSocketServer;
		this.eventsQueueConsumer = eventsQueueConsumer;
		this.syncCron = syncCron;
		this.logger = logger;
		this.configs = configs;
		this.isSocketEnvEnabled = configs?.application?.socketEnv === 'enabled';
	}

	startCrons() {
		this.syncCron.start();
		this.logger.info('Sync cron started');
	}

	startQueueConsumers() {
		this.eventsQueueConsumer.start();
		this.logger.info('Events queue consumer started');
	}

	async start() {
		// AWS Configs
		config.update({
			...this.configs?.integration?.aws?.credentials,
		});

		// Servers
		if (this.isSocketEnvEnabled) {
			this.webSocketServer.start();
		}
		this.httpServer.start();

		// Background Services
		this.startCrons();
		this.startQueueConsumers();
	}
}
