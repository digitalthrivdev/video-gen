// Main API module - re-exports from modular API structure
// This file maintains backward compatibility while using the new modular structure

// Re-export all API functionality from the modular structure
export * from './api';

// Legacy exports for backward compatibility
export {
  generateVeo3Video,
  getVeo3VideoDetails,
  pollVideoStatus,
  uploadImageToUrl,
  uploadImageWithSDK as uploadImageToUrlWithSDK
} from './api';
