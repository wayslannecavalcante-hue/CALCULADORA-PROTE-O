import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generatePDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // Add a loading cursor or state handling in the component if needed
    document.body.style.cursor = 'wait';

    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      backgroundColor: '#09090b', // Match the app background color (Zinc 950)
      logging: false,
      useCORS: true, // Handle cross-origin images if any
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Create PDF with orientation based on the element's aspect ratio
    // We use a custom format to match the captured content exactly, 
    // effectively creating a "screenshot" PDF rather than forcing it into A4.
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height] 
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${fileName}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Erro ao gerar o PDF. Tente novamente.');
  } finally {
    document.body.style.cursor = 'default';
  }
};