import { IsNumber, IsDateString, IsDate } from 'class-validator';
export class CreateFleetDto {
    @IsNumber()
    driverId! : number;
    @IsNumber()
    latitude! : number;
    @IsNumber()
    longitude! : number;
    @IsDate()
    timestamp! : Date;
}
