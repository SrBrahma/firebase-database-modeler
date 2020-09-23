// TODO: how to standardize optional model props?

import { recursivePather, database } from './functions';

// Call this on the root of your model to recursively apply the paths.
// Also will throw an error if you haven't called the modelerSetDatabase().
export function finishModel<T>(model: T, initialPath = ''): T {
  if (!database)
    throw Error('[firebase-database-modeler]: You have not set the database. Call modelerSetDatabase() with your firebase.database() as argument.');
  recursivePather(model, initialPath);
  return model;
}

export { _, _$ } from './node';
export { modelerSetDatabase, pathSegmentIsValid } from './functions';
export { mEmptyObj } from './aux';

export { Reference } from '@firebase/database-types';