import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { RegisterEventHookInterface } from '@app/hook/api/schemas/registerEventHook.schema';
import { HttpMethodsEnum } from '@common/enums/httpMethods.enum';


export abstract class RegisterEventHookInputDto implements RegisterEventHookInterface {
	@ApiProperty({ type: String, example: 'http://localhost:4000/api/hook', default: '', nullable: false, required: true })
	@IsString()
	@IsNotEmpty()
	public responseEndpoint!: string;

	@ApiProperty({ type: HttpMethodsEnum, enum: Object.values(HttpMethodsEnum), example: HttpMethodsEnum.POST, default: HttpMethodsEnum.GET, nullable: false, required: true })
	@IsEnum(HttpMethodsEnum)
	@IsNotEmpty()
	public responseMethod!: HttpMethodsEnum;

	@ApiProperty({ type: String, example: 'INVALID', default: '', nullable: false, required: true })
	@IsString()
	@IsNotEmpty()
	public responseSchema!: string;
}
