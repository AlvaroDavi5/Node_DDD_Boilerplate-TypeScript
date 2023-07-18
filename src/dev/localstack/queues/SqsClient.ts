import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { AWSError } from 'aws-sdk';
import {
	SQSClient, SQSClientConfig, Message,
	ListQueuesCommand, CreateQueueCommand, DeleteQueueCommand,
	SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand,
	CreateQueueCommandInput, SendMessageCommandInput, ReceiveMessageCommandInput, DeleteMessageCommandInput,
} from '@aws-sdk/client-sqs';
import { ConfigsInterface } from '@configs/configs';
import LoggerGenerator from '@infra/logging/LoggerGenerator';
import DataParserHelper from '@modules/utils/helpers/DataParserHelper';


@Injectable()
export default class SqsClient {
	private readonly awsConfig: SQSClientConfig;
	private readonly messageGroupId: string;
	private readonly sqs: SQSClient;
	private readonly logger: Logger;

	constructor({
		configs,
		logger,
	}: any) {
		this.logger = logger;
		const awsConfigs: ConfigsInterface['integration']['aws'] = configs.integration.aws;
		const logging: ConfigsInterface['application']['logging'] = configs.application.logging;
		const {
			region, sessionToken,
			accessKeyId, secretAccessKey,
		} = awsConfigs.credentials;
		const { endpoint, apiVersion } = awsConfigs.sqs;

		this.awsConfig = {
			endpoint,
			region,
			apiVersion,
			credentials: {
				accessKeyId: String(accessKeyId),
				secretAccessKey: String(secretAccessKey),
				sessionToken,
			},
			logger: logging === 'true' ? this.logger : undefined,
		};
		this.messageGroupId = 'DefaultGroup';
		this.sqs = new SQSClient(this.awsConfig);
	}


	private formatMessageBeforeSend(data: any = {}): string {
		let result = null;

		switch (typeof data) {
		case 'bigint':
			result = data.toString();
			break;
		case 'number':
			result = data.toString();
			break;
		case 'boolean':
			result = data.toString();
			break;
		case 'string':
			result = data;
			break;
		case 'object':
			try {
				result = JSON.stringify(data);
			} catch (error) {
				result = '';
				this.logger.warn('Object:String parse error');
			}
			break;
		case 'symbol':
			result = data.toString();
			break;
		default:
			result = '';
			break;
		}

		return result;
	}

	private createParams(queueName: string): CreateQueueCommandInput {
		const isFifoQueue: boolean = queueName?.includes('.fifo');

		const params: CreateQueueCommandInput = {
			QueueName: queueName,
			Attributes: {
				FifoQueue: String(isFifoQueue),
				DelaySeconds: '10', // Unused in FIFO queues
				MessageRetentionPeriod: '3600',
			}
		};

		return params;
	}

	private msgParams(queueUrl: string, message: any, title: string, author: string): SendMessageCommandInput {
		const isFifoQueue: boolean = queueUrl?.includes('.fifo');
		const messageBody = this.formatMessageBeforeSend(message);

		return {
			QueueUrl: queueUrl,
			MessageBody: messageBody,
			MessageAttributes: {
				title: {
					DataType: 'String',
					StringValue: String(title)
				},
				author: {
					DataType: 'String',
					StringValue: String(author)
				},
			},
			MessageDeduplicationId: isFifoQueue ? uuidV4() : undefined,
			MessageGroupId: isFifoQueue ? this.messageGroupId : undefined, // Required for FIFO queues
		};
	}

	private receiveParam(queueUrl: string): ReceiveMessageCommandInput {
		return {
			QueueUrl: queueUrl,
			AttributeNames: [
				'SentTimestamp'
			],
			MaxNumberOfMessages: 10,
			MessageAttributeNames: [
				'All'
			],
			VisibilityTimeout: 20,
			WaitTimeSeconds: 0,
		};
	}

	public getClient(): SQSClient {
		return this.sqs;
	}

	public async listQueues(): Promise<string[]> {
		let list: string[] = [];

		try {
			const result = await this.sqs.send(new ListQueuesCommand({
				MaxResults: 200,
			}));
			if (result?.QueueUrls)
				list = result.QueueUrls;
		} catch (error) {
			this.logger.error('List Error:', error);
		}

		return list;
	}

	public async createQueue(queueName: string): Promise<string> {
		let queueUrl = '';

		try {
			const result = await this.sqs.send(new CreateQueueCommand(
				this.createParams(queueName)
			));
			if (result?.QueueUrl)
				queueUrl = result.QueueUrl;
		} catch (error) {
			this.logger.error('Create Error:', error);
		}

		return queueUrl;
	}

	public async deleteQueue(queueUrl: string): Promise<boolean> {
		let isDeleted = false;

		try {
			const result = await this.sqs.send(new DeleteQueueCommand({
				QueueUrl: queueUrl,
			}));
			if (result.$metadata?.httpStatusCode && String(result.$metadata?.httpStatusCode)[2] === '2')
				isDeleted = true;
		} catch (error) {
			this.logger.error('Delete Error:', error);
		}

		return isDeleted;
	}

	public async sendMessage(queueUrl: string, title: string, author: string, message: any): Promise<string> {
		let messageId = '';

		try {
			const result = await this.sqs.send(new SendMessageCommand(
				this.msgParams(queueUrl, message, title, author)
			));
			if (result?.MessageId)
				messageId = result.MessageId;
		} catch (error) {
			this.logger.error('Send Error:', error);
		}

		return messageId;
	}

	public async getMessages(queueUrl: string): Promise<Array<Message>> {
		const messages: Array<Message> = [];

		try {
			const result = await this.sqs.send(new ReceiveMessageCommand(
				this.receiveParam(queueUrl)
			));
			if (result?.Messages) {
				for (const message of result?.Messages) {
					messages.push(message);

					const deleteParams: DeleteMessageCommandInput = {
						QueueUrl: queueUrl,
						ReceiptHandle: `${message?.ReceiptHandle}`,
					};
					this.sqs.send(new DeleteMessageCommand(
						deleteParams
					), (err: AWSError, data) => {
						if (err) {
							this.logger.error('Error to Delete Message:', err);
						}
						else {
							this.logger.info('Message Deleted:', { queueUrl, requestId: data?.$metadata?.requestId });
						}
					});
				}
			}
		} catch (error) {
			this.logger.error('Receive Error:', error);
		}

		return messages;
	}
}
