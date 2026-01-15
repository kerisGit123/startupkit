"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, AlertCircle, Clock } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { applyMalaysianRounding } from "@/lib/malaysianRounding";
import { toast } from "sonner";
import html2canvas from 'html2canvas-pro';

export default function SharedPOPage() {
  const params = useParams();
  const shareToken = params.token as string;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);

  // Load jsPDF library only (html2canvas-pro is imported)
  useEffect(() => {
    const loadJsPDF = async () => {
      try {
        if (!(window as any).jspdf) {
          const jsPDFScript = document.createElement('script');
          jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          document.body.appendChild(jsPDFScript);
          await new Promise((resolve, reject) => {
            jsPDFScript.onload = resolve;
            jsPDFScript.onerror = reject;
          });
          console.log('jsPDF loaded');
        }

        setPdfLibLoaded(true);
        console.log('PDF library loaded successfully');
      } catch (error) {
        console.error('Failed to load jsPDF:', error);
        toast.error('Failed to load PDF library');
      }
    };

    loadJsPDF();
  }, []);
  
  const result = useQuery(api.purchaseOrders.createShareLink.getPOByShareToken, { shareToken });
  const companySettings = useQuery(api.companySettings.getCompanySettings);
  const invoicePOConfig = useQuery(api.invoicePOConfig.getInvoicePOConfig);

  // Calculate expiry status - must be before conditional returns to maintain hook order
  const isExpiringSoon = useMemo(() => {
    if (!result || 'error' in result) return false;
    const now = Date.now();
    return result.shareLink.expiresAt - now < 24 * 60 * 60 * 1000; // Less than 24 hours
  }, [result]);

  if (!result || !companySettings || !invoicePOConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if ('error' in result) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">{result.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { po, shareLink } = result;
  const expiryDate = new Date(shareLink.expiresAt);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!pdfLibLoaded) {
      toast.error('PDF library is still loading. Please wait...');
      return;
    }

    const element = document.getElementById('po-document');
    if (!element) {
      toast.error('Document not found');
      return;
    }

    setIsGeneratingPDF(true);
    console.log('Starting PDF generation with html2canvas-pro...');

    // Inject black & white CSS to override all colors
    const styleOverride = document.createElement('style');
    styleOverride.id = 'pdf-bw-override';
    styleOverride.textContent = `
      #po-document * {
        color: #000000 !important;
        background-color: #ffffff !important;
        border-color: #000000 !important;
        background-image: none !important;
      }
      #po-document table {
        border-collapse: collapse !important;
      }
      #po-document th,
      #po-document td {
        border: 1px solid #000000 !important;
        color: #000000 !important;
        background-color: #ffffff !important;
      }
    `;
    document.head.appendChild(styleOverride);

    try {
      // Small delay to let styles apply
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use html2canvas-pro to capture the element
      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      console.log('Canvas created with html2canvas-pro, size:', canvas.width, 'x', canvas.height);

      // Get the image data
      const imgData = canvas.toDataURL('image/png');

      // Calculate PDF dimensions
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Save the PDF
      pdf.save(`PO-${po.poNo}.pdf`);
      console.log('PDF saved successfully');
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + (error as Error).message);
    } finally {
      // Remove the style override
      const styleEl = document.getElementById('pdf-bw-override');
      if (styleEl) {
        styleEl.remove();
      }
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Expiry Warning - Hidden on print */}
        {isExpiringSoon && (
          <div className="max-w-4xl mx-auto mb-4 print:hidden">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">Link Expiring Soon</p>
                <p className="text-sm text-yellow-700">
                  This share link will expire on {expiryDate.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Hidden on print */}
        <div className="max-w-4xl mx-auto mb-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Shared Purchase Order • Accessed {shareLink.accessCount} times
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button 
                onClick={handleDownloadPDF} 
                className="gap-2"
                disabled={!pdfLibLoaded || isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Generating...
                  </>
                ) : !pdfLibLoaded ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* PO Document */}
        <Card className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
          <CardContent className="p-8" id="po-document">
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-6">
              <div className="text-center mb-4">
                <div className="mb-4 flex justify-center">
                  <img 
                    src={invoicePOConfig.reportLogoUrl || "/logo.png"} 
                    alt="Company Logo" 
                    className="h-16 object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold uppercase">
                  {invoicePOConfig.reportCompanyName || companySettings.companyName || "COMPANY NAME"}
                </h1>
                <p className="text-sm mt-1">
                  {invoicePOConfig.reportCompanyAddress || companySettings.companyAddress || "Company Address"}
                </p>
                {(invoicePOConfig.reportCompanyPhone || companySettings.companyPhone) && (
                  <p className="text-sm">Tel: {invoicePOConfig.reportCompanyPhone || companySettings.companyPhone}</p>
                )}
                {(invoicePOConfig.reportCompanyEmail || companySettings.companyEmail) && (
                  <p className="text-sm">Email: {invoicePOConfig.reportCompanyEmail || companySettings.companyEmail}</p>
                )}
                {invoicePOConfig.websiteURL && (
                  <p className="text-sm">{invoicePOConfig.websiteURL}</p>
                )}
              </div>
              
              <div className="text-sm mt-2">
                {invoicePOConfig.regNo && (
                  <p>Reg/Identification No.: {invoicePOConfig.regNo}</p>
                )}
                {invoicePOConfig.SSTRegNo && (
                  <p>SST Reg No.: {invoicePOConfig.SSTRegNo}</p>
                )}
              </div>
            </div>

            {/* Vendor and PO Details */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <p className="font-bold mb-2">{po.vendorName}</p>
                {po.vendorEmail && <p className="text-sm">{po.vendorEmail}</p>}
                {po.vendorAddress && <p className="text-sm whitespace-pre-line">{po.vendorAddress}</p>}
              </div>
              
              <div className="border border-black p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold">PURCHASE ORDER</div>
                  <div></div>
                  <div>NO.</div>
                  <div className="font-mono">{po.poNo}</div>
                  <div>DATE</div>
                  <div>{formatDate(po.issuedAt || po.createdAt)}</div>
                  <div>TERM</div>
                  <div>{po.paymentTerms || "N/A"}</div>
                  {po.dueDate && (
                    <>
                      <div>DUE DATE</div>
                      <div>{formatDate(po.dueDate)}</div>
                    </>
                  )}
                  <div>PAGE</div>
                  <div>1 of 1</div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-left w-12">NO.</th>
                    <th className="border border-black p-2 text-left" style={{minWidth: '300px'}}>DESCRIPTION</th>
                    <th className="border border-black p-2 text-center w-20">QTY</th>
                    <th className="border border-black p-2 text-right w-28">UNIT PRICE</th>
                    <th className="border border-black p-2 text-right w-32">TOTAL ({invoicePOConfig.currency})</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-black p-2">{index + 1}</td>
                      <td className="border border-black p-2" style={{minWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word'}}>{item.description}</td>
                      <td className="border border-black p-2 text-center">{item.quantity.toFixed(3)}</td>
                      <td className="border border-black p-2 text-right">{(item.unitPrice / 100).toFixed(2)}</td>
                      <td className="border border-black p-2 text-right font-semibold">
                        {(item.total / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals and Payment Section */}
            <div className="border-t-2 border-black pt-4">
              <div className="grid grid-cols-2 gap-8">
                {/* Payment Information */}
                {(invoicePOConfig.bankName || invoicePOConfig.paymentNote) && (
                  <div>
                    <p className="font-semibold mb-2">Payment Information:</p>
                    {invoicePOConfig.bankName && (
                      <p className="text-sm">Bank: {invoicePOConfig.bankName}</p>
                    )}
                    {invoicePOConfig.bankAccount && (
                      <p className="text-sm">Account: {invoicePOConfig.bankAccount}</p>
                    )}
                    {invoicePOConfig.paymentNote && (
                      <p className="text-sm mt-2 whitespace-pre-line">{invoicePOConfig.paymentNote}</p>
                    )}
                  </div>
                )}
                
                {/* Totals Table */}
                <div>
                  <table className="w-full border-collapse border border-black">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="py-2 px-2 font-semibold">Sub Total (Excl. SST)</td>
                        <td className="py-2 px-2 text-right font-semibold w-16 border-l border-black">{invoicePOConfig.currency}</td>
                        <td className="py-2 px-2 text-right font-semibold w-24 border-l border-black">{(po.subtotal / 100).toFixed(2)}</td>
                      </tr>
                      
                      {po.discount && po.discount > 0 && (
                        <tr className="border-b border-black text-green-600">
                          <td className="py-2 px-2">Discount</td>
                          <td className="py-2 px-2 text-right w-16 border-l border-black">{invoicePOConfig.currency}</td>
                          <td className="py-2 px-2 text-right w-24 border-l border-black">-{(po.discount / 100).toFixed(2)}</td>
                        </tr>
                      )}
                      
                      {po.tax && po.tax > 0 && (
                        <tr className="border-b border-black">
                          <td className="py-2 px-2">Service Tax {po.taxRate}%</td>
                          <td className="py-2 px-2 text-right w-16 border-l border-black">{invoicePOConfig.currency}</td>
                          <td className="py-2 px-2 text-right w-24 border-l border-black">{(po.tax / 100).toFixed(2)}</td>
                        </tr>
                      )}
                      
                      {invoicePOConfig?.roundingEnable && (() => {
                        const subtotal = (po.subtotal || 0) / 100;
                        const discount = (po.discount || 0) / 100;
                        const tax = (po.tax || 0) / 100;
                        const beforeRounding = subtotal - discount + tax;
                        const afterRounding = po.total / 100;
                        const adjustment = afterRounding - beforeRounding;
                        return Math.abs(adjustment) > 0.001;
                      })() && (
                        <tr className="border-b border-black">
                          <td className="py-2 px-2">Rounding Adj.</td>
                          <td className="py-2 px-2 text-right w-16 border-l border-black">{invoicePOConfig.currency}</td>
                          <td className="py-2 px-2 text-right w-24 border-l border-black">
                            {(() => {
                              const subtotal = (po.subtotal || 0) / 100;
                              const discount = (po.discount || 0) / 100;
                              const tax = (po.tax || 0) / 100;
                              const beforeRounding = subtotal - discount + tax;
                              const afterRounding = po.total / 100;
                              return (afterRounding - beforeRounding).toFixed(2);
                            })()}
                          </td>
                        </tr>
                      )}
                      
                      <tr className="bg-gray-100 font-bold text-lg">
                        <td className="py-2 px-2">TOTAL {po.tax && po.tax > 0 ? "(Incl. of SST)" : ""}</td>
                        <td className="py-2 px-2 text-right w-16 border-l border-black">{invoicePOConfig.currency}</td>
                        <td className="py-2 px-2 text-right w-24 border-l border-black">
                          {(() => {
                            const totalInDollars = po.total / 100;
                            if (invoicePOConfig?.roundingEnable) {
                              const result = applyMalaysianRounding(totalInDollars);
                              return result.roundedAmount.toFixed(2);
                            }
                            return totalInDollars.toFixed(2);
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Notes */}
            {po.notes && (
              <div className="mt-6 border-t pt-4">
                <p className="font-semibold mb-2">Notes:</p>
                <p className="text-sm whitespace-pre-line">{po.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t text-xs text-center text-gray-600">
              <p>{invoicePOConfig.footer || invoicePOConfig.documentFooter || "This is a computer-generated document. No signature is required."}</p>
              {invoicePOConfig.generateFooterDate && (
                <p className="mt-1">Generated on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
