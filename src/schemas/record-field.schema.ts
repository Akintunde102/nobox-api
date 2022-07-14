import { RecordStructureType } from '@/record-spaces/dto/record-structure-type.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as MongooseTimestamp from 'mongoose-timestamp';
import { RecordSpace } from './record-space.schema';

@Schema()
class RecordField extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId , ref: 'RecordSpace' })
  recordSpace: string | RecordSpace;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  type: RecordStructureType;
}

const RecordFieldSchema = SchemaFactory.createForClass(RecordField);
RecordFieldSchema.plugin(MongooseTimestamp);
export { RecordFieldSchema, RecordField };