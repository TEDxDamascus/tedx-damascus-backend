import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailsModule } from '../emails/emails.module';
import { EventsModule } from '../events/events.module';
import {
  FormSubmission,
  FormSubmissionSchema,
} from '../forms/entities/form-submission.schema';
import {
  FormTemplate,
  FormTemplateSchema,
} from '../forms/entities/form-template.schema';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceSchema } from './schema/attendance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: FormSubmission.name, schema: FormSubmissionSchema },
      { name: FormTemplate.name, schema: FormTemplateSchema },
    ]),
    EventsModule,
    EmailsModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
