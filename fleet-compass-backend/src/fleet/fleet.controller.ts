import { Delete, Get,Param,Patch,Post } from '@nestjs/common';
import { Controller,Body } from '@nestjs/common';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { FleetService } from './fleet.service';
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
    findAll() {
        return this.fleetService.findAll();
    }

    @Get(':id')
    findOne(@Body() id: number) {
        return this.fleetService.findOne(id);
    }

    @Patch(':id')
    update(@Body() updateFleetDto: UpdateFleetDto) {
        return this.fleetService.update(updateFleetDto.id, updateFleetDto);
    }

    @Delete(':id')
    remove(@Body() id: number) {
        return this.fleetService.remove(id);
    }

}
