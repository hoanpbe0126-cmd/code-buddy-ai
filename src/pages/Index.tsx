import { Header } from '@/components/Header';
import { CodeInput } from '@/components/CodeInput';
import { ReviewResult } from '@/components/ReviewResult';
import { FeatureCards } from '@/components/FeatureCards';
import { ReviewHistory } from '@/components/ReviewHistory';
import { useCodeReview } from '@/hooks/useCodeReview';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  const { isLoading, isStreaming, streamContent, result, reviewCode, loadFromHistory } = useCodeReview();
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Code Review AI - Đánh giá & Tối ưu Code Tự động</title>
        <meta name="description" content="Công cụ AI đánh giá code tự động: kiểm tra SEO, bảo mật, clean code và đề xuất cải thiện. Tối ưu code của bạn ngay hôm nay!" />
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
              Phân tích code của bạn để kiểm tra SEO, bảo mật, clean code và đề xuất cải thiện. 
              Được hỗ trợ bởi AI thông minh.
            </p>
          </section>

          {/* Features */}
          <div className="max-w-5xl mx-auto">
            <FeatureCards />
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Left: Code Input & Results */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <CodeInput onSubmit={reviewCode} isLoading={isLoading} />
              </section>

              {(isStreaming || result) && (
                <section>
                  <ReviewResult 
                    result={result} 
                    isStreaming={isStreaming} 
                    streamContent={streamContent} 
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
