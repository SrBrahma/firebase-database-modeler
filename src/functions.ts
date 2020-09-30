import { Node } from './node';
import { Reference, EventType } from '@firebase/database-types';
import { deepClone, isNode, isObject } from './utils';

/** Cross-package Database type, to warn user if the given database argument is wrong. */
export interface Database {
  goOffline(): any;
  goOnline(): any;
  [extraProps: string]: any;
}

export let defaultDatabase: Database | undefined;


/**
 * You must call this with the return of your firebase.database().
 * The type is any
 * @param {Database} database
 */
export function modelerSetDefaultDatabase(database: Database) {
  defaultDatabase = database;
}


// As const instead of inline for performance.
const allDolarRegex = new RegExp('\\$', 'g');
const validSegmentChars = /^[a-zA-Z0-9_-]+$/; // Also tests for '' (empty string).


export function pathSegmentIsValid(segment: string): boolean {
  return ((typeof segment === 'string') && validSegmentChars.test(segment));
}

export function pathWithVars(path: string, vars?: string | string[]) {
  let varsI = 0;
  return path.replace(allDolarRegex, () => {
    const val = vars?.[varsI++]!; // If is undefined, pathSegmentIsValid will return false.
    if (!pathSegmentIsValid(val as string))
      throw Error(`[firebase-database-modeler]: vars[${varsI}] not set or has an invalid value (= ${val}).`
        + ` vars = ${vars}. Regex valid pattern = ${validSegmentChars.source}`);
    return val;
  });
}

/** Doesn't include the parentModel key / segment. Includes the target key / segment.
 * If there is a '/' in the beggining, it will be removed.
 */
export function pathTo(parentModel: Node, targetModel: Node, vars?: string | string[]): string {
  const targetStr = targetModel._path;
  const initialStr = parentModel._path;

  if (!targetStr.includes(initialStr))
    throw Error(`[firebase-database-modeler]: Error in pathTo function. The target model is not a child of any level of the parent model`
      + ` (= parent's path (${parentModel._path}) is not part of the target's path (${targetModel._path}))`);

  let path = '';

  if (!initialStr)
    path = targetStr;
  else
    targetStr.replace(initialStr, '');

  if (path[0] === '/')
    path = path.replace('/', '');

  return pathWithVars(path, vars);
}

export function ref(model: Node, vars?: string | string[], database?: Database): Reference {
  if (database)
    return database.ref(model._pathWithVars(vars));
  if (model._database)
    return model._database.ref(model._pathWithVars(vars));
  if (defaultDatabase)
    return defaultDatabase.ref(model._pathWithVars(vars));
  else
    throw new Error('[firebase-database-modeler]: Database instance is not set. Set it with modelerSetDefaultDatabase(database) or use the database parameter for DB-related methods.');
}

export async function exists(model: Node, vars?: string | string[], database?: Database): Promise<boolean> {
  return (await model._ref(vars, database).once('value')).exists();
}

export async function onceVal(model: Node, event: EventType = 'value', vars?: string | string[], database?: Database): Promise<any> {
  const ref = model._ref(vars, database);
  return model._dataFromDb((await ref.once(event)).val());
}

/** Returns the reference, so you can easily unsubscribe with theReference.off(). */
export function onVal(model: Node, event: EventType, callback: (val: any) => void, vars?: string | string[], database?: Database): Reference {
  const ref = model._ref(vars, database);
  ref.on(event, (snapshot: any) => callback(model._dataFromDb(snapshot.val())));
  return ref;
}

export async function set(model: Node, value: any, vars?: string | string[], database?: Database): Promise<any> {
  return await model._ref(vars, database).set(model._dataToDb(value));
}

export async function update(model: Node, value: any, vars?: string | string[], database?: Database): Promise<any> {
  return await model._ref(vars, database).update(model._dataToDb(value));
}

// TODO: Improve it ?
// https://stackoverflow.com/questions/38768576/in-firebase-when-using-push-how-do-i-get-the-unique-id-and-store-in-my-databas
// https://stackoverflow.com/questions/50031142/firebase-push-promise-never-resolves
// https://stackoverflow.com/a/49918443/10247962
export async function push(model: Node, value?: any, vars?: string | string[], database?: Database): Promise<any> {
  if (!value)
    return model._ref(vars, database).push();
  return await model._ref(vars, database).push(model._dataToDb(value));
}

