import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('flags')
export class FlagsController {
  @Get()
  list() { return { flags: [{ key: 'enableRiskyFeature', enabled: false }] };
  }

  @Post('toggle')
  toggle(@Body() body: { key: string; enabled: boolean }) {
    return { updated: true, flag: body };
  }
}

