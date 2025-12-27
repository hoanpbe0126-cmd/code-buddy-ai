import { Header } from '@/components/Header';
import { CodeInput } from '@/components/CodeInput';
import { ProjectInput } from '@/components/ProjectInput';
import { ReviewResult } from '@/components/ReviewResult';
import { FeatureCards } from '@/components/FeatureCards';
import { ReviewHistory } from '@/components/ReviewHistory';
import { useCodeReview } from '@/hooks/useCodeReview';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, FolderGit2 } from 'lucide-react';

const Index = () => {
  const { isLoading, isStreaming, streamContent, result, isProjectReview, projectUrl, reviewCode, reviewProject, loadFromHistory } = useCodeReview();
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Code Review AI - Đánh giá & Tối ưu Code Tự động</title>
        <meta name="description" content="Công cụ AI đánh giá code tự động: kiểm tra SEO, bảo mật, clean code và đề xuất cải thiện. Hỗ trợ đánh giá cả project từ GitHub." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <section className="text-center mb-10 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Đánh giá Code với{' '}
              <span className="text-primary">AI</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Phân tích code đơn lẻ hoặc toàn bộ project GitHub. 
              Kiểm tra SEO, bảo mật, clean code và nhận đề xuất cải thiện từ AI.
            </p>
          </section>

          {/* Features */}
          <div className="max-w-5xl mx-auto">
            <FeatureCards />
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Left: Input & Results */}
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="code" className="gap-2">
                    <Code className="w-4 h-4" />
                    Đánh giá Code
                  </TabsTrigger>
                  <TabsTrigger value="project" className="gap-2">
                    <FolderGit2 className="w-4 h-4" />
                    Đánh giá Project
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="code">
                  <CodeInput onSubmit={reviewCode} isLoading={isLoading} />
                </TabsContent>

                <TabsContent value="project">
                  <ProjectInput onSubmit={reviewProject} isLoading={isLoading} />
                </TabsContent>
              </Tabs>

              {(isStreaming || result) && (
                <section>
                  <ReviewResult 
                    result={result} 
                    isStreaming={isStreaming} 
                    streamContent={streamContent}
                    isProjectReview={isProjectReview}
                    projectUrl={projectUrl}
                  />
                </section>
              )}
            </div>

            {/* Right: History Sidebar */}
            {user && (
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <ReviewHistory onSelectReview={loadFromHistory} />
                </div>
              </div>
            )}
          </div>

          {/* Login prompt for non-authenticated users */}
          {!user && (
            <section className="mt-12 text-center">
              <div className="bg-accent/50 rounded-xl p-6 max-w-md mx-auto">
                <p className="text-foreground font-medium mb-2">
                  Đăng nhập để lưu lịch sử review
                </p>
                <p className="text-sm text-muted-foreground">
                  Tạo tài khoản miễn phí để lưu và xem lại các review đã thực hiện
                </p>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>Code Review AI - Công cụ đánh giá code thông minh</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
