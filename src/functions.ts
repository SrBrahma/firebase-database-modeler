import { AnyNode } from './node';
import { Reference, EventType, Database } from '@firebase/database-types';
import { deepClone, isNode } from './aux';


export let database: Database;


/**
 * You must call this with the return of your firebase.database().
 * @param {Database} databaseInstance
 */
export function modelerSetDatabase(databaseInstance: any) {
  database = databaseInstance;
}


// As const instead of inline for performance.
const allDolarRegex = new RegExp('\\$', 'g');

export function pathWithVars(path: string, ...vars: string[]) {
  return path.replace(allDolarRegex, () => vars.shift()!);
}

export function ref(model: AnyNode, ...vars: string[]): Reference {
  return database.ref(model._pathWithVars(...vars));
}

export async function exists(model: AnyNode, ...vars: string[]): Promise<boolean> {
  return (await model._ref(...vars).once('value')).exists();
}

export async function onceVal<T extends AnyNode>(model: T, event: EventType, ...vars: string[]): Promise<any> {
  const ref = model._ref(...vars);
  return model._dataFromDb((await ref.once(event)).val());
}

// Returns the reference, so you can easily unsubscribe when wanted with ref.off().
export function onVal<T extends AnyNode>(model: T, event: EventType, callback: (val: any) => void, ...vars: string[]): Reference {
  const ref = model._ref(...vars);
  ref.on(event, (snapshot: any) => callback(model._dataFromDb(snapshot.val())));
  return ref;
}


export function recursivePather(currentObj: any, parentPath: string, forcedPath?: string): void {
  if (forcedPath !== undefined)
    currentObj._path = forcedPath;
  else if (!parentPath)
    currentObj._path = currentObj._key;
  else if (parentPath === '/')
    currentObj._path += currentObj._key;
  else
    currentObj._path = parentPath + '/' + currentObj._key;

  for (const child of Object.values(currentObj))
    if (typeof child === 'object' && child !== null
      && child.hasOwnProperty('_path'))
      recursivePather(child, currentObj._path);
}

// Applies a variable to a model's path and return a cloned model with the new pathes.
// ToDo: add it to Node as prop.
export function cloneModel<T extends AnyNode>(model: T, ...vars: string[]): T {
  const clonedModel = deepClone(model);
  recursivePather(clonedModel, '', clonedModel._pathWithVars(...vars));
  return clonedModel;
}


// Used on _make() property.
// Gets a model-like object and makes it compatible with the db schema.
// It's only a object as a parameter, because if you want to pass a boolean e.g., just use set().
export function dataToDb(model: AnyNode, data: any): any {
  if (typeof data !== 'object' || data === null || !model)
    return data;

  const newObj: any = {};

  // Cycle throught all current children
  for (const [key, value] of Object.entries(data) as [string, any][]) {

    // The model node is a parent of a VarNode.
    if ((model as any)._varNodeChild)
      newObj[key] = dataToDb((model as any)._varNodeChild, value);

    // The model have a corresponding key
    else if (model.hasOwnProperty(key))
      newObj[(model as any)[key]['_key']] = dataToDb((model as any)[key], value);

    // It's some non-modeled data entered. We will always add it. (?)
    else
      newObj[key] = value;
  }
  return newObj;
}

// It is like the make() but somewhat the inverse of it.
export function dataFromDb<T extends AnyNode>(model: T, dbData: any, addDataNotInModel: boolean = false): any {

  if (typeof dbData !== 'object' || dbData === null || !model)
    return dbData;

  const newObj: any = {};

  // Cycle throught all current children
  for (const [key, value] of Object.entries(dbData) as [string, any][]) {

    if ((model as any)._varNodeChild)
      newObj[key] = dataFromDb((model as any)._varNodeChild, value);

    else {
      const modelEntry = Object.entries(model)
        .find(([, mVal]) => isNode(mVal) && (mVal as any)._key === key);

      // We found the corresponding modelKey
      if (modelEntry)
        newObj[modelEntry[0]] = value;

      // Corresponding model not found. if addDataNotInModel, copy the data anyway, with the given key.
      else if (addDataNotInModel)
        newObj[key] = value;
    }
  }
  return newObj;
}