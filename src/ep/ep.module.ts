import { LoggerModule } from '@/logger/logger.module';
import { RecordSpacesModule } from '@/record-spaces/record-spaces.module';
import { RecordsModule } from '@/records/records.module';
import { Module } from '@nestjs/common';
import { EpController } from './ep.controller';
import { EpService } from './ep.service';

@Module({
    imports: [LoggerModule, RecordSpacesModule, RecordsModule],
    providers: [EpService],
    controllers: [EpController],
})
export class EpModule { }