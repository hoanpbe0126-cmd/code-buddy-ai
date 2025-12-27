import { Shield, Search, CheckCircle, Code, Lightbulb, AlertTriangle, XCircle, Sparkles, Layers, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExportPdfButton } from './ExportPdfButton';

export interface ReviewCategory {
  name: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface ReviewResultData {
  overallScore: number;
  summary: string;
  categories: ReviewCategory[];
  fixedCode?: string;
  criticalIssues?: string[];
  recommendations?: string[];
}

interface ReviewResultProps {
  result: ReviewResultData | null;
  isStreaming: boolean;
  streamContent: string;
  isProjectReview?: boolean;
  projectUrl?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
};

const getScoreBg = (score: number) => {
  if (score >= 80) return 'bg-success/10';
  if (score >= 60) return 'bg-warning/10';
  return 'bg-destructive/10';
};

const ScoreCircle = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="56"
          cy="56"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted"
        />
        <circle
          cx="56"
          cy="56"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
    </div>
  );
};

const categoryIcons: Record<string, React.ReactNode> = {
  'SEO': <Search className="w-4 h-4" />,
  'Bảo mật': <Shield className="w-4 h-4" />,
  'Clean Code': <Code className="w-4 h-4" />,
  'Chức năng': <CheckCircle className="w-4 h-4" />,
  'Kiến trúc': <Layers className="w-4 h-4" />,
  'Performance': <Zap className="w-4 h-4" />,
};

export const ReviewResult = ({ result, isStreaming, streamContent, isProjectReview, projectUrl }: ReviewResultProps) => {
  if (isStreaming) {
    return (
      <Card className="p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">
            {isProjectReview ? 'Đang phân tích project...' : 'Đang phân tích code...'}
          </h3>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground bg-code-bg p-4 rounded-lg border border-code-border max-h-96 overflow-y-auto scrollbar-thin">
            {streamContent || 'Đang xử lý...'}
          </pre>
        </div>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Overall Score */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ScoreCircle score={result.overallScore} />
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {isProjectReview ? 'Điểm đánh giá Project' : 'Điểm đánh giá tổng thể'}
            </h3>
            <p className="text-muted-foreground">{result.summary}</p>
          </div>
          <div className="flex items-center gap-3">
            {isProjectReview && (
              <ExportPdfButton result={result} projectUrl={projectUrl} />
            )}
            <Badge variant={result.overallScore >= 80 ? 'default' : result.overallScore >= 60 ? 'secondary' : 'destructive'} className="text-sm px-3 py-1">
              {result.overallScore >= 80 ? 'Tốt' : result.overallScore >= 60 ? 'Trung bình' : 'Cần cải thiện'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Critical Issues (for project review) */}
      {result.criticalIssues && result.criticalIssues.length > 0 && (
        <Card className="p-5 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h4 className="font-semibold text-destructive">Vấn đề nghiêm trọng cần sửa ngay</h4>
          </div>
          <ul className="space-y-2">
            {result.criticalIssues.map((issue, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                {issue}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Categories */}
      <div className="grid md:grid-cols-2 gap-4">
        {result.categories.map((category, index) => (
          <Card key={index} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${getScoreBg(category.score)} flex items-center justify-center`}>
                  <span className={getScoreColor(category.score)}>
                    {categoryIcons[category.name] || <Code className="w-4 h-4" />}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{category.name}</h4>
                  <p className="text-xs text-muted-foreground">Điểm: {category.score}/100</p>
                </div>
              </div>
              <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                {category.score}
              </span>
            </div>

            <Progress value={category.score} className="h-2 mb-4" />

            {category.issues.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Vấn đề phát hiện
                </p>
                <ul className="space-y-1">
                  {category.issues.slice(0, 3).map((issue, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-warning mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                  {category.issues.length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      +{category.issues.length - 3} vấn đề khác
                    </li>
                  )}
                </ul>
              </div>
            )}

            {category.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Đề xuất cải thiện
                </p>
                <ul className="space-y-1">
                  {category.suggestions.slice(0, 3).map((suggestion, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                  {category.suggestions.length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      +{category.suggestions.length - 3} đề xuất khác
                    </li>
                  )}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Recommendations (for project review) */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card className="p-5 border-primary/50 bg-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-primary">Đề xuất cải thiện tổng thể</h4>
          </div>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Fixed Code */}
      {result.fixedCode && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Code đã được tối ưu</h4>
          </div>
          <pre className="code-block text-xs overflow-x-auto scrollbar-thin">
            <code>{result.fixedCode}</code>
          </pre>
        </Card>
      )}
    </div>
  );
};
