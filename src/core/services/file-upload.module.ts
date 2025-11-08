import { Module, Global } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { S3Service } from './s3.service';

@Global()
@Module({
  providers: [FileUploadService, S3Service],
  exports: [FileUploadService, S3Service],
})
export class FileUploadModule {}
