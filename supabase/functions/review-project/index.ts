import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Bạn là chuyên gia đánh giá code với nhiều năm kinh nghiệm. Phân tích TOÀN BỘ PROJECT được cung cấp và trả về JSON với cấu trúc sau:

{
  "overallScore": <số từ 0-100>,
  "summary": "<tóm tắt tổng quan về chất lượng project>",
  "categories": [
    {
      "name": "Kiến trúc",
      "score": <số từ 0-100>,
      "issues": ["<vấn đề về cấu trúc project>"],
      "suggestions": ["<đề xuất cải thiện>"]
    },
    {
      "name": "SEO",
      "score": <số từ 0-100>,
      "issues": ["<vấn đề SEO phát hiện>"],
      "suggestions": ["<cách cải thiện SEO>"]
    },
    {
      "name": "Bảo mật",
      "score": <số từ 0-100>,
      "issues": ["<lỗ hổng bảo mật phát hiện>"],
      "suggestions": ["<cách khắc phục>"]
    },
    {
      "name": "Clean Code",
      "score": <số từ 0-100>,
      "issues": ["<vấn đề về code style, naming, DRY>"],
      "suggestions": ["<cách cải thiện>"]
    },
    {
      "name": "Chức năng",
      "score": <số từ 0-100>,
      "issues": ["<vấn đề logic, bugs tiềm ẩn>"],
      "suggestions": ["<cải thiện>"]
    },
    {
      "name": "Performance",
      "score": <số từ 0-100>,
      "issues": ["<vấn đề hiệu năng>"],
      "suggestions": ["<tối ưu hóa>"]
    }
  ],
  "criticalIssues": ["<các vấn đề nghiêm trọng cần sửa ngay>"],
  "recommendations": ["<đề xuất cải thiện tổng thể cho project>"]
}

Hãy đánh giá KỸ LƯỠNG toàn bộ project, xem xét:
- Cấu trúc thư mục và file
- Dependencies và package.json
- Cách tổ chức components/modules
- Error handling
- Type safety (nếu TypeScript)
- API design
- State management
- Code duplication
- Naming conventions

Phản hồi bằng tiếng Việt. CHỈ trả về JSON, không có text khác.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, repoName } = await req.json();
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Files array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format files for AI
    const formattedFiles = files.map((f: { path: string; content: string }) => 
      `### File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``
    ).join('\n\n');

    const userPrompt = `Đánh giá project "${repoName || 'Unknown'}" với ${files.length} files sau:

${formattedFiles}`;

    console.log('Sending request to Lovable AI for project review...');
    console.log(`Total files: ${files.length}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Hết credits, vui lòng nạp thêm.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Streaming response from AI...');

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in review-project function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
