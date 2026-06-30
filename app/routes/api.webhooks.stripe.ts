import { type ActionFunctionArgs } from 'react-router';
import { errorResponse } from '../lib/api.server';
import { notImplementedError } from '../services/not-implemented.server';

export async function action({}: ActionFunctionArgs) {
  return errorResponse(notImplementedError('Stripe webhook API'), {
    status: 501,
    code: 'NOT_IMPLEMENTED',
  });
}
