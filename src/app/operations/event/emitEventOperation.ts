import webSocketEventsEnum from 'src/domain/enums/webSocketEventsEnum';
import { ContainerInterface } from 'src/types/_containerInterface';


export default ({
	webSocketClient,
	logger,
}: ContainerInterface) => ({
	execute: (msg: any): any => {
		logger.info('Emiting event');
		webSocketClient.send(webSocketEventsEnum.EMIT_PRIVATE, msg);

		return true;
	}
});
