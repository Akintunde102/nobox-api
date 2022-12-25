import { RecordField, Record } from "@/schemas";
import { MongoDocWithTimeStamps } from "@/types";
import { bcryptAbs } from "@/utils";
import { CustomLogger as Logger } from '@/logger/logger.service';
import { LeanDocument } from "mongoose";

/**
 * This formats for response and also compare 
 * ...hashed fields that were previously exempted
 * @param args 
 * @param logger 
 * @returns 
 */

export const formatAndCompareRecord = async (args: { record: MongoDocWithTimeStamps<LeanDocument<Record>>, allHashedFieldsInQuery?: { value: string | number, slug: string }[] }, logger: Logger) => {
    console.time("formatAndCompareRecord")
    logger.sLog({ record: args.record, allHashedFields: Boolean(args.allHashedFieldsInQuery) }, "formatRecordForEpResponse");

    const { record, allHashedFieldsInQuery, } = args;

    const { _id, updatedAt, createdAt, fieldsContent } = record;
    const ret = { id: _id, updatedAt, createdAt } as any;
    for (let index = 0; index < fieldsContent.length; index++) {
        const { field, textContent, numberContent } = fieldsContent[index];
        const { slug: fieldSlug, hashed: fieldIsHashed } = field as RecordField;
        const content = textContent || numberContent;
        const fieldKey = fieldSlug;
        const hashedFieldInQuery = allHashedFieldsInQuery && allHashedFieldsInQuery.find(a => a.slug === fieldKey);

        const hashedFieldIsInQuery = Boolean(hashedFieldInQuery);

        if (hashedFieldIsInQuery) {
            const same = await bcryptAbs.compare(hashedFieldInQuery.value, content);
            if (!same) {
                return null;
            }
        }


        if (!hashedFieldIsInQuery && !fieldIsHashed) {
            ret[fieldKey] = content;
        }

    }
    console.timeEnd("formatAndCompareRecord")

    return ret;
}