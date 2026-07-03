import { Delete, Get,Param,Patch,Post, Controller,Body,UseGuards ,Req,Query } from '@nestjs/common';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { FleetService } from './fleet.service';
import { UpdateTripStatusDto } from './dto/update-fleet-status.dto';
import { AuthGuard } from 'src/user/auth.guard';
import type { Request } from 'express';

@UseGuards(AuthGuard)
@Controller('fleets')
export class FleetController {
 constructor(private readonly fleetService: FleetService) {}
    @Get('test')
    async test() {
        return this.fleetService.getRoute([
            [-74.0060, 40.7128],
            [-73.9851, 40.7589],
        ]);
    }

    @Get()
    findAll(@Req() req: Request,@Query('page') page?: string,
  @Query('limit') limit?: string,@Query('status') status?: string) {
        return this.fleetService.findAll(req.user!.id,page ? 
        parseInt(page, 10) : 1,limit ? parseInt(limit, 10) : 7,status);
    }

    @Get('drivers')
    findAllDrivers(@Req() req: Request){
        return this.fleetService.findAllDrivers(req.user!.id);
    }

    @Post('drivers')
    CreateDriver(@Req() req: Request ,@Body() dto: CreateDriverDto){
        return this.fleetService.createDriver(dto.name,dto.phone,req.user!.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string,@Req() req: Request) {
        return this.fleetService.findOne(+id,req.user!.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string,@Req() req: Request) {
        return this.fleetService.remove(+id,req.user!.id);
    }
    @Delete('drivers/:id')
    removeDriver(@Param('id') id: string,@Req() req: Request) {
        return this.fleetService.removeDriver(+id,req.user!.id);
    }

}
