import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/create-candidate.dto';

@Controller('api/candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('skills') skills?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const size = pageSize ? parseInt(pageSize, 10) : 10;
    const skillsArray = skills ? skills.split(',') : [];

    return this.candidatesService.findAll({
      page: pageNum,
      pageSize: size,
      search,
      status: status as any,
      skills: skillsArray,
      sortBy: (sortBy as any) || 'uploadedAt',
      sortOrder: (sortOrder as any) || 'desc',
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const candidate = await this.candidatesService.findOne(id);
    if (!candidate) {
      throw new HttpException('候选人不存在', HttpStatus.NOT_FOUND);
    }
    return candidate;
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.create(createCandidateDto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(@Param('id') id: string, @Body() updateCandidateDto: UpdateCandidateDto) {
    return this.candidatesService.update(id, updateCandidateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
