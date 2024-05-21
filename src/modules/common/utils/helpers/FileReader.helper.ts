import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync, createReadStream, ReadStream } from 'fs';
import { join } from 'path';
import LoggerService from '@core/logging/Logger.service';
import DataParserHelper from './DataParser.helper';


@Injectable()
export default class FileReaderHelper {
	private readonly logger: LoggerService;

	constructor(
		private readonly configService: ConfigService,
		private readonly dataParserHelper: DataParserHelper,
	) {
		this.logger = new LoggerService(FileReaderHelper.name, this.configService, this.dataParserHelper);
		this.logger.setContextName(FileReaderHelper.name);
	}

	public readFile(filePath: string, encoding?: BufferEncoding): string | undefined {
		let content: string | undefined = undefined;

		try {
			content = readFileSync(join(process.cwd(), filePath), { encoding: encoding ?? 'utf8' });
		} catch (error) {
			this.logger.warn('File read error:', error);
		}

		return content;
	}

	public readStream(filePath: string, encoding?: BufferEncoding): ReadStream | undefined {
		let readStream: ReadStream | undefined = undefined;

		try {
			readStream = createReadStream(join(process.cwd(), filePath), { encoding: encoding ?? 'utf8' });
		} catch (error) {
			this.logger.warn('File read stream error:', error);
		}

		return readStream;
	}
}
