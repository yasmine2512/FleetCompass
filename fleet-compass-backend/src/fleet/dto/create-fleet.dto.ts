import { IsNumber, IsDateString, IsDate } from 'class-validator';
export class CreateFleetDto {
    @IsNumber()
    driverId! : number;
    @IsNumber()
    latitude! : number;
    @IsNumber()
    longitude! : number;
    @IsNumber()
    startLatitude!: number;
    @IsNumber()
    startLongitude!: number;
    @IsNumber()
    destLatitude!: number;
    @IsNumber()
    destLongitude!: number;
    @IsDate()
    timestamp! : Date;
}
