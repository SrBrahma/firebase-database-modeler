// TODO: how to standardize optional model props?

import { recursivePather } from './functions';

// Call this on the root of your model.
// This could be done automatically in _().
export function applyPaths<T>(model: T, initialPath = ''): T {
  recursivePather(model, initialPath);
  return model;
}

export { _, _$ } from './node';
export { modelerSetDatabase } from './functions';