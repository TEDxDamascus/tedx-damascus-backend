import { Types } from 'mongoose';
import {
  formTemplateIdFilter,
  toFormTemplateObjectId,
} from './form-template-id-filter.util';

describe('formTemplateIdFilter', () => {
  const formId = '6a1db58651b6d6845116ceaf';

  it('matches both ObjectId and string storage', () => {
    expect(formTemplateIdFilter(formId)).toEqual({
      formTemplateId: {
        $in: [new Types.ObjectId(formId), formId],
      },
    });
  });
});

describe('toFormTemplateObjectId', () => {
  it('returns an ObjectId for valid ids', () => {
    const formId = '6a1db58651b6d6845116ceaf';
    expect(toFormTemplateObjectId(formId)).toBeInstanceOf(Types.ObjectId);
    expect(toFormTemplateObjectId(formId).toString()).toBe(formId);
  });
});
