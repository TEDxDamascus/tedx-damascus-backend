import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

jest.mock('./attendance.service', () => ({
  AttendanceService: class AttendanceService {},
}));

describe('AttendanceController', () => {
  let controller: AttendanceController;

  const attendanceService = {
    createFromSubmissions: jest.fn(),
    createManual: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    invite: jest.fn(),
    revoke: jest.fn(),
    scan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        { provide: AttendanceService, useValue: attendanceService },
      ],
    }).compile();

    controller = module.get(AttendanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
