import { Header } from '@/components/Header';
import { CodeInput } from '@/components/CodeInput';
import { ReviewResult } from '@/components/ReviewResult';
import { FeatureCards } from '@/components/FeatureCards';
import { useCodeReview } from '@/hooks/useCodeReview';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  const { isLoading, isStreaming, streamContent, result, reviewCode } = useCodeReview();

  return (
    <>
      <Helmet>
        <title>Code Review AI - Đánh giá & Tối ưu Code Tự động</title>
        <meta name="description" content="Công cụ AI đánh giá code tự động: kiểm tra SEO, bảo mật, clean code và đề xuất cải thiện. Tối ưu code của bạn ngay hôm nay!" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-5xl">
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
          <FeatureCards />

          {/* Code Input */}
          <section className="mb-8">
            <CodeInput onSubmit={reviewCode} isLoading={isLoading} />
          </section>

          {/* Results */}
          {(isStreaming || result) && (
            <section>
              <ReviewResult 
                result={result} 
                isStreaming={isStreaming} 
                streamContent={streamContent} 
              />
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
