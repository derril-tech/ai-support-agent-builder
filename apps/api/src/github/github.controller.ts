import { Body, Controller, Get, Post, Query } from '@nestjs/common';

@Controller('github')
export class GithubController {
  @Get('install')
  install() { return { url: 'https://github.com/apps/ai-support-agent/installations/new' }; }

  @Get('callback')
  callback(@Query('code') code?: string) { return { ok: !!code };
  }

  @Post('export')
  exportConfig(@Body() body: { agentId: string; repo: string }) {
    return { pushed: true, target: body.repo, agentId: body.agentId };
  }
}

