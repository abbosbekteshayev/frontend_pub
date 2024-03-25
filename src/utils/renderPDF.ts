import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const downloadAsPDF = async (html: HTMLElement, filename: string) => {
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4',
    });

    const canvas = await html2canvas(html);

    const imgData = canvas.toDataURL('image/png');

    const marginLeft = 24;
    const marginRight = 16;
    const marginTop = 16;
    const marginBottom = 16;

    const imgWidth = pdf.internal.pageSize.getWidth() - marginLeft - marginRight;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight() - marginTop - marginBottom;

    let heightLeft = imgHeight;
    let position = marginTop; // Start at the top margin

    pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);

    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
        position = heightLeft - imgHeight + marginTop; // Adjust for the top margin
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    const blob = pdf.output('blob');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}
