import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

interface ReviewCategory {
  name: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

interface ReviewResult {
  overallScore: number;
  summary: string;
  categories: ReviewCategory[];
  fixedCode?: string;
}

export const useCodeReview = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [lastCode, setLastCode] = useState<string>('');

  const saveToHistory = useCallback(async (code: string, reviewResult: ReviewResult) => {
    if (!user) return;

    const { error } = await supabase
      .from('review_history')
      .insert({
        user_id: user.id,
        code_snippet: code,
        overall_score: reviewResult.overallScore,
        summary: reviewResult.summary,
        result_json: reviewResult as unknown as Json,
      });

    if (error) {
      console.error('Error saving to history:', error);
    }
  }, [user]);

  const reviewCode = useCallback(async (code: string) => {
    setIsLoading(true);
    setIsStreaming(true);
    setStreamContent('');
    setResult(null);
    setLastCode(code);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/review-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to review code');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamContent(fullContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      setIsStreaming(false);
      
      try {
        let jsonContent = fullContent;
        const jsonMatch = fullContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        } else {
          const startIndex = fullContent.indexOf('{');
          const endIndex = fullContent.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1) {
            jsonContent = fullContent.slice(startIndex, endIndex + 1);
          }
        }

        const parsed = JSON.parse(jsonContent) as ReviewResult;
        setResult(parsed);
        
        // Save to history if user is logged in
        await saveToHistory(code, parsed);
        
        toast({
          title: 'Đánh giá hoàn tất!',
          description: `Điểm tổng thể: ${parsed.overallScore}/100`,
        });
      } catch (parseError) {
        console.error('Failed to parse result:', parseError);
        toast({
          title: 'Lỗi phân tích kết quả',
          description: 'Không thể parse kết quả từ AI',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Review error:', error);
      setIsStreaming(false);
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể đánh giá code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [saveToHistory]);

  const loadFromHistory = useCallback((historyResult: ReviewResult) => {
    setResult(historyResult);
    setIsStreaming(false);
    setStreamContent('');
  }, []);

  return {
    isLoading,
    isStreaming,
    streamContent,
    result,
    reviewCode,
    loadFromHistory,
  };
};
