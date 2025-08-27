import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('settings')
export class SettingsController {
  @Get('roles')
  roles() { return { roles: ['owner','admin','designer','operator','viewer'] }; }

  @Post('sso')
  sso(@Body() body: { samlMetadataUrl?: string; oidcClientId?: string }) { return { configured: true, ...body }; }

  @Post('scim')
  scim(@Body() body: { baseUrl: string }) { return { configured: true, ...body }; }

  @Post('webhooks')
  webhooks(@Body() body: { url: string; secret?: string }) { return { saved: true, ...body }; }
}

