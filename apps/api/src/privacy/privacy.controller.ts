import { Body, Controller, Post } from '@nestjs/common';

@Controller('privacy')
export class PrivacyController {
  @Post('dsr/export')
  exportData(@Body() body: { userId: string }) {
    return { taskId: 'dsr-export-task-stub', userId: body.userId, status: 'queued' };
  }

  @Post('dsr/delete')
  deleteData(@Body() body: { userId: string }) {
    return { taskId: 'dsr-delete-task-stub', userId: body.userId, status: 'queued' };
  }

  @Post('retention/sweep')
  retentionSweep() {
    return { status: 'started' };
  }
}
