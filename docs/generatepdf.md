# PDF Generation Documentation

This document explains how PDF generation works in the application and provides troubleshooting guidance.

## Current Implementation: html2pdf.js

We use **html2pdf.js** library to convert HTML elements to PDF documents. This library combines html2canvas and jsPDF to provide a simple API for PDF generation.

### CDN Integration

```html
<Script
  src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js"
  integrity="sha512-MpDFIChbcXl2QgipQrt1VcPHMldRILetapBl5MPCA9Y8r7qvlwx1/Mc9hNTzY+kS5kX6PdoDq41ws1HiVNLdZA=="
  crossOrigin="anonymous"
  referrerPolicy="no-referrer"
/>
```

### Basic Usage

```tsx
const handleDownloadPDF = () => {
  // Get the HTML element to convert
  const element = document.getElementById('po-document');
  if (!element) return;

  // Configure PDF options
  const opt = {
    margin: 10,                                    // Margin in mm
    filename: `PO-${po.poNo}.pdf`,                // Output filename
    image: { type: 'jpeg', quality: 0.98 },       // Image quality
    html2canvas: { scale: 2, useCORS: true },     // Canvas rendering options
    jsPDF: { 
      unit: 'mm',                                 // Unit of measurement
      format: 'a4',                               // Paper size
      orientation: 'portrait'                     // Page orientation
    }
  };

  // Generate and download PDF
  (window as any).html2pdf().set(opt).from(element).save();
};
```

### Implementation Files

1. **Admin PO Page**: `app/admin/po/[id]/page.tsx`
2. **Shared PO Page**: `app/share/po/[token]/page.tsx`

Both files use the same PDF generation approach.

## Alternative: pdf-lib (Not Currently Used)

If you need more control over PDF generation, you can use **pdf-lib** which creates PDFs programmatically.

### Example with pdf-lib

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://unpkg.com/pdf-lib@1.4.0"></script>
    <script src="https://unpkg.com/downloadjs@1.4.7"></script>
  </head>

  <body>
    <p>Click the button to create a new PDF document with <code>pdf-lib</code></p>
    <button onclick="createPdf()">Create PDF</button>
    <p class="small">(Your browser will download the resulting file)</p>
  </body>

  <script>
    const { PDFDocument, StandardFonts, rgb } = PDFLib

    async function createPdf() {
      // Create a new PDFDocument
      const pdfDoc = await PDFDocument.create()

      // Embed the Times Roman font
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)

      // Add a blank page to the document
      const page = pdfDoc.addPage()

      // Get the width and height of the page
      const { width, height } = page.getSize()

      // Draw a string of text toward the top of the page
      const fontSize = 30
      page.drawText('Creating PDFs in JavaScript is awesome!', {
        x: 50,
        y: height - 4 * fontSize,
        size: fontSize,
        font: timesRomanFont,
        color: rgb(0, 0.53, 0.71),
      })

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save()

      // Trigger the browser to download the PDF document
      download(pdfBytes, "pdf-lib_creation_example.pdf", "application/pdf");
    }
  </script>
</html>
```

### Why We Use html2pdf.js Instead

**Advantages of html2pdf.js:**
- ✅ Converts existing HTML directly to PDF
- ✅ Preserves styling and layout
- ✅ Simple one-line API
- ✅ No need to manually position elements
- ✅ Works with complex layouts and tables

**When to use pdf-lib:**
- Need to modify existing PDFs
- Require precise control over every element
- Building PDFs from scratch programmatically
- Need to add digital signatures or forms

## Troubleshooting PDF Generation

### Issue: PDF Download Button Not Working

**Symptoms:**
- Clicking "Download PDF" does nothing
- Console shows errors about `html2pdf` not defined

**Solutions:**

1. **Check Script Loading**
   ```tsx
   // Ensure Script component is present in the page
   <Script
     src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js"
     integrity="sha512-MpDFIChbcXl2QgipQrt1VcPHMldRILetapBl5MPCA9Y8r7qvlwx1/Mc9hNTzY+kS5kX6PdoDq41ws1HiVNLdZA=="
     crossOrigin="anonymous"
     referrerPolicy="no-referrer"
   />
   ```

2. **Verify Element ID**
   ```tsx
   // Make sure the element ID matches
   const element = document.getElementById('po-document');
   if (!element) {
     console.error('Element not found!');
     return;
   }
   ```

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for JavaScript errors
   - Verify `html2pdf` is loaded: type `html2pdf` in console

4. **Test with Timeout**
   ```tsx
   const handleDownloadPDF = () => {
     // Wait for script to load
     setTimeout(() => {
       const element = document.getElementById('po-document');
       if (!element || !(window as any).html2pdf) {
         console.error('PDF library not loaded or element not found');
         return;
       }

       const opt = {
         margin: 10,
         filename: `PO-${po.poNo}.pdf`,
         image: { type: 'jpeg', quality: 0.98 },
         html2canvas: { scale: 2, useCORS: true },
         jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
       };

       (window as any).html2pdf().set(opt).from(element).save();
     }, 100);
   };
   ```

### Issue: PDF Quality is Poor

**Solutions:**
- Increase `scale` in html2canvas options: `scale: 3`
- Increase image quality: `quality: 1.0`
- Use PNG instead of JPEG: `type: 'png'`

### Issue: PDF Layout is Broken

**Solutions:**
- Add `print:hidden` class to elements that shouldn't appear in PDF
- Ensure the target element has proper width constraints
- Use inline styles for critical layout properties
- Test with `window.print()` first to verify print layout

### Issue: Images Not Showing in PDF

**Solutions:**
- Enable CORS: `useCORS: true` in html2canvas options
- Use absolute URLs for images
- Ensure images are loaded before generating PDF
- Check image file formats (PNG, JPEG work best)

## Best Practices

1. **Element Structure**
   - Wrap content in a single container with unique ID
   - Use semantic HTML
   - Avoid complex CSS transforms

2. **Styling**
   - Use inline styles for critical properties
   - Test with print media queries
   - Keep layouts simple and table-based

3. **Performance**
   - Generate PDFs on user action (button click)
   - Show loading indicator during generation
   - Cache generated PDFs if needed

4. **Testing**
   - Test in multiple browsers
   - Verify on different screen sizes
   - Check with various content lengths
   - Test with images and logos

## Example: Complete Implementation

```tsx
"use client";

import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function POPage() {
  const handleDownloadPDF = () => {
    const element = document.getElementById('po-document');
    if (!element) {
      console.error('Document element not found');
      return;
    }

    if (!(window as any).html2pdf) {
      console.error('html2pdf library not loaded');
      return;
    }

    const opt = {
      margin: 10,
      filename: 'purchase-order.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    (window as any).html2pdf().set(opt).from(element).save();
  };

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js"
        integrity="sha512-MpDFIChbcXl2QgipQrt1VcPHMldRILetapBl5MPCA9Y8r7qvlwx1/Mc9hNTzY+kS5kX6PdoDq41ws1HiVNLdZA=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      
      <div className="print:hidden">
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div id="po-document" className="bg-white p-8">
        {/* Your document content here */}
        <h1>Purchase Order</h1>
        <p>Document content...</p>
      </div>
    </>
  );
}
```

## Resources

- [html2pdf.js Documentation](https://ekoopmans.github.io/html2pdf.js/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/)

## Support

If PDF generation is still not working:
1. Check browser console for errors
2. Verify CDN is accessible
3. Test with a simple HTML element first
4. Ensure no ad blockers are interfering
5. Try in incognito/private browsing mode
