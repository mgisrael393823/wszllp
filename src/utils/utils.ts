// Utility function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Utility function to validate email
export const isValidEmail = (email: string): boolean => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

// Utility function to format phone number
export const formatPhoneNumber = (input: string): string => {
  // Remove all non-digits
  const digitsOnly = input.replace(/\D/g, '');
  
  // Format as xxx-xxx-xxxx
  if (digitsOnly.length >= 10) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
  }
  
  return input;
};

// Utility function to format date
export const formatDate = (dateStr: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Date(dateStr).toLocaleDateString('en-US', options);
};

// Utility function to calculate due days
export const calculateDueDays = (dueDate: string): number => {
  const due = new Date(dueDate).getTime();
  const now = new Date().getTime();
  
  // Calculate difference in days
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
};

// Utility function to generate demo data for the app
export const generateDemoData = () => {
  // Generate cases, hearings, documents, etc. for demo
  const demoData = {
    cases: [
      // Sample cases
    ],
    hearings: [
      // Sample hearings
    ],
    // ...other entities
  };
  
  return demoData;
};