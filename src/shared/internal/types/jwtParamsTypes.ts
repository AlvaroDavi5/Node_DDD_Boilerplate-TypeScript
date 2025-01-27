import { JwtPayload } from 'jsonwebtoken';


type Unit =
	'Years' | 'Year' | 'Yrs' | 'Yr' | 'Y' |
	'Weeks' | 'Week' | 'W' |
	'Days' | 'Day' | 'D' |
	'Hours' | 'Hour' | 'Hrs' | 'Hr' | 'H' |
	'Minutes' | 'Minute' | 'Mins' | 'Min' | 'M' |
	'Seconds' | 'Second' | 'Secs' | 'Sec' | 's' |
	'Milliseconds' | 'Millisecond' | 'Msecs' | 'Msec' | 'Ms';
type jwtExpirationUnity = Unit | Uppercase<Unit> | Lowercase<Unit>;
type jwtStringValue = | `${number}` | `${number}${jwtExpirationUnity}` | `${number} ${jwtExpirationUnity}`;
export type jwtExpirationType = jwtStringValue | number;

export type jwtEncode<ET extends object = object> = ET | string | Buffer;

export type jwtDecode<DT extends object = object> = (DT & JwtPayload) | string;
