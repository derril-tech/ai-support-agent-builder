import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const createUserSchema = z.object({ email: z.string().email(), first_name: z.string().optional(), last_name: z.string().optional() });

@Controller('users')
export class UsersController {
  @Get()
  list() { return { items: [], nextCursor: null }; }

  @Post()
  create(@Body(new ZodValidationPipe(createUserSchema)) body: z.infer<typeof createUserSchema>) {
    return { id: 'user-id-stub', ...body };
  }

  @Get(':id')
  get(@Param('id') id: string) { return { id, email: 'user@example.com' }; }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return { id, ...body }; }
}

