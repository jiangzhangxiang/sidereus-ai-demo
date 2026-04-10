/**
 * @fileoverview 候选人-岗位智能匹配评分服务
 * @description 基于岗位需求与候选人简历数据进行多维度匹配分析，计算综合匹配度及各维度分数，
 *              并生成自然语言评语。采用规则引擎模拟 AI 匹配分析逻辑。
 * @module match/match.service
 * @version 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { MatchRequestDto } from './dto/match.dto';

/** 匹配结果接口 */
export interface MatchResult {
  overall_score: number;
  dimensions: {
    skill_match: number;
    experience_relevance: number;
    education_fit: number;
  };
  comment: string;
}

@Injectable()
export class MatchService {
  /**
   * 执行候选人-岗位匹配分析
   * @param dto - 包含岗位需求和候选人简历的请求数据
   * @returns 匹配分析结果（综合分、维度分、AI评语）
   */
  async analyze(dto: MatchRequestDto): Promise<MatchResult> {
    const { job, candidate } = dto;

    const skillScore = this.calculateSkillMatch(
      job.required_skills,
      job.plus_skills || [],
      candidate.skills || [],
    );

    const experienceScore = this.calculateExperienceRelevance(
      job.description,
      job.required_skills,
      candidate.workExperience || [],
    );

    const educationScore = this.calculateEducationFit(
      candidate.education || [],
    );

    const overallScore = Math.round(
      skillScore * 0.45 + experienceScore * 0.35 + educationScore * 0.2,
    );

    const comment = this.generateComment(
      job,
      candidate,
      skillScore,
      experienceScore,
      educationScore,
    );

    return {
      overall_score: Math.min(100, Math.max(0, overallScore)),
      dimensions: {
        skill_match: skillScore,
        experience_relevance: experienceScore,
        education_fit: educationScore,
      },
      comment,
    };
  }

  /**
   * 计算技能匹配度（0-100）
   * 基于必备技能匹配率（权重70%）+ 加分技能匹配率（权重30%）
   */
  private calculateSkillMatch(
    requiredSkills: string[],
    plusSkills: string[],
    candidateSkills: string[],
  ): number {
    if (requiredSkills.length === 0) return 80;

    const normalizedCandidate = candidateSkills.map((s) => s.toLowerCase());
    const normalizedRequired = requiredSkills.map((s) => s.toLowerCase());

    const requiredMatchCount = normalizedRequired.filter((rs) =>
      normalizedCandidate.some((cs) => cs.includes(rs) || rs.includes(cs)),
    ).length;

    const requiredRate = requiredMatchCount / normalizedRequired.length;

    let plusBonus = 0;
    if (plusSkills.length > 0 && candidateSkills.length > 0) {
      const normalizedPlus = plusSkills.map((s) => s.toLowerCase());
      const plusMatchCount = normalizedPlus.filter((ps) =>
        normalizedCandidate.some((cs) => cs.includes(ps) || ps.includes(cs)),
      ).length;
      plusBonus = (plusMatchCount / normalizedPlus.length) * 30;
    }

    return Math.round(
      Math.min(
        100,
        requiredRate * 70 + plusBonus + (requiredRate >= 1 ? 10 : 0),
      ),
    );
  }

  /**
   * 计算经验相关性（0-100）
   * 基于工作年限、行业/项目关键词匹配度综合评估
   */
  private calculateExperienceRelevance(
    jobDescription: string,
    requiredSkills: string[],
    workExperiences: Array<Record<string, string>>,
  ): number {
    if (workExperiences.length === 0) return 30;

    let totalYears = 0;
    let relevanceSum = 0;

    const jobKeywords = [
      ...requiredSkills.map((s) => s.toLowerCase()),
      ...jobDescription
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 1),
    ];

    for (const exp of workExperiences) {
      const period = exp.period || '';
      const yearMatch = period.match(/(\d+)/);
      if (yearMatch) {
        totalYears += parseInt(yearMatch[1], 10);
      }

      const descText = (
        (exp.description || '') +
        ' ' +
        (exp.position || '') +
        ' ' +
        (exp.company || '')
      ).toLowerCase();
      const matchedKeywords = jobKeywords.filter((kw) =>
        descText.includes(kw),
      ).length;
      relevanceSum += Math.min(
        100,
        (matchedKeywords / Math.max(jobKeywords.length, 1)) * 100,
      );
    }

    const avgRelevance =
      workExperiences.length > 0 ? relevanceSum / workExperiences.length : 0;
    const yearScore = Math.min(50, totalYears * 5);

