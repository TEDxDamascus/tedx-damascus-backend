import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from '../storage/storage.module';
import { FormsService } from './forms.service';
import { FormExportService } from './export/form-export.service';
import { FormsController } from './forms.controller';
import {
  FormTemplate,
  FormTemplateSchema,
} from './entities/form-template.schema';
import {
  FormSubmission,
  FormSubmissionSchema,
} from './entities/form-submission.schema';
import { AdminGuard } from './guards/admin.guard';
import { TargetRoleGuard } from './guards/target-role.guard';
import { FormAvailabilityGuard } from './guards/form-availability.guard';

@Module({
  imports: [
    StorageModule,
    MongooseModule.forFeature([
      { name: FormTemplate.name, schema: FormTemplateSchema },
      { name: FormSubmission.name, schema: FormSubmissionSchema },
    ]),
  ],
  controllers: [FormsController],
  providers: [
    FormsService,
    FormExportService,
    AdminGuard,
    TargetRoleGuard,
    FormAvailabilityGuard,
  ],
})
export class FormsModule {}
