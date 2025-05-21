import React, { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { fileToBase64 } from '@/utils/efile/fileUtils';

interface EFileUploadItemProps {
  file: File;
  onRemove: () => void;
  onEncoded: (encoded: string) => void;
}

const EFileUploadItem: React.FC<EFileUploadItemProps> = ({ file, onRemove, onEncoded }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      setError('Invalid file type');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large');
      return;
    }
    fileToBase64(file)
      .then(encoded => onEncoded(encoded))
      .catch(() => setError('Failed to read file'));
  }, [file, onEncoded]);

  return (
    <div className="flex items-center justify-between mt-1">
      <span className="text-sm text-gray-700">{file.name}</span>
      {error ? (
        <span className="text-error-600 text-sm ml-2">{error}</span>
      ) : (
        <Button type="button" variant="text" size="sm" onClick={onRemove}>
          Remove
        </Button>
      )}
    </div>
  );
};

export default EFileUploadItem;
