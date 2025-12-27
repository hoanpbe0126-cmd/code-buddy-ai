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

  const exportToPdf = async () => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper function to add new page if needed
      const checkNewPage = (neededHeight: number) => {
        if (yPosition + neededHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Title
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246);
      pdf.text('BÁO CÁO ĐÁNH GIÁ PROJECT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Project URL if available
      if (projectUrl) {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Repository: ${projectUrl}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
      }

      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Overall Score Section
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(margin, yPosition, pageWidth - margin * 2, 40, 3, 3, 'F');
      
      // Score circle simulation
      const scoreColor = result.overallScore >= 80 ? [34, 197, 94] : result.overallScore >= 60 ? [234, 179, 8] : [239, 68, 68];
      pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      pdf.circle(margin + 20, yPosition + 20, 15, 'F');
      
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text(result.overallScore.toString(), margin + 20, yPosition + 25, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setTextColor(30, 30, 30);
      pdf.text('Điểm đánh giá tổng thể', margin + 45, yPosition + 15);
      
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      const summaryLines = pdf.splitTextToSize(result.summary, pageWidth - margin * 2 - 50);
      pdf.text(summaryLines.slice(0, 2), margin + 45, yPosition + 25);
      
      yPosition += 50;

      // Draw Bar Chart for Categories
      checkNewPage(70);
      pdf.setFontSize(14);
      pdf.setTextColor(30, 30, 30);
      pdf.text('BIỂU ĐỒ ĐIỂM THEO TIÊU CHÍ', margin, yPosition);
      yPosition += 10;

      const barHeight = 8;
      const barMaxWidth = pageWidth - margin * 2 - 40;
      
      result.categories.forEach((category) => {
        checkNewPage(15);
        
        // Category name
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        pdf.text(category.name, margin, yPosition + 5);
        
        // Background bar
        pdf.setFillColor(230, 230, 230);
        pdf.roundedRect(margin + 35, yPosition, barMaxWidth, barHeight, 1, 1, 'F');
        
        // Score bar
        const barWidth = (category.score / 100) * barMaxWidth;
        const barColor = category.score >= 80 ? [34, 197, 94] : category.score >= 60 ? [234, 179, 8] : [239, 68, 68];
        pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
        pdf.roundedRect(margin + 35, yPosition, barWidth, barHeight, 1, 1, 'F');
        
        // Score text
        pdf.setFontSize(9);
        pdf.setTextColor(barColor[0], barColor[1], barColor[2]);
        pdf.text(`${category.score}`, margin + 35 + barMaxWidth + 3, yPosition + 6);
        
        yPosition += 12;
      });

      yPosition += 10;

      // Critical Issues
      if (result.criticalIssues && result.criticalIssues.length > 0) {
        checkNewPage(30);
        
        pdf.setFillColor(254, 242, 242);
        pdf.setDrawColor(239, 68, 68);
        pdf.roundedRect(margin, yPosition, pageWidth - margin * 2, 8 + result.criticalIssues.length * 8, 3, 3, 'FD');
        
        pdf.setFontSize(12);
        pdf.setTextColor(220, 38, 38);
        pdf.text('⚠ VẤN ĐỀ NGHIÊM TRỌNG', margin + 5, yPosition + 6);
        yPosition += 12;
        
        result.criticalIssues.forEach((issue) => {
          checkNewPage(10);
          pdf.setFontSize(9);
          pdf.setTextColor(80, 80, 80);
          const issueLines = pdf.splitTextToSize(`• ${issue}`, pageWidth - margin * 2 - 10);
          pdf.text(issueLines[0], margin + 5, yPosition);
          yPosition += 7;
        });
        
        yPosition += 10;
      }

      // Category Details
      for (const category of result.categories) {
        checkNewPage(50);
        
        const catColor = category.score >= 80 ? [34, 197, 94] : category.score >= 60 ? [234, 179, 8] : [239, 68, 68];
        
        pdf.setFillColor(catColor[0], catColor[1], catColor[2]);
        pdf.roundedRect(margin, yPosition, pageWidth - margin * 2, 10, 2, 2, 'F');
        
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`${category.name} - Điểm: ${category.score}/100`, margin + 5, yPosition + 7);
        yPosition += 15;

        // Issues
        if (category.issues.length > 0) {
          pdf.setFontSize(10);
          pdf.setTextColor(220, 38, 38);
          pdf.text('Vấn đề phát hiện:', margin, yPosition);
          yPosition += 6;
          
          category.issues.forEach((issue) => {
            checkNewPage(8);
            pdf.setFontSize(9);
            pdf.setTextColor(80, 80, 80);
            const issueLines = pdf.splitTextToSize(`• ${issue}`, pageWidth - margin * 2 - 5);
            pdf.text(issueLines[0], margin + 5, yPosition);
            yPosition += 6;
          });
          yPosition += 3;
        }

        // Suggestions
        if (category.suggestions.length > 0) {
          checkNewPage(15);
          pdf.setFontSize(10);
          pdf.setTextColor(34, 197, 94);
          pdf.text('Đề xuất cải thiện:', margin, yPosition);
          yPosition += 6;
          
          category.suggestions.forEach((suggestion) => {
            checkNewPage(8);
            pdf.setFontSize(9);
            pdf.setTextColor(80, 80, 80);
            const suggestionLines = pdf.splitTextToSize(`✓ ${suggestion}`, pageWidth - margin * 2 - 5);
            pdf.text(suggestionLines[0], margin + 5, yPosition);
            yPosition += 6;
          });
        }
        
        yPosition += 10;
      }

      // Recommendations
      if (result.recommendations && result.recommendations.length > 0) {
        checkNewPage(30);
        
        pdf.setFillColor(239, 246, 255);
        pdf.setDrawColor(59, 130, 246);
        const recBoxHeight = 12 + result.recommendations.length * 8;
        pdf.roundedRect(margin, yPosition, pageWidth - margin * 2, Math.min(recBoxHeight, pageHeight - yPosition - margin), 3, 3, 'FD');
        
        pdf.setFontSize(12);
        pdf.setTextColor(37, 99, 235);
        pdf.text('💡 ĐỀ XUẤT CẢI THIỆN TỔNG THỂ', margin + 5, yPosition + 8);
        yPosition += 14;
        
        result.recommendations.forEach((rec) => {
          checkNewPage(10);
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          const recLines = pdf.splitTextToSize(`✓ ${rec}`, pageWidth - margin * 2 - 10);
          pdf.text(recLines.slice(0, 2).join('\n'), margin + 5, yPosition);
          yPosition += recLines.slice(0, 2).length * 5 + 3;
        });
      }

      // Footer on each page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Trang ${i}/${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        pdf.text('Được tạo bởi Code Review AI', pageWidth - margin, pageHeight - 8, { align: 'right' });
      }

      // Save PDF
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
