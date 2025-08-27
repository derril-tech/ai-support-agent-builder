import { Body, Controller, Get, Param, Post } from '@nestjs/common';

@Controller('shares')
export class SharesController {
  @Post()
  create(@Body() body: { resource: 'transcript'; id: string; ttlMinutes: number }) {
    return { url: `https://share.example/${body.id}`, ttlMinutes: body.ttlMinutes };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return { id, valid: true };
  }
}

