import { useState } from 'react';
import { Github, Send, Loader2, FolderGit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface ProjectInputProps {
  onSubmit: (files: { path: string; content: string }[], repoName: string) => void;
  isLoading: boolean;
}

export const ProjectInput = ({ onSubmit, isLoading }: ProjectInputProps) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedFiles, setFetchedFiles] = useState<{ path: string; content: string }[] | null>(null);
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string } | null>(null);

  const handleFetchRepo = async () => {
    if (!githubUrl.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập URL GitHub repository',
        variant: 'destructive',
      });
      return;
    }

    setIsFetching(true);
    setFetchedFiles(null);
    setRepoInfo(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-github-repo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ githubUrl: githubUrl.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch repository');
      }

      setFetchedFiles(data.files);
      setRepoInfo({ owner: data.owner, repo: data.repo });
      
      toast({
        title: 'Tải thành công!',
        description: `Đã tải ${data.totalFiles} files từ ${data.owner}/${data.repo}`,
      });
    } catch (error) {
      console.error('Error fetching repo:', error);
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể tải repository',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleReview = () => {
    if (fetchedFiles && repoInfo) {
      onSubmit(fetchedFiles, `${repoInfo.owner}/${repoInfo.repo}`);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <FolderGit2 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Đánh giá Project từ GitHub</h3>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo hoặc owner/repo"
              className="pl-10"
              disabled={isFetching || isLoading}
            />
          </div>
          <Button
            onClick={handleFetchRepo}
            disabled={isFetching || isLoading || !githubUrl.trim()}
            variant="secondary"
          >
            {isFetching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Đang tải...
              </>
            ) : (
              'Tải repo'
            )}
          </Button>
        </div>

        {fetchedFiles && repoInfo && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                <span className="font-medium">{repoInfo.owner}/{repoInfo.repo}</span>
                <Badge variant="secondary">{fetchedFiles.length} files</Badge>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-3 scrollbar-thin">
              <p className="text-xs text-muted-foreground mb-2">Files sẽ được đánh giá:</p>
              <div className="flex flex-wrap gap-1">
                {fetchedFiles.slice(0, 20).map((file, index) => (
                  <Badge key={index} variant="outline" className="text-xs font-mono">
                    {file.path}
                  </Badge>
                ))}
                {fetchedFiles.length > 20 && (
                  <Badge variant="secondary" className="text-xs">
                    +{fetchedFiles.length - 20} files khác
                  </Badge>
                )}
              </div>
            </div>

            <Button
              onClick={handleReview}
              disabled={isLoading}
              className="w-full gap-2 shadow-glow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang phân tích project...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Đánh giá Project
                </>
              )}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Hỗ trợ public repositories. Files được lọc tự động (loại bỏ node_modules, images, etc.)
        </p>
      </div>
    </Card>
  );
};
