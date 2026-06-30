import { type ActionFunctionArgs } from 'react-router';
import { errorResponse } from '../lib/api.server';
import { notImplementedError } from '../services/not-implemented.server';

export async function action({}: ActionFunctionArgs) {
  return errorResponse(notImplementedError('Download recovery API'), {
    status: 501,
    code: 'NOT_IMPLEMENTED',
  });
}
