import { IsNumber, IsDateString, IsDate, isString ,IsOptional} from 'class-validator';
export class CreateFleetDto {
  @IsNumber()
  driverId!: number;
  
  orderName!: string;
  @IsNumber()
  startLatitude!: number;
  @IsNumber()
  startLongitude!: number;
  @IsNumber()
  destLatitude!: number;
  @IsNumber()
  destLongitude!: number;
  @IsDate()
  @IsOptional()
  started_at?: Date;
}
