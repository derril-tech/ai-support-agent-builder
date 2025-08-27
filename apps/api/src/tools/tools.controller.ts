import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const registerToolSchema = z.object({ organizationId: z.string().uuid().optional(), name: z.string(), schema: z.any() });
const httpToolSchema = z.object({ url: z.string().url(), method: z.enum(['GET','POST','PUT','DELETE','PATCH']), headers: z.record(z.string()).optional(), body: z.any().optional() });
const graphqlToolSchema = z.object({ endpoint: z.string().url(), query: z.string(), variables: z.record(z.any()).optional(), headers: z.record(z.string()).optional() });

@Controller('tools')
export class ToolsController {
  @Get('registry')
  listRegistry() { return { items: [] }; }

  @Post('registry')
  register(@Body(new ZodValidationPipe(registerToolSchema)) body: z.infer<typeof registerToolSchema>) { return { id: 'tool-id-stub', ...body }; }

  @Post('http')
  async httpTool(@Body(new ZodValidationPipe(httpToolSchema)) body: z.infer<typeof httpToolSchema>) { return { status: 200, data: { ok: true }, requested: body }; }

  @Post('graphql')
  async graphqlTool(@Body(new ZodValidationPipe(graphqlToolSchema)) body: z.infer<typeof graphqlToolSchema>) { return { data: {}, requested: body }; }
}

