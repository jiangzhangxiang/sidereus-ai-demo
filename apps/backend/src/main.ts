/**
 * @fileoverview 应用启动入口
 * @description NestJS 应用引导文件，负责创建应用实例、配置 CORS 跨域策略、
 *              全局验证管道，并启动 HTTP 服务监听。
 * @module main
 * @version 1.0.0
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
