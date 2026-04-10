import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './match.service';
import { MatchRequestDto } from './dto/match.dto';

describe('MatchService', () => {
  let service: MatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchService],
    }).compile();
    service = module.get<MatchService>(MatchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return valid match result structure', async () => {
    const dto: MatchRequestDto = {
      job: {
        title: '前端工程师',
        description: '负责前端开发工作',
        required_skills: ['React', 'TypeScript'],
        plus_skills: ['Node.js'],
      },
      candidate: {
        basicInfo: {
          name: '张三',
          phone: '13800138000',
          email: 'z@test.com',
          city: '北京',
        },
        skills: ['React', 'TypeScript', 'Node.js'],
        workExperience: [
          {
            company: 'A公司',
            position: '前端工程师',
            period: '3年',
            description: '使用React开发项目',
          },
        ],
        education: [
          {
            school: '北京大学',
            major: '计算机科学',
            degree: '本科',
            graduationDate: '2020-06',
          },
        ],
      },
    };

    const result = await service.analyze(dto);

    expect(result).toHaveProperty('overall_score');
    expect(result).toHaveProperty('dimensions');
    expect(result).toHaveProperty('comment');
    expect(result.dimensions).toHaveProperty('skill_match');
    expect(result.dimensions).toHaveProperty('experience_relevance');
    expect(result.dimensions).toHaveProperty('education_fit');
    expect(result.overall_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_score).toBeLessThanOrEqual(100);
    expect(result.dimensions.skill_match).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.skill_match).toBeLessThanOrEqual(100);
    expect(result.dimensions.experience_relevance).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.experience_relevance).toBeLessThanOrEqual(100);
    expect(result.dimensions.education_fit).toBeGreaterThanOrEqual(0);
    expect(result.dimensions.education_fit).toBeLessThanOrEqual(100);
    expect(typeof result.comment).toBe('string');
    expect(result.comment.length).toBeGreaterThan(0);
  });

  it('should give higher score when all skills match', async () => {
    const fullMatchDto: MatchRequestDto = {
      job: {
        title: '测试岗位',
        description: '',
        required_skills: ['Java', 'Spring'],
      },
      candidate: {
        basicInfo: { name: '测试', phone: '1', email: 'a@b.com', city: '' },
        skills: ['Java', 'Spring'],
      },
    };

    const noMatchDto: MatchRequestDto = {
      job: {
        title: '测试岗位',
        description: '',
        required_skills: ['Java', 'Spring'],
      },
      candidate: {
        basicInfo: { name: '测试', phone: '1', email: 'a@b.com', city: '' },
        skills: ['Python'],
      },
    };

    const fullResult = await service.analyze(fullMatchDto);
    const noResult = await service.analyze(noMatchDto);

    expect(fullResult.dimensions.skill_match).toBeGreaterThan(
      noResult.dimensions.skill_match,
    );
  });

  it('should handle empty work experience gracefully', async () => {
    const dto: MatchRequestDto = {
      job: { title: '测试', description: '', required_skills: ['Test'] },
      candidate: {
        basicInfo: { name: 'T', phone: '1', email: 'a@b.com', city: '' },
        skills: [],
        workExperience: [],
      },
    };

    const result = await service.analyze(dto);
    expect(result.dimensions.experience_relevance).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty education gracefully', async () => {
    const dto: MatchRequestDto = {
      job: { title: '测试', description: '', required_skills: ['Test'] },
      candidate: {
        basicInfo: { name: 'T', phone: '1', email: 'a@b.com', city: '' },
        skills: [],
        education: [],
      },
    };

    const result = await service.analyze(dto);
    expect(result.dimensions.education_fit).toBeGreaterThanOrEqual(0);
  });
});
