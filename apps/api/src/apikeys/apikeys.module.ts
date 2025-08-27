import { Module } from '@nestjs/common';
import { ApiKeysController } from './apikeys.controller';

@Module({ controllers: [ApiKeysController] })
export class ApiKeysModule {}
