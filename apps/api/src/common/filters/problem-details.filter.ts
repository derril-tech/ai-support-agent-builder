import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? (exception.getResponse() as any) : { message: 'Internal Server Error' };

    const problem = {
      type: 'about:blank',
      title: HttpStatus[status] ?? 'Error',
      status,
      detail: typeof message === 'string' ? message : message?.message ?? undefined,
      errors: typeof message === 'object' ? message : undefined,
    };

    response
      .status(status)
      .header('Content-Type', 'application/problem+json')
      .send(problem);
  }
}

