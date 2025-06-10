import React, { useState, useEffect } from 'react';
import { X, Download, Printer, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { LoadingState, ErrorState } from '../ui/StateComponents';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface DocumentViewerProps {
  url: string;
  fileName: string;
  fileType: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * DocumentViewer - In-app document viewing component
 * Supports PDFs, images, and common document formats
 * Features zoom, pan, rotation, and navigation controls
 */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  url,
  fileName,
  fileType,
  isOpen,
  onClose,
  className
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reset state when document changes
  useEffect(() => {
    if (isOpen) {
      setPageNumber(1);
      setScale(1);
      setRotation(0);
      setError(null);
      setLoading(true);
    }
  }, [url, isOpen]);

  // Determine if file is an image
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName) || 
                  fileType.startsWith('image/');

  // Determine if file is a PDF
  const isPDF = /\.pdf$/i.test(fileName) || fileType === 'application/pdf';

  // Handle PDF load success
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  // Handle PDF load error
  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    setLoading(false);
  };

  // Handle image load
  const handleImageLoad = () => {
    setLoading(false);
  };

  // Handle image error
  const handleImageError = () => {
    setError('Failed to load image');
    setLoading(false);
  };

  // Navigation functions
  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages || 1, prev + 1));
  };

  // Zoom functions
  const zoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  // Rotation function
  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Download function
  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render document based on type
  const renderDocument = () => {
    if (loading) {
      return <LoadingState message="Loading document..." />;
    }

    if (error) {
      return <ErrorState message={error} />;
    }

    if (isPDF) {
      return (
        <div className="flex flex-col items-center">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<LoadingState message="Loading PDF..." />}
            className="max-w-full"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        </div>
      );
    }

    if (isImage) {
      return (
        <TransformWrapper
          initialScale={scale}
          minScale={0.5}
          maxScale={3}
          centerOnInit
        >
          <TransformComponent>
            <img
              src={url}
              alt={fileName}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ transform: `rotate(${rotation}deg)` }}
              className="max-w-full h-auto shadow-lg"
            />
          </TransformComponent>
        </TransformWrapper>
      );
    }

    // For other file types, show a preview message with download option
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600 mb-4">
          Preview not available for this file type
        </p>
        <Button onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fileName}
      size={isFullscreen ? 'full' : 'xl'}
      className={cn("document-viewer", className)}
    >
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* PDF Navigation */}
            {isPDF && numPages && numPages > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  icon={<ChevronLeft className="w-4 h-4" />}
                  aria-label="Previous page"
                />
                <span className="text-sm text-neutral-600 mx-2">
                  Page {pageNumber} of {numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  icon={<ChevronRight className="w-4 h-4" />}
                  aria-label="Next page"
                />
                <div className="w-px h-6 bg-neutral-200 mx-2" />
              </>
            )}

            {/* Zoom Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              icon={<ZoomOut className="w-4 h-4" />}
              aria-label="Zoom out"
            />
            <span className="text-sm text-neutral-600 mx-2">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              icon={<ZoomIn className="w-4 h-4" />}
              aria-label="Zoom in"
            />

            {/* Rotation */}
            <div className="w-px h-6 bg-neutral-200 mx-2" />
            <Button
              variant="outline"
              size="sm"
              onClick={rotate}
              icon={<RotateCw className="w-4 h-4" />}
              aria-label="Rotate"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4" />}
            >
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              icon={<Download className="w-4 h-4" />}
            >
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              icon={isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            />
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className={cn(
        "overflow-auto bg-neutral-50",
        isFullscreen ? "h-[calc(100vh-120px)]" : "h-[600px]",
        "flex items-center justify-center p-4"
      )}>
        {renderDocument()}
      </div>

      {/* Footer with file info */}
      <div className="border-t border-neutral-200 px-4 py-3 bg-neutral-50">
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>{fileName}</span>
          <span>{fileType}</span>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentViewer;