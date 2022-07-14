import { RecordField, Record } from '@/schemas';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { CustomLogger as Logger } from 'src/logger/logger.service';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateRecordInput } from './dto/create-record.input';
import { RecordSpacesService } from '@/record-spaces/record-spaces.service';
import { throwBadRequest } from '@/utils/exceptions';
import { RecordStructureType } from '@/record-spaces/dto/record-structure-type.enum';
import { RecordFieldContentInput } from './entities/record-field-content.input.entity';


@Injectable({ scope: Scope.REQUEST })
export class RecordsService {
  constructor(
    @InjectModel(Record.name) private recordModel: Model<Record>,
    @InjectModel(RecordField.name) private recordFieldModel: Model<RecordField>,
    private recordSpaceService: RecordSpacesService,
    @Inject(CONTEXT) private context,
    private logger: Logger
  ) {
  }

  private GraphQlUserId() {
    const { req } = this.context;
    return req?.user ? req.user._id : "";
  }

  private async assertCreation(recordSpaceId: string, userId: string) {
    this.logger.sLog({ recordSpaceId, userId }, "RecordService:assertCreation");
    const recordSpaceExists = await this.recordSpaceService.findOne({ _id: recordSpaceId, user: userId });
    if (!recordSpaceExists) {
      throw new Error("Record Space does not exist for User");
    };
  }


  async getRecords(query: FilterQuery<Record> = {}, freeAccess: boolean = false): Promise<Record[]> {
    this.logger.sLog(query, "RecordService:find");

    if (!freeAccess) {
      const recordSpace = await this.recordSpaceService.findOne({ _id: query.recordSpace, user: this.GraphQlUserId() });
      if (!recordSpace) {
        throwBadRequest("Record Space does not exist for User");
      }
    }

    return this.recordModel.find(query).populate({
      path: 'fieldsContent',
      model: 'RecordFieldContent',
      populate: {
        path: 'field',
        model: 'RecordField',
      }
    });
  }

  async create({ recordSpace, fieldsContent }: CreateRecordInput, userId: string = this.GraphQlUserId()) {
    await this.assertCreation(recordSpace, userId);
    await this.assertFieldContentValidation(fieldsContent);
    const createdRecord = (await this.recordModel.create({ user: userId, recordSpace, fieldsContent })).populate({
      path: 'fieldsContent',
      model: 'RecordFieldContent',
      populate: {
        path: 'field',
        model: 'RecordField',
      }
    });
    this.logger.sLog({ createdRecord, userId, recordSpace, fieldsContent },
      'RecordService:create record details Saved'
    );
    return createdRecord;
  }

  async assertFieldContentValidation(fieldsContent: RecordFieldContentInput[]) {
    this.logger.sLog({ fieldsContent }, "RecordService:assertFieldContentValidation");
    const uniqueFieldIds = [...new Set(fieldsContent.map(fieldContent => fieldContent.field))];
    if (uniqueFieldIds.length !== fieldsContent.length) {
      this.logger.sLog({ uniqueFieldIds, fieldsContent }, "RecordService:assertFieldContentValidation: some fields are repeated");
      throwBadRequest("Some fields are repeated");
    }

    for (let index = 0; index < fieldsContent.length; index++) {

      const fieldContent = fieldsContent[index];

      if (!fieldContent.textContent && !fieldContent.numberContent) {
        this.logger.sLog({ fieldContent }, "RecordService:assertFieldContentValidation: one field is missing both textContent and numberContent");
        throwBadRequest("one field is missing both textContent and numberContent");
      }

      const field = await this.recordFieldModel.findOne({ _id: fieldContent.field });
      if (!field) {
        this.logger.sLog({ fieldContent }, "RecordService:assertFieldContentValidation: one of the content fields does not exist");
        throwBadRequest("One of the Content Fields does not exist");
      }

      if (field.type === RecordStructureType.TEXT && Boolean(fieldContent.numberContent)) {
        this.logger.sLog({ fieldContent }, "RecordService:assertFieldContentValidation: one of the content fields is a text field but has a number content");
        throwBadRequest("One of the Content Fields is a text field but has a number content");
      }

      if (field.type === RecordStructureType.NUMBER && Boolean(fieldContent.textContent)) {
        this.logger.sLog({ fieldContent }, "RecordService:assertFieldContentValidation: one of the content fields is a number field but has a text content");
        throwBadRequest("One of the Content Fields is a number field but has a text content");
      }
    }

  }
}