export function notImplemented(feature: string) {
  return {
    success: false,
    code: 'NOT_IMPLEMENTED',
    feature,
    message: `${feature} requires additional database models or provider integration before it can be enabled.`,
  };
}

export function notImplementedError(feature: string) {
  return new Error(`${feature} requires additional database models or provider integration before it can be enabled.`);
}
