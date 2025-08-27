import { Body, Controller, Get, Param, Post } from '@nestjs/common';

@Controller('evals')
export class EvalsController {
  @Post('run')
  run(@Body() body: { datasetId: string; rubric: string; judge: 'gpt-4o'|'other'; mode: 'pairwise'|'scalar' }) {
    return { runId: 'eval-run-id-stub', status: 'queued', requested: body };
  }

  @Get('runs/:id')
  getRun(@Param('id') id: string) {
    return { id, status: 'completed', results: [] };
  }

  @Post('gate')
  gate(@Body() body: { requiredPass: number }) {
    return { passed: true, threshold: body.requiredPass, details: [] };
  }
}

