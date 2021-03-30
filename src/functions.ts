import type { Reference, EventType } from '@firebase/database-types';
import { SoftNode } from './node';
import { DataFromDb, TransactionResult } from './types';
import { deepCloneNode, getVarNodeChild, isNode, isObject } from './utils';

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
export function modelerSetDefaultDatabase(database: Database): void {
  defaultDatabase = database;
}


// As const instead of inline for performance.
const allDolarRegex = new RegExp('\\$', 'g');
const validSegmentChars = /^[a-zA-Z0-9_-]+$/; // Also tests for '' (empty string).


export function pathSegmentIsValid(segment: string | undefined): boolean {
  return ((typeof segment === 'string') && validSegmentChars.test(segment));
}

export function pathWithVars(path: string, vars?: string | string[]): string {
  if (vars && !Array.isArray(vars))
    vars = [vars];
  let varsI = 0;
  return path.replace(allDolarRegex, () => {
    const val = vars?.[varsI++];
    if (!pathSegmentIsValid(val))
      throw Error(`[firebase-database-modeler]: vars[${varsI}] not set or has an invalid value. Value=(${val}),`
        + ` Path=(${path}), Vars=(${vars}), RegexValidation="${validSegmentChars.source}"`);
    return val as string;
  });
}

/** Doesn't include the parentModel key / segment. Includes the target key / segment.
 * If there is a '/' in the beggining, it will be removed.
 */
export function pathTo(parentModel: SoftNode, targetModel: SoftNode, vars?: string | string[]): string {
  const targetStr = targetModel._path;
  const initialStr = parentModel._path;

  if (!targetStr.includes(initialStr))
    throw Error(`[firebase-database-modeler]: Error in pathTo function. The target model is not a child of any level of the parent model`
      + ` (= parent's path (${parentModel._path}) is not part of the target's path (${targetModel._path}))`);

  let path = '';

  if (!initialStr)
    path = targetStr;
  else
    path = targetStr.replace(initialStr, '');

  if (path[0] === '/')
    path = path.replace('/', '');

  return pathWithVars(path, vars);
}

export function ref(model: SoftNode, vars?: string | string[], database?: Database, forcedPath?: string): Reference {
  let db;
  if (database) {
    if (model._blockDatabase)
      throw new Error('[firebase-database-modeler]: An database argument has been passed but the blockDatabase was set in _root or _clone function. ._path of this model: ' +
        model._path);
    db = database;
  }
  else if (model._database)
    db = model._database;
  else if (defaultDatabase)
    db = defaultDatabase;
  else
    throw new Error('[firebase-database-modeler]: Database instance is not set. Set it with modelerSetDefaultDatabase(database) or use the database parameter for DB-related methods.');

  return db.ref(forcedPath ?? model._pathWithVars(vars));
}


export async function exists(model: SoftNode, vars?: string | string[], database?: Database): Promise<boolean> {
  return (await model._ref(vars, database).once('value')).exists();
}

export async function onceVal(model: SoftNode, event: EventType = 'value', vars?: string | string[], database?: Database): Promise<any | null> {
  const ref = model._ref(vars, database);
  return model._dataFromDb((await ref.once(event)).val());
}

/** Returns the reference, so you can easily unsubscribe with theReference.off(). */
export function onVal(model: SoftNode, event: EventType, callback: (val: any | null) => void, vars?: string | string[], database?: Database): Reference {
  const ref = model._ref(vars, database);
  ref.on(event, (snapshot: any) => callback(model._dataFromDb(snapshot.val())));
  return ref;
}

export function transaction<T>(model: SoftNode,
  callback: (val: T | null) => T | null | undefined, applyLocaly?: boolean, vars?: string | string[], database?: Database
): Promise<TransactionResult<T>> {
  const ref = model._ref(vars, database);
  return new Promise<TransactionResult<T>>((resolve, reject) => {
    ref.transaction(
      v => model._dataToDb(callback(model._dataFromDb((v)))),
      (error, committed, snap) => {
        if (error)
          return reject(error);
        return resolve({
          committed,
          result: model._dataFromDb(snap?.val())
        });
      }, applyLocaly
    );
  });
}


export function set(model: SoftNode, value: unknown, vars?: string | string[], database?: Database): Promise<any> {
  return model._ref(vars, database).set(model._dataToDb(value));
}

export function update(model: SoftNode, value: unknown, vars?: string | string[], database?: Database): Promise<any> {
  return model._ref(vars, database).update(model._dataToDb(value));
}

