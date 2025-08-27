import { Body, Controller, Headers, HttpException, HttpStatus, Post } from '@nestjs/common';
import crypto from 'crypto';

function verifySignature(rawBody: string, signature: string, secret: string) {
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(computed, 'hex'));
}

@Controller('webhooks')
export class WebhooksController {
  @Post('verify')
  verify(@Body() body: any, @Headers('x-signature') sig?: string) {
    const secret = process.env.WEBHOOK_SECRET || 'dev-secret';
    const raw = JSON.stringify(body);
    if (!sig || !verifySignature(raw, sig, secret)) {
      throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    }
    return { valid: true };
  }

  @Post('sign')
  sign(@Body() body: any) {
    const secret = process.env.WEBHOOK_SECRET || 'dev-secret';
    const raw = JSON.stringify(body);
    const signature = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    return { signature };
  }
}
