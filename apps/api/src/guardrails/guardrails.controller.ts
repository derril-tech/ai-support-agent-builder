import { Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const textSchema = z.object({ text: z.string() });

@Controller('guardrails')
export class GuardrailsController {
  @Post('check-jailbreak')
  jailbreak(@Body(new ZodValidationPipe(textSchema)) body: { text: string }) {
    const matched = /ignore|jailbreak|bypass/i.test(body.text);
    return { matched, score: matched ? 0.9 : 0.1 };
  }

  @Post('filter-pii')
  pii(@Body(new ZodValidationPipe(textSchema)) body: { text: string }) {
    const redacted = body.text.replace(/[0-9]{3}-[0-9]{2}-[0-9]{4}/g, '***-**-****');
    return { redacted };
  }

  @Post('filter-profanity')
  profanity(@Body(new ZodValidationPipe(textSchema)) body: { text: string }) {
    const redacted = body.text.replace(/badword/gi, '****');
    return { redacted };
  }

  @Post('self-harm-routing')
  selfHarm(@Body(new ZodValidationPipe(textSchema)) body: { text: string }) {
    const route = /suicide|self-harm/i.test(body.text) ? 'escalate' : 'allow';
    return { action: route };
  }
}

