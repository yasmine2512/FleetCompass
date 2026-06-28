import { Delete, Get,Param,Patch,Post, Controller,Body,UseGuards ,Req } from '@nestjs/common';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { FleetService } from './fleet.service';
import { UpdateTripStatusDto } from './dto/update-fleet-status.dto';
import { AuthService } from 'src/user/auth.service';
import type { Request } from 'express';

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
    findAll(@Req() req: Request) {
        return this.fleetService.findAll(req.user!.id);
    }

    @Get('drivers')
    findAllDrivers(@Req() req: Request){
        return this.fleetService.findAllDrivers(req.user!.id);
    }

    @Get('drivers/:id')
    @UseGuards(AuthService)
    findOneDriver(@Param('id') id:string,@Req() req: Request){
        return this.fleetService.findOneDriver(+id,req.user!.id);
    }

    @Get('active')
    getActiveDrivers(@Req() req: Request){
        return this.fleetService.findActiveFleet(req.user!.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string,@Req() req: Request) {
        return this.fleetService.findOne(+id,req.user!.id);
    }

    @Patch(':id/status')
    update( @Param('id') id: string,@Body() dto: UpdateTripStatusDto,) {
        return this.fleetService.update(+id,dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.fleetService.remove(+id);
    }

}
