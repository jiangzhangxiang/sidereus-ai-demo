/**
 * @fileoverview 应用根模块
 * @description NestJS 应用入口模块，负责全局配置：环境变量加载、PostgreSQL 数据库连接、
 *              子模块注册（FileUploadModule、CandidatesModule）及全局服务提供者。
 * @module app.module
 * @version 1.0.0
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileUploadModule } from './file-upload/file-upload.module';
import { CandidatesModule } from './candidates/candidates.module';
import { Candidate } from './candidates/candidate.entity';
import { Education } from './candidates/education.entity';
import { WorkExperience } from './candidates/work-experience.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [Candidate, Education, WorkExperience],
        synchronize: true,
      }),
    }),
    FileUploadModule,
    CandidatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
