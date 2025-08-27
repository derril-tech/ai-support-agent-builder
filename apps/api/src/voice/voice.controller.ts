import { Body, Controller, Post } from '@nestjs/common';

@Controller('voice')
export class VoiceController {
  @Post('webhook')
  webhook(@Body() _body: any) {
    return `<Response><Say>Voice channel is under construction.</Say></Response>`;
  }
}
