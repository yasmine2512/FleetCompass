import { IsIn } from 'class-validator';

export class UpdateTripStatusDto {
  @IsIn(['active', 'completed', 'cancelled'])
  status!: string;
}