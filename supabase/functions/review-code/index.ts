import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Bạn là chuyên gia đánh giá code với nhiều năm kinh nghiệm. Phân tích code được cung cấp và trả về JSON với cấu trúc sau:

{
  "overallScore": <số từ 0-100>,
  "summary": "<tóm tắt ngắn gọn về chất lượng code>",
  "categories": [
    {
      "name": "SEO",
      "score": <số từ 0-100>,
      "issues": ["<vấn đề 1>", "<vấn đề 2>"],
      "suggestions": ["<đề xuất 1>", "<đề xuất 2>"]
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
      "issues": ["<vấn đề về code style>"],
      "suggestions": ["<cách cải thiện>"]
    },
    {
      "name": "Chức năng",
      "score": <số từ 0-100>,
      "issues": ["<vấn đề logic>"],
      "suggestions": ["<cải thiện>"]
    }
  ],
  "fixedCode": "<code đã được tối ưu nếu có thể>"
}

Hãy đánh giá kỹ lưỡng và đưa ra phản hồi bằng tiếng Việt. CHỈ trả về JSON, không có text khác.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    
    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Code is required' }),
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

    console.log('Sending request to Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Phân tích code sau:\n\n\`\`\`\n${code}\n\`\`\`` }
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
    console.error('Error in review-code function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
