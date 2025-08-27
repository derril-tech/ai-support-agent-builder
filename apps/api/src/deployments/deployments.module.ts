import { Module } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';

@Module({ controllers: [DeploymentsController] })
export class DeploymentsModule {}
