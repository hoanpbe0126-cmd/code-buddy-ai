import { useState, useRef } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReviewCategory {
  name: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

interface ReviewResultData {
  overallScore: number;
  summary: string;
  categories: ReviewCategory[];
  criticalIssues?: string[];
  recommendations?: string[];
}

interface ExportPdfButtonProps {
  result: ReviewResultData;
  projectUrl?: string;
}

export const ExportPdfButton = ({ result, projectUrl }: ExportPdfButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const hiddenRef = useRef<HTMLDivElement>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const exportToPdf = async () => {
    setIsExporting(true);
    
    try {
      // Create hidden container for rendering
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      `;
      
      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; font-size: 28px; margin: 0;">BÁO CÁO ĐÁNH GIÁ PROJECT</h1>
          ${projectUrl ? `<p style="color: #666; font-size: 12px; margin: 10px 0;">Repository: ${projectUrl}</p>` : ''}
          <p style="color: #666; font-size: 12px; margin: 5px 0;">Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div style="background: #f5f7fa; border-radius: 12px; padding: 25px; margin-bottom: 30px; display: flex; align-items: center; gap: 20px;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: ${getScoreColor(result.overallScore)}; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 28px; font-weight: bold;">${result.overallScore}</span>
          </div>
          <div>
            <h2 style="margin: 0 0 10px 0; color: #1e1e1e; font-size: 18px;">Điểm đánh giá tổng thể</h2>
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.5;">${result.summary}</p>
          </div>
        </div>

        <h3 style="color: #1e1e1e; font-size: 16px; margin-bottom: 15px; text-align: center;">BIỂU ĐỒ RADAR - ĐÁNH GIÁ CÁC TIÊU CHÍ</h3>
        <div style="display: flex; justify-content: center; margin-bottom: 30px;">
          <svg width="300" height="300" viewBox="-150 -150 300 300">
            ${(() => {
              const numCats = result.categories.length;
              const angleStep = (2 * Math.PI) / numCats;
              const radius = 100;
              
              // Grid levels
              let gridLines = '';
              [20, 40, 60, 80, 100].forEach(level => {
                const r = (level / 100) * radius;
                const points = result.categories.map((_, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
                }).join(' ');
                gridLines += `<polygon points="${points}" fill="none" stroke="#ddd" stroke-width="1"/>`;
              });
              
              // Axis lines
              let axisLines = '';
              result.categories.forEach((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                axisLines += `<line x1="0" y1="0" x2="${radius * Math.cos(angle)}" y2="${radius * Math.sin(angle)}" stroke="#ccc" stroke-width="1"/>`;
              });
              
              // Data polygon
              const dataPoints = result.categories.map((cat, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const r = (cat.score / 100) * radius;
                return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
              }).join(' ');
              
              // Labels
              let labels = '';
              result.categories.forEach((cat, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const labelR = radius + 20;
                const x = labelR * Math.cos(angle);
                const y = labelR * Math.sin(angle);
                const anchor = Math.cos(angle) > 0.3 ? 'start' : Math.cos(angle) < -0.3 ? 'end' : 'middle';
                labels += `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="10" fill="${getScoreColor(cat.score)}">${cat.name.substring(0, 12)} (${cat.score})</text>`;
              });
              
              // Data points
              let dots = '';
              result.categories.forEach((cat, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const r = (cat.score / 100) * radius;
                dots += `<circle cx="${r * Math.cos(angle)}" cy="${r * Math.sin(angle)}" r="5" fill="${getScoreColor(cat.score)}"/>`;
              });
              
              return gridLines + axisLines + `<polygon points="${dataPoints}" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" stroke-width="2"/>` + dots + labels;
            })()}
          </svg>
        </div>

        <h3 style="color: #1e1e1e; font-size: 16px; margin-bottom: 15px;">CHI TIẾT ĐIỂM THEO TIÊU CHÍ</h3>
        ${result.categories.map(cat => `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 12px; color: #444;">${cat.name}</span>
              <span style="font-size: 12px; font-weight: bold; color: ${getScoreColor(cat.score)};">${cat.score}/100</span>
            </div>
            <div style="background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
              <div style="background: ${getScoreColor(cat.score)}; height: 100%; width: ${cat.score}%; border-radius: 4px;"></div>
            </div>
          </div>
        `).join('')}

        ${result.criticalIssues && result.criticalIssues.length > 0 ? `
          <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <h4 style="color: #dc2626; margin: 0 0 10px 0; font-size: 14px;">⚠ VẤN ĐỀ NGHIÊM TRỌNG</h4>
            ${result.criticalIssues.map(issue => `<p style="margin: 5px 0; font-size: 12px; color: #555;">• ${issue}</p>`).join('')}
          </div>
        ` : ''}

        ${result.categories.map(cat => `
          <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <div style="background: ${getScoreColor(cat.score)}; color: white; padding: 10px 15px; border-radius: 6px; margin-bottom: 10px;">
              <strong>${cat.name} - Điểm: ${cat.score}/100</strong>
            </div>
            ${cat.issues.length > 0 ? `
              <div style="margin-bottom: 10px;">
                <p style="color: #dc2626; font-size: 13px; font-weight: bold; margin: 0 0 5px 0;">Vấn đề phát hiện:</p>
                ${cat.issues.map(issue => `<p style="margin: 3px 0 3px 10px; font-size: 12px; color: #555;">• ${issue}</p>`).join('')}
              </div>
            ` : ''}
            ${cat.suggestions.length > 0 ? `
              <div>
                <p style="color: #22c55e; font-size: 13px; font-weight: bold; margin: 0 0 5px 0;">Đề xuất cải thiện:</p>
                ${cat.suggestions.map(sug => `<p style="margin: 3px 0 3px 10px; font-size: 12px; color: #555;">✓ ${sug}</p>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}

        ${result.recommendations && result.recommendations.length > 0 ? `
          <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-top: 25px;">
            <h4 style="color: #2563eb; margin: 0 0 10px 0; font-size: 14px;">💡 ĐỀ XUẤT CẢI THIỆN TỔNG THỂ</h4>
            ${result.recommendations.map(rec => `<p style="margin: 5px 0; font-size: 12px; color: #444;">✓ ${rec}</p>`).join('')}
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 10px;">Được tạo bởi Code Review AI</p>
        </div>
      `;
      
      document.body.appendChild(container);
      
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Remove container
      document.body.removeChild(container);
      
      // Create PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save
      const fileName = `project-review-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={exportToPdf} 
      disabled={isExporting}
      variant="outline"
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang xuất PDF...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Xuất PDF
        </>
      )}
    </Button>
  );
};