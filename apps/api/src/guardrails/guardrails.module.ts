import { Module } from '@nestjs/common';
import { GuardrailsController } from './guardrails.controller';

@Module({ controllers: [GuardrailsController] })
export class GuardrailsModule {}
