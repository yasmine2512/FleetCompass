import { Delete, Get,Param,Patch,Post, Controller,Body,UseGuards ,Req } from '@nestjs/common';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
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
    findAll(@Req() req: Request) {
        return this.fleetService.findAll(req.user!.id);
    }

    @Get('drivers')
    findAllDrivers(@Req() req: Request){
        return this.fleetService.findAllDrivers(req.user!.id);
    }

    @Post('drivers')
    CreateDriver(@Req() req: Request ,@Body("name") name : string){
        return this.fleetService.createDriver(name,req.user!.id);
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