    return Math.round(
      Math.min(
        100,
        avgRelevance * 0.6 + yearScore * 0.4 + (totalYears >= 3 ? 10 : 0),
      ),
    );
  }

  /**
   * 计算教育背景契合度（0-100）
   * 基于学历层次和专业方向相关性评估
   */
  private calculateEducationFit(
    educations: Array<Record<string, string>>,
  ): number {
    if (educations.length === 0) return 40;

    const degreeScores: Record<string, number> = {
      博士: 95,
      硕士: 85,
      本科: 75,
      大专: 55,
      博士研究生: 95,
      硕士研究生: 85,
    };

    let maxScore = 0;
    for (const edu of educations) {
      const degree = edu.degree || '';
      const scored = Object.entries(degreeScores).find(([key]) =>
        degree.includes(key),
      );
      if (scored) {
        maxScore = Math.max(maxScore, scored[1]);
      } else if (degree) {
        maxScore = Math.max(maxScore, 60);
      }
    }

    const bonus = educations.length > 1 ? 5 : 0;
    return Math.min(100, maxScore + bonus);
  }

  /**
   * 生成自然语言评语（300字以内）
   * 客观分析候选人优势与不足
   */
  private generateComment(
    job: MatchRequestDto['job'],
    candidate: MatchRequestDto['candidate'],
    skillScore: number,
    experienceScore: number,
    educationScore: number,
  ): string {
    const name = candidate.basicInfo?.name || '该候选人';
    const advantages: string[] = [];
    const weaknesses: string[] = [];

    const candidateSkillNames = (candidate.skills || []).map((s) =>
      s.toLowerCase(),
    );
    const matchedRequired = (job.required_skills || []).filter((rs) =>
      candidateSkillNames.some(
        (cs) => cs.includes(rs.toLowerCase()) || rs.toLowerCase().includes(cs),
      ),
    );

    if (
      matchedRequired.length === job.required_skills.length &&
      job.required_skills.length > 0
    ) {
      advantages.push(
        `熟练掌握岗位要求的所有${job.required_skills.length}项必备技能`,
      );
    } else if (matchedRequired.length > 0) {
      advantages.push(
        `具备${matchedRequired.length}项核心技能：${matchedRequired.slice(0, 3).join('、')}${matchedRequired.length > 3 ? '等' : ''}`,
      );
    }

    if ((candidate.workExperience || []).length > 0) {
      const totalExp = (candidate.workExperience || []).reduce((sum, e) => {
        const m = (e.period || '').match(/(\d+)/);
        return sum + (m ? parseInt(m[1], 10) : 0);
      }, 0);
      if (totalExp >= 5) {
        advantages.push(`拥有${totalExp}年相关工作经验，履历丰富`);
      } else if (totalExp >= 2) {
        advantages.push(`具有${totalExp}年从业经验`);
      }
    }

    if (educationScore >= 85) {
      advantages.push(`教育背景优秀，学历层次符合岗位要求`);
    } else if (educationScore >= 70) {
      advantages.push(`教育背景基本满足岗位需求`);
    }

    const missingRequired = (job.required_skills || []).filter(
      (rs) =>
        !candidateSkillNames.some(
          (cs) =>
            cs.includes(rs.toLowerCase()) || rs.toLowerCase().includes(cs),
        ),
    );
    if (missingRequired.length > 0) {
      weaknesses.push(
        `缺少${missingRequired.length}项必备技能：${missingRequired.slice(0, 2).join('、')}`,
      );
    }

    if (experienceScore < 50) {
      weaknesses.push('相关工作经验较少，项目经验有待积累');
    }

    if (educationScore < 60 && (candidate.education || []).length > 0) {
      weaknesses.push('学历层次与岗位要求存在一定差距');
    }

    if (weaknesses.length === 0) {
      weaknesses.push('整体表现均衡，建议在面试中进一步考察软技能');
    }

    const overallVerdict =
      skillScore + experienceScore + educationScore >= 210
        ? '综合评估为高度匹配，建议优先安排面试'
        : skillScore + experienceScore + educationScore >= 150
          ? '综合评估为中度匹配，建议进入初筛流程'
          : '综合匹配度一般，建议结合具体业务需求进一步评估';

    return `${name}应聘「${job.title}」岗位的匹配分析如下：\n\n【优势】\n${advantages.map((a) => `• ${a}`).join('\n')}\n\n【不足】\n${weaknesses.map((w) => `• ${w}`).join('\n')}\n\n【综合评价】\n${overallVerdict}。`;
  }
}
