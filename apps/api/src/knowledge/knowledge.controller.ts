import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const collectionSchema = z.object({ name: z.string(), description: z.string().optional() });

@Controller('knowledge')
export class KnowledgeController {
  @Get('collections')
  listCollections() { return { items: [] }; }

  @Post('collections')
  createCollection(@Body(new ZodValidationPipe(collectionSchema)) body: z.infer<typeof collectionSchema>) { return { id: 'col-id-stub', ...body }; }

  @Delete('collections/:id')
  deleteCollection(@Param('id') id: string) { return { id, deleted: true }; }

  @Post('collections/:id/reindex')
  reindex(@Param('id') id: string) { return { collectionId: id, status: 'reindex_queued' }; }

  @Post('collections/:id/upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    // TODO: call workers /scan, then /chunk-embed per chunk
    const queued = true;
    return { collectionId: id, filename: file?.originalname, status: queued ? 'queued' : 'rejected' };
  }

  @Get('documents/:id')
  getDoc(@Param('id') id: string) { return { id, filename: 'doc.pdf' }; }

  @Delete('documents/:id')
  deleteDoc(@Param('id') id: string) { return { id, deleted: true }; }
}
