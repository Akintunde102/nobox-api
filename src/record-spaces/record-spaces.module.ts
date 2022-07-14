import { Module } from '@nestjs/common';
import { RecordSpacesService } from './record-spaces.service';
import { RecordSpacesResolver } from './record-spaces.resolver';
import { RecordField, RecordFieldSchema, RecordSpace, RecordSpaceSchema } from '@/schemas';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from '@/logger/logger.module';
import { ProjectsModule } from '@/projects/projects.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: RecordSpace.name, schema: RecordSpaceSchema }, { name: RecordField.name, schema: RecordFieldSchema }]), LoggerModule, ProjectsModule],
  providers: [RecordSpacesResolver, RecordSpacesService],
  exports: [RecordSpacesService]
})
export class RecordSpacesModule { }