// TODO: Improve it ?
// https://stackoverflow.com/questions/38768576/in-firebase-when-using-push-how-do-i-get-the-unique-id-and-store-in-my-databas
// https://stackoverflow.com/questions/50031142/firebase-push-promise-never-resolves
// https://stackoverflow.com/a/49918443/10247962
// The return type should be set in the Node type, as we can't use Reference & Promise<Reference> here.
export function push(model: SoftNode, value?: unknown, vars?: string | string[], database?: Database): any {
  if (!value)
    return model._ref(vars, database).push();
  // If using push on a varNode parent, use the varNode child model in the conversion
  if (model._varNodeChildKey)
    return model._ref(vars, database).push(getVarNodeChild(model, model._varNodeChildKey)._dataToDb(value));
  return model._ref(vars, database).push(model._dataToDb(value));
}

export function remove(model: SoftNode, vars?: string | string[], database?: Database): Promise<any> {
  return model._ref(vars, database).remove();
}



// Gets a model-like object and makes it compatible with the db schema.
export function dataToDb(model: SoftNode, data: unknown): any {
  // If data isn't a object (aka no need to translate keys), return it.
  if (!isObject(data))
    return data;

  const newObj: any = {};

  // Cycle throught all current children
  for (const [key, value] of Object.entries(data)) {

    // This node is a parent of a VarNode.
    const varNodeKey = model._varNodeChildKey;
    if (varNodeKey) // As any as _varNodeChild is omitted from the Node type.
      // Being the children varNode, we use the key itself.
      newObj[key] = dataToDb((model as any)[varNodeKey], value);

    // The model have a corresponding key
    else if (model._nodesChildrenKeys.includes(key)) {
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
export function dataFromDb(model: SoftNode, dbData: DataFromDb, addDataNotInModel: boolean = true): any {
  // If data isn't a object (aka no need to translate keys), return it.
  if (!isObject(dbData))
    return dbData;

  const newObj: any = {};

  // Cycle throught all current children
  for (const [key, value] of Object.entries(dbData) as [string, any]) {

    const varNodeKey = model._varNodeChildKey;
    if (varNodeKey)
      newObj[key] = dataFromDb((model as any)[varNodeKey], value);

    else {
      // TODO: We could have an dict on the Node that would improve this.
      const nodeChildKey = model._nodesChildrenKeys
        .find(nodeChildKey => (model as any)[nodeChildKey]._key === key);

      // We found the corresponding modelKey.
      if (nodeChildKey)
        newObj[nodeChildKey] = dataFromDb((model as any)[nodeChildKey], value);

      // Corresponding model not found. if addDataNotInModel, copy the data anyway, with the given key.
      else if (addDataNotInModel)
        newObj[key] = value;
    }
  }
  return newObj;
}



// Applies a variable to a model's path and return a cloned model with the new pathes.
export function cloneModel<N extends SoftNode>(model: N, vars: string | string[] | undefined,
  database: Database | undefined, blockDatabase: boolean | undefined): N {

  const clonedModel = deepCloneNode(model);
  recursiveModelApplicator(clonedModel, {
    ...(vars) && {
      path: {
        forcedPath: clonedModel._pathWithVars(vars)
      }
    },
    database,
    blockDatabase
  });
  return clonedModel;
}



interface recursiveModelApplicatorI {
  /** If not passing parentPath or forcedPath, just pass an empty object. */
  path?: {
    parentPath?: string,
    forcedPath?: string;
  },
  database?: Database;
  blockDatabase?: boolean;
}
export function recursiveModelApplicator<N extends SoftNode>(
  model: N, { path, database, blockDatabase }: recursiveModelApplicatorI): void {

  // We use the "as ..." to override the readonly prop type. They are meant to be changed only here.
  if (path) {
    if (path.forcedPath !== undefined)
      (model._path as string) = path.forcedPath;
    else if (!path.parentPath)
      (model._path as string) = model._key;
    else if (path.parentPath === '/')
      (model._path as string) = '/' + model._key;
    else
      (model._path as string) = path.parentPath + '/' + model._key;
  }

  if (database)
    (model._database as Database) = database;

  if (blockDatabase)
    (model._blockDatabase as boolean) = blockDatabase;

  for (const child of Object.values(model))
    if (typeof child === 'object' && child !== null
      && isNode(child)) {
      recursiveModelApplicator(child, {
        ...(path && { path: { parentPath: model._path } }),
        ...(database && { database }),
        ...(blockDatabase && { blockDatabase })
      });
    }
}