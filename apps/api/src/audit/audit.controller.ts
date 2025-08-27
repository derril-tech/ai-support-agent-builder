import { Controller, Get } from '@nestjs/common';

@Controller('audit')
export class AuditController {
  @Get('log')
  list() { return { items: [] }; }
}
