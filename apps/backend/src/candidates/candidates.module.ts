import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { Candidate } from './candidate.entity';
import { Education } from './education.entity';
import { WorkExperience } from './work-experience.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Candidate, Education, WorkExperience])],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
