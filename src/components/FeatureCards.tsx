import { Shield, Search, Code, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: Search,
    title: 'SEO Analysis',
    description: 'Kiểm tra code có tối ưu cho SEO không, meta tags, structured data',
  },
  {
    icon: Shield,
    title: 'Security Check',
    description: 'Phát hiện lỗ hổng bảo mật, XSS, SQL Injection, CSRF',
  },
  {
    icon: Code,
    title: 'Clean Code',
    description: 'Đánh giá code có sạch, dễ đọc, tuân thủ best practices',
  },
  {
    icon: CheckCircle,
    title: 'Functionality',
    description: 'Kiểm tra logic, edge cases, error handling',
  },
];

export const FeatureCards = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {features.map((feature, index) => (
        <Card
          key={index}
          className="p-4 text-center hover:shadow-md transition-all hover:-translate-y-1 cursor-default group"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <feature.icon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-medium text-foreground mb-1 text-sm">{feature.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
        </Card>
      ))}
    </div>
  );
};
