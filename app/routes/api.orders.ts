import { type LoaderFunctionArgs } from 'react-router';
import { errorResponse } from '../lib/api.server';
import { notImplementedError } from '../services/not-implemented.server';

export async function loader({}: LoaderFunctionArgs) {
  return errorResponse(notImplementedError('Order history API'), {
    status: 501,
    code: 'NOT_IMPLEMENTED',
  });
}
