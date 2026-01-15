"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { applyMalaysianRounding } from "@/lib/malaysianRounding";
import html2canvas from 'html2canvas-pro';
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function InvoiceDocumentPage() {
  const params = useParams();
  const invoiceId = params.id as Id<"invoices">;
  
  const invoice = useQuery(api.invoices.getInvoiceById.getInvoiceById, { invoiceId });
  const companySettings = useQuery(api.companySettings.getCompanySettings);
  const invoicePOConfig = useQuery(api.invoicePOConfig.getInvoicePOConfig);
  const reportLogoUrl = useQuery(api.reportLogo.getReportLogoUrl, { companyId: "default" });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);

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
        }
        setPdfLibLoaded(true);
      } catch (error) {
        console.error('Failed to load jsPDF:', error);
        toast.error('Failed to load PDF library');
      }
    };
    loadJsPDF();
  }, []);

  if (!invoice || !companySettings || !invoicePOConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!pdfLibLoaded) {
      toast.error('PDF library is still loading. Please wait...');
      return;
    }

    const element = document.getElementById('invoice-document');
    if (!element) {
      toast.error('Document not found');
      return;
    }

    setIsGeneratingPDF(true);

    const styleOverride = document.createElement('style');
    styleOverride.id = 'pdf-bw-override';
    styleOverride.textContent = `
      #invoice-document * {
        color: #000000 !important;
        background-color: #ffffff !important;
        border-color: #000000 !important;
        background-image: none !important;
      }
      #invoice-document table {
        border-collapse: collapse !important;
      }
      #invoice-document th,
      #invoice-document td {
        border: 1px solid #000000 !important;
        color: #000000 !important;
        background-color: #ffffff !important;
      }
    `;
    document.head.appendChild(styleOverride);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
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

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Invoice-${invoice.invoiceNo}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + (error as Error).message);
    } finally {
      const styleEl = document.getElementById('pdf-bw-override');
      if (styleEl) {
        styleEl.remove();
      }
      setIsGeneratingPDF(false);
    }
  };

  // Calculate tax and rounding with Malaysian standard
  const subtotal = (invoice.subtotal || 0) / 100;
  const discount = (invoice.discount || 0) / 100;
  const serviceTaxEnabled = invoicePOConfig.serviceTaxInvoiceEnable && invoicePOConfig.serviceTax;
  const subtotalAfterDiscount = subtotal - discount;
  const serviceTax = serviceTaxEnabled ? subtotalAfterDiscount * (invoicePOConfig.serviceTax / 100) : 0;
  let total = subtotalAfterDiscount + serviceTax;
  let roundingAdjustment = 0;
  
  // Determine if discount should be shown
  const showDiscount = invoicePOConfig.discountInvoice && invoice.invoiceType === "invoice" && discount > 0;
  
  if (invoicePOConfig.roundingEnable) {
    const roundingResult = applyMalaysianRounding(total);
    roundingAdjustment = roundingResult.adjustment;
    total = roundingResult.roundedAmount;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
      {/* Action Buttons - Hidden on print */}
      <div className="max-w-4xl mx-auto mb-4 print:hidden">
        <div className="flex items-center justify-between">
          <Link href="/admin/invoices-and-pos">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button 
              onClick={handleDownloadPDF} 
              className="gap-2"
              disabled={!pdfLibLoaded}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
        <CardContent className="p-8" id="invoice-document">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-6">
            <div className="text-center mb-4">
              {/* Logo */}
              {invoicePOConfig.showReportLogo && reportLogoUrl && (
                <div className="mb-4 flex justify-center">
                  <div className="shrink-0">
                    <img 
                      src={reportLogoUrl} 
                      alt="Company Logo" 
                      className="h-16 object-contain" 
                    />
                  </div>
                </div>
              )}
              
              {/* Company Info */}
              <h1 className="text-2xl font-bold uppercase">{invoicePOConfig.reportCompanyName || companySettings.companyName || "COMPANY NAME"}</h1>
              <p className="text-sm mt-1">{invoicePOConfig.reportCompanyAddress || companySettings.companyAddress || "Company Address"}</p>
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
            
            <div className="text-sm mt-4">
              {invoicePOConfig.regNo && (
                <p>Reg/Identification No.: {invoicePOConfig.regNo}</p>
              )}
              {invoicePOConfig.SSTRegNo && (
                <p>SST Reg No.: {invoicePOConfig.SSTRegNo}</p>
              )}
            </div>
          </div>

          {/* Customer and Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-bold mb-2">{invoice.billingDetails?.name || "Customer"}</h3>
              {invoice.billingDetails?.address && (
                <p className="text-sm">{invoice.billingDetails.address}</p>
              )}
              {invoice.billingDetails?.email && (
                <p className="text-sm">{invoice.billingDetails.email}</p>
              )}
            </div>
            
            <div className="border border-black p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-semibold">INVOICE</div>
                <div></div>
                <div>NO.</div>
                <div className="font-mono">{invoice.invoiceNo}</div>
                <div>DATE</div>
                <div>{formatDate(invoice.issuedAt || invoice.createdAt)}</div>
                <div>TERM</div>
                <div>
                  {invoice.invoiceType === "subscription" || invoice.invoiceType === "payment" 
                    ? "E-PAYMENT" 
                    : (invoicePOConfig.defaultTerm || "N/A")}
                </div>
                <div>SALESMAN</div>
                <div>{invoice.createdBy || "ADMIN"}</div>
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
                {invoice.items && invoice.items.map((item: any, index: number) => {
                  const itemTotal = (item.total || 0) / 100;
                  const itemUnitPrice = item.unitPrice ? (item.unitPrice / 100) : itemTotal;
                  
                  return (
                    <tr key={index}>
                      <td className="border border-black p-2">{index + 1}</td>
                      <td className="border border-black p-2" style={{minWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word'}}>{item.description}</td>
                      <td className="border border-black p-2 text-center">{item.quantity || 1}</td>
                      <td className="border border-black p-2 text-right">{itemUnitPrice.toFixed(2)}</td>
                      <td className="border border-black p-2 text-right font-semibold">{itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
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
                      <td className="py-2 px-2 text-right font-semibold w-24 border-l border-black">{subtotal.toFixed(2)}</td>
                    </tr>
                    
                    {showDiscount && (
                      <tr className="border-b border-black text-green-600">
                        <td className="py-2 px-2">Discount</td>
                        <td className="py-2 px-2 text-right w-16 border-l border-black">{invoicePOConfig.currency}</td>
                        <td className="py-2 px-2 text-right w-24 border-l border-black">-{discount.toFixed(2)}</td>
                      </tr>
                    )}
                    
                    {serviceTaxEnabled && (
                      <tr className="border-b border-black">
                        <td className="py-2 px-2">Service Tax {invoicePOConfig.serviceTax}%</td>
                        <td className="py-2 px-2 text-right w-16 border-l border-black">{invoicePOConfig.currency}</td>
                        <td className="py-2 px-2 text-right w-24 border-l border-black">{serviceTax.toFixed(2)}</td>
                      </tr>
                    )}
                    
                    {invoicePOConfig.roundingEnable && roundingAdjustment !== 0 && (
                      <tr className="border-b border-black">
                        <td className="py-2 px-2">Rounding Adj.</td>
                        <td className="py-2 px-2 text-right w-16 border-l border-black">{invoicePOConfig.currency}</td>
                        <td className="py-2 px-2 text-right w-24 border-l border-black">{roundingAdjustment.toFixed(2)}</td>
                      </tr>
                    )}
                    
                    <tr className="bg-gray-100 font-bold text-lg">
                      <td className="py-2 px-2">TOTAL {serviceTaxEnabled ? "(Incl. of SST)" : ""}</td>
                      <td className="py-2 px-2 text-right w-16 border-l border-black">{invoicePOConfig.currency}</td>
                      <td className="py-2 px-2 text-right w-24 border-l border-black">{total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {invoice.notes && (
            <div className="mt-6 border-t pt-4">
              <p className="font-semibold mb-2">Notes:</p>
              <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
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

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
      </div>
    </>
  );
}
