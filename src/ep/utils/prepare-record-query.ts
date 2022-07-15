import { RecordStructureType } from "@/record-spaces/dto/record-structure-type.enum";
import { RecordField, Record as Record_ } from "@/schemas";
import { throwBadRequest } from "@/utils/exceptions";
import mongoose, { FilterQuery } from "mongoose";
import { getQueryFieldDetails } from "./get-query-field-details";

export const prepareRecordQuery = (recordSpaceSlug: string, recordSpaceId: string, query: Record<string, string>, fieldsDetailsFromDb: RecordField[], logger: any) => {
    const { queryKeys, preparedQuery } = initPreparedQuery(recordSpaceId, query);

    for (let index = 0; index < queryKeys.length; index++) {
        const queryKey = queryKeys[index];
        const fieldDetails = getQueryFieldDetails(queryKey.toLowerCase(), fieldsDetailsFromDb);
        if (!fieldDetails) {
            throwBadRequest(`Query field: ${queryKey} does not exist for ${recordSpaceSlug}`);
        }
        const { _id, type } = fieldDetails;
        const valueType = {
            [RecordStructureType.TEXT]: "textContent",
            [RecordStructureType.NUMBER]: "numberContent",
        }[type];
        preparedQuery.$and.push({ 'fieldsContent.field': _id, [`fieldsContent.${valueType}`]: query[queryKey] });
    }
    return preparedQuery;
}

const initPreparedQuery = (recordSpaceId: string, query: Record<string, string>) => {
    const preparedQuery: FilterQuery<Record_> = {
        recordSpace: recordSpaceId,
    }

    if (query.id) {
        if (!mongoose.Types.ObjectId.isValid(query.id)) {
            throwBadRequest(`Query field Id: ${query.id} is not a valid ObjectId`);
        }
        preparedQuery._id = query.id;
        delete query.id;
    }

    const queryKeys = Object.keys(query);
    if (queryKeys.length) {
        preparedQuery.$and = [];
    }

    return { queryKeys, preparedQuery }
}