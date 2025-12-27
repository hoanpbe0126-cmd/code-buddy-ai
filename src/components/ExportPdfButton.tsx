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

      // Draw Radar Chart for Categories
      checkNewPage(100);
      pdf.setFontSize(14);
      pdf.setTextColor(30, 30, 30);
      pdf.text('BIỂU ĐỒ RADAR - ĐÁNH GIÁ CÁC TIÊU CHÍ', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Radar chart configuration
      const radarCenterX = pageWidth / 2;
      const radarCenterY = yPosition + 45;
      const radarRadius = 35;
      const numCategories = result.categories.length;
      const angleStep = (2 * Math.PI) / numCategories;

      // Draw radar grid (5 levels: 20, 40, 60, 80, 100)
      const gridLevels = [20, 40, 60, 80, 100];
      gridLevels.forEach((level) => {
        const levelRadius = (level / 100) * radarRadius;
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.3);
        
        // Draw polygon for this level
        for (let i = 0; i < numCategories; i++) {
          const angle1 = i * angleStep - Math.PI / 2;
          const angle2 = ((i + 1) % numCategories) * angleStep - Math.PI / 2;
          const x1 = radarCenterX + levelRadius * Math.cos(angle1);
          const y1 = radarCenterY + levelRadius * Math.sin(angle1);
          const x2 = radarCenterX + levelRadius * Math.cos(angle2);
          const y2 = radarCenterY + levelRadius * Math.sin(angle2);
          pdf.line(x1, y1, x2, y2);
        }
      });

      // Draw axis lines
      for (let i = 0; i < numCategories; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = radarCenterX + radarRadius * Math.cos(angle);
        const y = radarCenterY + radarRadius * Math.sin(angle);
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.5);
        pdf.line(radarCenterX, radarCenterY, x, y);
      }

      // Draw data polygon (filled)
      const dataPoints: { x: number; y: number }[] = [];
      result.categories.forEach((category, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const pointRadius = (category.score / 100) * radarRadius;
        dataPoints.push({
          x: radarCenterX + pointRadius * Math.cos(angle),
          y: radarCenterY + pointRadius * Math.sin(angle)
        });
      });

      // Fill the data polygon with semi-transparent color
      pdf.setFillColor(59, 130, 246);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.3 }));
      
      // Draw filled polygon manually
      if (dataPoints.length > 2) {
        pdf.setDrawColor(59, 130, 246);
        pdf.setLineWidth(1.5);
        
        // Create path for polygon
        for (let i = 0; i < dataPoints.length; i++) {
          const next = (i + 1) % dataPoints.length;
          pdf.line(dataPoints[i].x, dataPoints[i].y, dataPoints[next].x, dataPoints[next].y);
        }
      }

      // Reset opacity
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      // Draw data points
      dataPoints.forEach((point, i) => {
        const score = result.categories[i].score;
        const pointColor = score >= 80 ? [34, 197, 94] : score >= 60 ? [234, 179, 8] : [239, 68, 68];
        pdf.setFillColor(pointColor[0], pointColor[1], pointColor[2]);
        pdf.circle(point.x, point.y, 2, 'F');
      });

      // Draw category labels
      pdf.setFontSize(8);
      result.categories.forEach((category, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = radarRadius + 8;
        const x = radarCenterX + labelRadius * Math.cos(angle);
        const y = radarCenterY + labelRadius * Math.sin(angle);
        
        // Adjust text alignment based on position
        const scoreColor = category.score >= 80 ? [34, 197, 94] : category.score >= 60 ? [234, 179, 8] : [239, 68, 68];
        pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        
        let align: 'center' | 'left' | 'right' = 'center';
        if (Math.cos(angle) > 0.3) align = 'left';
        else if (Math.cos(angle) < -0.3) align = 'right';
        
        const shortName = category.name.length > 12 ? category.name.substring(0, 10) + '...' : category.name;
        pdf.text(`${shortName} (${category.score})`, x, y, { align });
      });

      yPosition = radarCenterY + radarRadius + 25;

      // Draw Bar Chart as secondary visualization
      checkNewPage(50);
      pdf.setFontSize(12);
      pdf.setTextColor(30, 30, 30);
      pdf.text('CHI TIẾT ĐIỂM THEO TIÊU CHÍ', margin, yPosition);
      yPosition += 8;

      const barHeight = 6;
      const barMaxWidth = pageWidth - margin * 2 - 45;
      
      result.categories.forEach((category) => {
        checkNewPage(12);
        
        // Category name
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        const shortName = category.name.length > 12 ? category.name.substring(0, 10) + '...' : category.name;
        pdf.text(shortName, margin, yPosition + 4);
        
        // Background bar
        pdf.setFillColor(230, 230, 230);
        pdf.roundedRect(margin + 38, yPosition, barMaxWidth, barHeight, 1, 1, 'F');
        
        // Score bar
        const barWidth = (category.score / 100) * barMaxWidth;
        const barColor = category.score >= 80 ? [34, 197, 94] : category.score >= 60 ? [234, 179, 8] : [239, 68, 68];
        pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
        pdf.roundedRect(margin + 38, yPosition, barWidth, barHeight, 1, 1, 'F');
        
        // Score text
        pdf.setFontSize(8);
        pdf.setTextColor(barColor[0], barColor[1], barColor[2]);
        pdf.text(`${category.score}`, margin + 38 + barMaxWidth + 3, yPosition + 5);
        
        yPosition += 10;
      });

      yPosition += 8;

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
