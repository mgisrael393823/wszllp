export const ENHANCED_EFILING_PHASE_A =
  (import.meta.env.VITE_ENVIRONMENT === 'staging') ||
  import.meta.env.VITE_ENHANCED_EFILING_PHASE_A === 'true';

export const ENHANCED_EFILING_PHASE_B =
  (import.meta.env.VITE_ENVIRONMENT === 'staging') ||
  import.meta.env.VITE_ENHANCED_EFILING_PHASE_B === 'true';