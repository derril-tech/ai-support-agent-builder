import { Body, Controller, Post } from '@nestjs/common';

@Controller('datasets')
export class DatasetsController {
  @Post('ingest')
  ingest(@Body() body: { rows: any[] }) {
    // TODO: validate rows
    return { accepted: body.rows.length };
  }

  @Post('validate')
  validate(@Body() body: { rows: any[]; schema: Record<string, string> }) {
    // TODO: validate against schema
    return { valid: true, errors: [] };
  }
}

