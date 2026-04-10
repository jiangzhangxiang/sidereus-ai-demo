import { Test, TestingModule } from '@nestjs/testing';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';

describe('MatchController', () => {
  let controller: MatchController;
  let service: MatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchController],
      providers: [
        {
          provide: MatchService,
          useValue: {
            analyze: jest.fn().mockResolvedValue({
              overall_score: 85,
              dimensions: {
                skill_match: 90,
                experience_relevance: 80,
                education_fit: 85,
              },
              comment: '测试评语',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<MatchController>(MatchController);
    service = module.get<MatchService>(MatchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call analyze and return result', async () => {
    const body = {
      job: { title: 'T', description: 'D', required_skills: ['S'] },
      candidate: {
        basicInfo: { name: 'N', phone: 'P', email: 'E', city: 'C' },
      },
    };
    const result = await controller.analyze(body as any);
    expect(service.analyze).toHaveBeenCalledWith(body);
    expect(result.overall_score).toBe(85);
  });
});
