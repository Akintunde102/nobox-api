import { InputType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { RecordSpaceAuthOptions } from '../entities/record-space-auth-options.entity';
import { RecordStructure } from '../entities/record-structure.entity';

export type CObject = { [x: string]: any };

@InputType()
export class CreateRecordSpaceInput {
  @Field({ description: 'Name of Record Space' })
  name: string;

  @Field({ description: 'description of record space', nullable: true })
  description?: string;

  @Field({ description: 'Comments about Record Space', nullable: true })
  comments?: string;

  @Field({ description: 'Project Slug of Record Space' })
  projectSlug: string;

  @Transform((value) => value.toLowerCase())
  @Field({ description: 'Slug of Record Space' })
  slug: string;

  @Field(() => [RecordStructure], { description: 'Structure of record' })
  recordStructure: RecordStructure[];

  @Field({ description: 'Space Authentication Options', nullable: true })
  authOptions?: RecordSpaceAuthOptions;

  @Field({ description: 'Clears Record Space Data when it is true', nullable: true, defaultValue: false })
  clear?: boolean;

  @Field({ description: 'Allows Client Calls to change record structure and records', nullable: true, defaultValue: true })
  mutate?: boolean;

  @Transform((value) => JSON.parse(value))
  @Field(() => String, { description: 'Adds Value to RecordSpace on creation', nullable: true })
  initialData?: Record<string, any>[]
}
