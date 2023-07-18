import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import SqsClient from '@infra/integration/aws/SqsClient';
import LoggerGenerator from '@infra/logging/LoggerGenerator';
import { ConfigsInterface } from '@configs/configs';


@Injectable()
export default class EventsQueueProducer {
	private readonly logger: Logger;
	private readonly credentials: {
		queueName: string,
		queueUrl: string,
	};

	constructor(
		private readonly configService: ConfigService,
		private readonly sqsClient: SqsClient,
		private readonly loggerGenerator: LoggerGenerator,
	) {
		this.logger = this.loggerGenerator.getLogger();
		const { queueName, queueUrl }: ConfigsInterface['integration']['aws']['sqs']['eventsQueue'] = this.configService.get<any>('integration.aws.sqs.eventsQueue');
		this.credentials = {
			queueName: queueName || 'eventsQueue.fifo',
			queueUrl: queueUrl || 'http://localhost:4566/000000000000/eventsQueue.fifo',
		};
	}

	private _buildMessageBody({ event, schema }: { event: any, schema: string | null | undefined }) {
		return {
			id: uuidV4(),
			schema: schema || 'EVENTS',
			schemaVersion: 1.0,
			payload: event,
			source: 'BOILERPLATE',
			timestamp: new Date(),
		};
	}

	public async dispatch({ event, schema, author, title }: { event: any, schema?: string, author: string, title?: string }): Promise<string | null> {
		const message = this._buildMessageBody({ event, schema });

		try {
			const messageId = await this.sqsClient.sendMessage(
				this.credentials.queueUrl,
				title || 'new event',
				author,
				message,
			);
			this.logger.info(`Sended message to queue [${this.credentials.queueName}]`);
			return messageId;
		} catch (error) {
			this.logger.error(`Error to send message to queue [${this.credentials.queueName}]: ${error}`);
			return null;
		}
	}
}
