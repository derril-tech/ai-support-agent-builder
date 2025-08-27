import { Body, Controller, Get, Param, Post } from '@nestjs/common';

@Controller('connectors')
export class ConnectorsController {
  @Get()
  list() { return { items: [] }; }

  @Post(':provider/install')
  install(@Param('provider') provider: string, @Body() body: { apiKey?: string }) {
    return { provider, installed: true, redacted: !!body.apiKey };
  }

  @Post(':provider/uninstall')
  uninstall(@Param('provider') provider: string) {
    return { provider, uninstalled: true };
  }
}