export async function remove(model: Node, vars?: string | string[], database?: Database): Promise<any> {
  return await model._ref(vars, database).remove();
}


interface recursiveModelApplicatorI {
  /** If not passing parentPath or forcedPath, just pass an empty object. */
  path?: {
    parentPath?: string,
    forcedPath?: string;
  },
  database?: Database;
}
export function recursiveModelApplicator<N extends Node<{}>>(model: N, { path, database }: recursiveModelApplicatorI): void {
  // We use as any to override the readonly prop type. They are meant to be changed only here.
  if (path) {
    if (path.forcedPath !== undefined)
      (model._path as any) = path.forcedPath;
    else if (!path.parentPath)
      (model._path as any) = model._key;
    else if (path.parentPath === '/')
      (model._path as any) += model._key;
    else
      (model._path as any) = path.parentPath + '/' + model._key;
  }

  if (database)
    (model._database as any) = database;

  for (const child of Object.values(model))
    if (typeof child === 'object' && child !== null
      && isNode(child)) {
      recursiveModelApplicator(child, {
        ...(path && { path: { parentPath: model._path } }),
        ...(database && { database: database })
      });
    }
}


// Gets a model-like object and makes it compatible with the db schema.
export function dataToDb<N extends Node>(model: N, data: any): any {
  // If data isn't a object (aka no need to translate keys), return it.
  if (!isObject(data))
    return data;

  const newObj: any = {};

  // Cycle throught all current children
  for (const [key, value] of Object.entries(data)) {

    // Points to the varNodeChild, if there is one.
    // As any as _varNodeChild is ommited from Node type
    const varNodeChild = (model as any)._varNodeChild;

    // The model node is a parent of a VarNode.
    if (varNodeChild) // As any as _varNodeChild is omitted from the Node type.
      newObj[key] = dataToDb(varNodeChild, value);

    // The model have a corresponding key
    else if (model.hasOwnProperty(key)) {
      const correspondingModel = (model as any)[key];
      newObj[correspondingModel['_key']] = dataToDb(correspondingModel, value);
    }

    // It's some non-modeled data entered. We will always add it. (?)
    else
      newObj[key] = value;
  }
  return newObj;
}

// It is like the dataToDb() but somewhat the inverse of it.
// TODO: Add addDataNotInModel to _onceVal and _onVal (overloading).
export function dataFromDb<N extends Node>(model: N, dbData: any, addDataNotInModel: boolean = true): any {
  // If data isn't a object (aka no need to translate keys), return it.
  if (!isObject(dbData))
    return dbData;

  const newObj: any = {};

  // Cycle throught all current children
  for (const [key, value] of Object.entries(dbData)) {

    // Points to the varNodeChild, if there is one.
    // As any as _varNodeChild is ommited from Node type
    const varNodeChild = (model as any)._varNodeChild;

    if (varNodeChild)
      newObj[key] = dataFromDb(varNodeChild, value);

    else {
      // TODO: Model could have a ommited prop that would hold children (maybe only _key?), for faster find()'ing
      const modelEntry = Object.entries(model)
        .find(([, modelProp]) => isNode(modelProp) && modelProp._key === key
        ) as [string, Node] | undefined;

      // We found the corresponding modelKey (modelEntry[0]).
      if (modelEntry)
        newObj[modelEntry[0]] = dataFromDb(modelEntry[1], value);

      // Corresponding model not found. if addDataNotInModel, copy the data anyway, with the given key.
      else if (addDataNotInModel)
        newObj[key] = value;
    }
  }
  return newObj;
}



// Applies a variable to a model's path and return a cloned model with the new pathes.
// ToDo: add it to Node as prop.
export function cloneModel<N extends Node>(model: N, vars?: string | string[], database?: Database): N {
  const clonedModel = deepClone(model);
  recursiveModelApplicator(clonedModel, {
    path: {
      forcedPath: clonedModel._pathWithVars(vars)
    },
    database
  });
  return clonedModel;
}
