import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

@Controller('apikeys')
export class ApiKeysController {
  @Get()
  list() { return { items: [] }; }

  @Post()
  create(@Body() body: { name: string; permissions?: string[] }) {
    return { id: 'key-id-stub', name: body.name, secret: 'sk_live_xxx' };
  }

  @Delete(':id')
  revoke(@Param('id') id: string) { return { id, revoked: true }; }
}

