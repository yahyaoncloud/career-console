import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { errorResponse } from '../lib/api.server';
import { notImplementedError } from '../services/not-implemented.server';

export async function loader({}: LoaderFunctionArgs) {
  return errorResponse(notImplementedError('Digital product detail API'), {
    status: 501,
    code: 'NOT_IMPLEMENTED',
  });
}

export async function action({}: ActionFunctionArgs) {
  return errorResponse(notImplementedError('Digital product mutation API'), {
    status: 501,
    code: 'NOT_IMPLEMENTED',
  });
}
