import { toast } from 'sonner';

// Note: pdfjs-dist and mammoth will be dynamically imported when needed

const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v0';

/**
 * Convert markdown to clean plain text for AI knowledge base
 */
function markdownToPlainText(markdown: string): string {
  let text = markdown;
  
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`[^`]+`/g, '');
  
  // Convert links [text](url) to just text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
  
  // Remove headers markdown
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Convert bullet points to simple dashes
  text = text.replace(/^[\*\-\+]\s+/gm, '- ');
  
  // Clean up multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // Remove leading/trailing whitespace
  text = text.trim();
  
  return text;
}

interface FirecrawlResponse {
  success: boolean;
  data?: {
    content: string;
    markdown: string;
    metadata?: {
      title?: string;
      description?: string;
    };
  };
  error?: string;
}

export async function crawlWebsite(url: string): Promise<{ content: string; title?: string; description?: string } | null> {
  if (!FIRECRAWL_API_KEY) {
    console.error('Firecrawl API key not configured');
    toast.error('Firecrawl API key not configured. Please add VITE_FIRECRAWL_API_KEY to your .env file');
    return null;
  }

  console.log('Crawling website:', url);

  try {
    const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        pageOptions: {
          onlyMainContent: true,
        },
      }),
    });

    console.log('Firecrawl response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl API error response:', errorText);
      throw new Error(`Firecrawl API error (${response.status}): ${response.statusText}`);
    }

    const data: FirecrawlResponse = await response.json();
    console.log('Firecrawl response data:', data);

    if (!data.success || !data.data) {
      const errorMsg = data.error || 'Failed to crawl website';
      console.error('Firecrawl failed:', errorMsg);
      throw new Error(errorMsg);
    }

    // Convert markdown to clean plain text for knowledge base
    const rawContent = data.data.markdown || data.data.content;
    
    if (!rawContent) {
      console.error('No content found in Firecrawl response');
      throw new Error('No content extracted from website');
    }
    
    const cleanContent = markdownToPlainText(rawContent);
    console.log('Successfully extracted content, length:', cleanContent.length);

    return {
      content: cleanContent,
      title: data.data.metadata?.title,
      description: data.data.metadata?.description,
    };
  } catch (error: any) {
    console.error('Firecrawl error:', error);
    toast.error(error.message || 'Failed to crawl website. Please check the URL and try again.');
    return null;
  }
}

export async function extractTextFromFile(file: File): Promise<string | null> {
  try {
    if (file.type === 'text/plain') {
      return await file.text();
    }

    if (file.type === 'application/pdf') {
      toast.error('PDF uploads are not supported. Please use DOCX or TXT files, or paste your content using the "Text" option.');
      return null;
    }

    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.type === 'application/msword') {
      return await extractDOCXText(file);
    }

    toast.warning(`File type not supported. Please use DOCX or TXT files.`);
    return null;
  } catch (error) {
    console.error('File extraction error:', error);
    toast.error('Failed to extract text from file');
    return null;
  }
}

async function extractPDFText(file: File): Promise<string | null> {
  try {
    // Import pdfjs-dist dynamically
    const pdfjsLib = await import('pdfjs-dist');
    
    // Use matching version worker or disable worker for local processing
    // Version 5.4.530 worker might not be on CDN yet, so we disable it
    pdfjsLib.GlobalWorkerOptions.workerSrc = false as any;
    
    toast.info('Extracting text from PDF...');
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      // Force local processing without worker
      standardFontDataUrl: undefined,
      verbosity: 0
    }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    toast.error('Failed to extract text from PDF. Please ensure the PDF contains selectable text (not scanned images).');
    return null;
  }
}

async function extractDOCXText(file: File): Promise<string | null> {
  try {
    toast.info('Extracting text from document...');
    
    // Import mammoth dynamically
    const mammoth = await import('mammoth');
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    const text = result.value.trim();
    
    if (!text || text.length === 0) {
      toast.error('No text found in document. The file may be empty or corrupted.');
      return null;
    }
    
    return text;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    toast.error('Failed to extract text from document. Please ensure the file is a valid Word document.');
    return null;
  }
}
