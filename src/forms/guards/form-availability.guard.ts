import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { FormsService } from '../forms.service';

@Injectable()
export class FormAvailabilityGuard implements CanActivate {
  constructor(private readonly formsService: FormsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ params?: { id?: string } }>();
    const id = req.params?.id;
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('Invalid form template ID');
    }
    await this.formsService.assertFormAcceptingSubmission(id);
    return true;
  }
}
