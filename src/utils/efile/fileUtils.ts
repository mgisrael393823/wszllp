/**
 * Maximum file size to process (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed file types for e-filing
 */
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

/**
 * Validate if a file meets the requirements for e-filing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File ${file.name} exceeds the maximum size of 10MB`
    };
  }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File ${file.name} is not an allowed file type. Only PDF and DOCX are supported.`
    };
  }
  
  return { valid: true };
}

/**
 * Convert a File object to base64 string for API submission
 */
export function fileToBase64(file: File): Promise<string> {
  // Validate file before processing
  const validation = validateFile(file);
  if (!validation.valid) {
    return Promise.reject(new Error(validation.error));
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Set up timeout to prevent hanging on large files
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error(`Processing of file ${file.name} timed out`));
    }, 30000); // 30 second timeout
    
    reader.onload = () => {
      clearTimeout(timeout);
      try {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      } catch (err) {
        reject(new Error(`Failed to process file ${file.name}: ${err instanceof Error ? err.message : String(err)}`));
      }
    };
    
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(reader.error || new Error(`Unknown error processing file ${file.name}`));
    };
    
    reader.onabort = () => {
      clearTimeout(timeout);
      reject(new Error(`Reading of file ${file.name} was aborted`));
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (err) {
      clearTimeout(timeout);
      reject(new Error(`Failed to read file ${file.name}: ${err instanceof Error ? err.message : String(err)}`));
    }
  });
}