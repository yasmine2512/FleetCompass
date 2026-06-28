import { IsNumber, IsDateString, IsDate,IsOptional, IsString} from 'class-validator';
export class CreateFleetDto {
  @IsNumber()
  driverId!: number;
  @IsString()
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
