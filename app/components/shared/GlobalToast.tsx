import { useEffect } from 'react';
import { useActionData, useFetchers } from 'react-router';
import { useToast } from '../../providers/ToastProvider';
import { ActionResult } from '../../types/types';

/**
 * GlobalToast automatically listens to all active fetchers and route action data.
 * If an action completes and returns a standardized ActionResult containing a `message`,
 * it triggers the appropriate toast notification globally.
 */
export function GlobalToast() {
  const { success, error } = useToast();
  const fetchers = useFetchers();
  const actionData = useActionData<ActionResult>();

  // Handle standard <Form> submissions
  useEffect(() => {
    if (actionData && actionData.message) {
      if (!(actionData as any)._toastProcessed) {
        if (actionData.success) {
          success(actionData.message);
        } else {
          error(actionData.message);
        }
        Object.defineProperty(actionData, '_toastProcessed', { value: true, enumerable: false });
      }
    }
  }, [actionData, success, error]);

  // Handle <fetcher.Form> submissions
  useEffect(() => {
    fetchers.forEach(fetcher => {
      if (fetcher.state === 'idle' && fetcher.data) {
        const data = fetcher.data as ActionResult;
        
        if (data && data.message) {
           if (!(data as any)._toastProcessed) {
             if (data.success) {
               success(data.message);
             } else {
               error(data.message);
             }
             Object.defineProperty(data, '_toastProcessed', { value: true, enumerable: false });
           }
        }
      }
    });
  }, [fetchers, success, error]);

  return null;
}
