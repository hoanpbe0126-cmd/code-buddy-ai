import { useState } from 'react';
import { Send, Code, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CodeInputProps {
  onSubmit: (code: string) => void;
  isLoading: boolean;
}

export const CodeInput = ({ onSubmit, isLoading }: CodeInputProps) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && !isLoading) {
      onSubmit(code.trim());
    }
  };

  const placeholderCode = `// Dán code của bạn vào đây để được đánh giá
// Ví dụ:
function fetchData() {
  const data = fetch('/api/data');
  return data;
}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <div className="absolute top-3 left-3 flex items-center gap-2 text-muted-foreground">
          <Code className="w-4 h-4" />
          <span className="text-xs font-mono">Code Editor</span>
        </div>
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={placeholderCode}
          className="min-h-[300px] pt-10 font-mono text-sm bg-code-bg border-code-border resize-none scrollbar-thin focus:ring-2 focus:ring-primary/50 transition-shadow"
          disabled={isLoading}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {code.length > 0 ? `${code.split('\n').length} dòng • ${code.length} ký tự` : 'Nhập code để bắt đầu đánh giá'}
        </p>
        <Button
          type="submit"
          disabled={!code.trim() || isLoading}
          className="gap-2 shadow-glow hover:shadow-lg transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang phân tích...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Đánh giá code
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
