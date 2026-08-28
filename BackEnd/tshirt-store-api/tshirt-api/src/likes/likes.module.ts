import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikedProductsController, LikesController } from './likes.controller';

@Module({
  controllers: [LikesController, LikedProductsController],
  providers: [LikesService],
})
export class LikesModule {}
