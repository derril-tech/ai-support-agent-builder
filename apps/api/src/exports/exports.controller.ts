import { Body, Controller, Post } from '@nestjs/common';

@Controller('exports')
export class ExportsController {
  @Post('transcript')
  exportTranscript(@Body() body: { conversationId: string; format: 'json'|'html'|'pdf' }) {
    return { jobId: 'export-job-stub', status: 'queued', requested: body };
  }
}
