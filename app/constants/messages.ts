export const TOAST_MESSAGES = {
  SUCCESS: {
    CREATED: 'Successfully created.',
    UPDATED: 'Successfully updated.',
    DELETED: 'Successfully deleted.',
    SAVED: 'Changes saved successfully.',
  },
  ERROR: {
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    FETCH_FAILED: 'Failed to retrieve data. Please try again.',
    SUBMIT_FAILED: 'Failed to process request. Please try again.',
  }
} as const;
