// This code contains typescript witchery. It's really not simple.
// I learned a lot of advanced typescript writing this. Took a lot of experiments.
// Really grinded my brain here. I have a good proud of it :)

// TODO: how to standardize optional model props?

// TODO: how to import automatically firebase OR react-native-firebase? Babel?
// Dynamic imports (but what about typings? dev dep?)

// TODO Future: Bolt generator

import { database } from '../firebase';

type Reference = ReturnType<typeof database.ref>;

// Aux. Returns if data is a no-null object
function isObject(data: any) {
  return typeof data === 'object' && data !== null;
}

// My default way of writing an empty object, as Realtime Firebase
// doesn't allow empty objects.
export const mEmptyObj = { _: 0 as const }; // Without as const, the type is : number instead of : 0.
export type mEmptyObj = typeof mEmptyObj;

// As const instead of inline for performance.
const allDolarRegex = new RegExp('\\$', 'g');


// Use typeof in this to get the model property type if set (boolean, number, etc)
// This is also used in convertedFromDb() to build the fetched data
// This is only applied into final Nodes.
type _dbType<T> = { readonly _dbType: T; };

type obj = Record<string, unknown>;

// The model node.
// TODO: its not allowing any as ChildrenOrType, to set it as _type. Maybe a third param?
type Node<ChildrenOrType, Key extends string = string> = Id<Omit<{
  readonly _key: Key; // Pass '$' to define as VarNode
  _path: string;

  // Points to the VarNode child, if this Node is a parent of one VarNode. Else, undefined.
  // Won't conditional type here, as it was screwing all conditional checks.
  readonly _varNodeChild?: Node<ChildrenOrType, '$'>;

  // Make sure you pass the same count of vars and $vars you have on the model path.
  readonly _pathWithVars: (...vars: string[]) => string;
  readonly _ref: (...vars: string[]) => Reference;

  // Clones the model and applies the vars value to the paths.
  // Useful when you will use the model with vars for a good time,
  // so you don't have to keep passing the vars all the time.
  readonly _clone: (...vars: string[]) => Node<ChildrenOrType, Key>;

  // You enter the model-like obj and it returns a db-like obj, ready to be uploaded.
  // This makes ModelLikeDbData uses SoftAnyNode type, else would bug for some reason.
  readonly _dataToDb: (data: ModelLikeDbData<Node<ChildrenOrType, Key>>) => any;

  // You enter the db-like fetched obj and it returns a model-like obj
  readonly _dataFromDb: (data: any) => ModelLikeDbData<Node<ChildrenOrType, Key>>;

  readonly _dbType: ModelLikeDbData<ChildrenOrType>; // We don't pass the Node here because it would throw a circular dep

} & (ChildrenOrType extends obj ? ChildrenOrType : unknown),
  '_varNodeChild'>>; // We omit it, as isn't useful to the user, outside the implementation.

// How to check exact type https://fettblog.eu/typescript-match-the-exact-object-shape/
// type CheckMEmptyObj<T> = T extends mEmptyObj
//   ? (Exclude<keyof T, keyof mEmptyObj> extends never
//     ? true : false)
//   : false;

// Node can be a VarNode or NoVarNode. A type of Node that any kind of Node extends it.
type AnyNode = Node<unknown, string>;

// Use this only if using AnyNode throws circular dependency. _key must have readonly
// type SoftAnyNode = { readonly _key: string; };

type VarNode = Node<unknown, '$'>;

// Use this only if using VarNode throws circular dependency
type SoftVarNode = { readonly _key: '$'; };

type AllNodeKeys = keyof Node<unknown>;


// The distributive and recursively terms here may not be quite right, as
// their functions varies. But, assume that they are part of recursive attributions.

// https://stackoverflow.com/a/54487392/10247962
type OmitDistributive<T, K extends PropertyKey> = T extends any ? (T extends obj ? Id<OmitRecursively<T, K>> : T) : never;
type Id<T> = unknown & { [P in keyof T]: T[P] }; // Cosmetic use only makes the tooltips expad the type can be removed
type OmitRecursively<T extends any, K extends PropertyKey> = Omit<
  { [P in keyof T]: OmitDistributive<T[P], K> },
  K
>;


// Removes all the Node meta keys from the type, like _key, _path etc
// mEmptyObj to also clear the _type.
type NoMeta<T> = T extends obj ? OmitRecursively<T, AllNodeKeys> : T;



// Add a prop to all children, recursively
type AddPropDistributive<Obj extends obj, Prop> =
  { [K in keyof Obj]: (Obj[K] extends obj ? AddPropRecursively<Obj[K], Prop> : Obj[K]) };
type AddPropRecursively<Obj extends obj, Prop> =
  Obj & Prop & AddPropDistributive<Obj, Prop>;


type NonFilledObjToAnyDistributive<T extends obj> =
  { [K in keyof T]: (T[K] extends obj ? NonFilledObjToAnyRecursively<T[K]> : T[K]) };
type NonFilledObjToAnyRecursively<T extends obj> =
  T extends { [K in keyof T]: never } ? any : NonFilledObjToAnyDistributive<T>;



// https://stackoverflow.com/a/61132308/10247962
// type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };


// Passes the type from _dbType to T.
// We need to do this initial obj checking because _dbTypes may point to a type like number.
type _typeToProp<T> = T extends _dbType<any>
  ? (
    T extends _dbType<obj>
    ? { [K in keyof T]: _typeToProp<T[K]> }
    : T['_dbType']// _dbType is a simple type
  )
  : (T extends obj
    ? { [K in keyof T]: _typeToProp<T[K]> }
    : T);//T; // Don't have a _dbType prop.

// { [K in keyof T]: T[K] extends {_dbType: any}
// ? (T[K] extends {_dbType: obj} ? _typeToProp<T[K]> : T[K]['_dbType'])
// : _typeToProp<T[K]> }
// These two below were seriously fucking difficult. I tried so many different ways to get it working.
// More than 20h of brain torturing and googling hints to write 6 lines (plus changes in the Node)

// Checks if the Node T has a child that is a VarNode (created with _$).
// If so, return this VarNode child, else, never.
// It turns all non VarNode props to never.
// The [keyof T] makes the possible VarNode as the return, instead of returning it as a keyName: VarNode.
// Also, if there isn't a VarNode (=all props are never), makes it returns never.
// SoftVarNode because VarNode was not working with the SoftAnyNode below (why??)
type getVarNodeChild<T> = { [K in keyof T]: T[K] extends SoftVarNode ? T[K] : never }[keyof T];

// We use [P in string] instead of [$: string] or Record<string, ...>, because
// [$: string] was being decomposed as [x: string] and [x: number], and Record was
// returning "Type ... is not generic". This solution I discovered was a huge life saver.
// extends obj instead of AnyNode, because in the dbType case, it doesn't pass an initial Node (else would be circular dep)
type applyVarNodeIfChild<T> = T extends obj
  ? (getVarNodeChild<T> extends never
    ? { [K in keyof T]: applyVarNodeIfChild<T[K]> }
    : { [P in string]: applyVarNodeIfChild<getVarNodeChild<T>>; })
  : T;

// T is the model. It returns how db data looks like in a model-like way.
export type ModelLikeDbData<T> =
  // Makes it prettier to typescript (removes the Pick<......> around the type)
  Id<
    // Remove meta keys
    NoMeta<
      //     // Pass the type from _type to property
      _typeToProp<
        // Convert $variables: T into {[x: string]: T}
        applyVarNodeIfChild<T>
      >
    >
  >;

// Not used, but maybe will be useful someday.
// https://stackoverflow.com/a/50375286/10247962
// type UnionToIntersection<U> =
//   (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;


// Checks if the given argument is a Node. Can be a VarNode.
function isNode(data: any): boolean {
  return isObject(data) && data.hasOwnProperty('_key');
}

// Checks if the given argument is a VarNode.
function isVarNode(data: any): boolean {
  return isNode(data) && data._key === '$';
}

// If data is a Node and have a VarNode as child, return this VarNode obj. Else, null.
function getVarNodeChild(data: any): VarNode | undefined {
  if (!isObject(data))
    return;
  return Object.values(data).find((e: any) => isVarNode(e)) as VarNode;
}

// Returns a Node.
export function _<ChildrenOrType, Key extends string = string>(key: Key, children?: ChildrenOrType)
  : Node<ChildrenOrType, Key> {

  return {
    _varNodeChild: getVarNodeChild(children),
    _key: key,
    _path: '',
    _pathWithVars(...vars: string[]): string {
      return this._path.replace(allDolarRegex, () => vars.shift()!);
    },
    _ref(...vars: string[]): Reference {
      return database.ref(this._pathWithVars(...vars));
    },
    _clone(...vars: string[]): Node<ChildrenOrType, Key> {
      return cloneModel(this, ...vars);
    },
    // You enter the model-like obj and it returns a db-like obj, ready to be uploaded
    _dataToDb(obj: ModelLikeDbData<Node<ChildrenOrType, Key>>): any {
      return dataToDb(obj, this);
    },
    // You enter the model-like obj and it returns a db-like obj, ready to be uploaded
    _dataFromDb(data: any): ModelLikeDbData<Node<ChildrenOrType, Key>> {
      return dataFromDb(data, this);
    },
    _type: undefined,

    ...children,
  } as any as Node<ChildrenOrType, Key>; // For some reason (complex af?) this type forcer is needed.
}

// Var node
export function _$<ChildrenOrType>(children: ChildrenOrType = undefined as any as ChildrenOrType)
  : Node<ChildrenOrType, '$'> {
  return _<ChildrenOrType, '$'>('$', children);
}


function recursivePather(currentObj: any, parentPath: string, forcedPath?: string): void {
  if (forcedPath !== undefined)
    currentObj._path = forcedPath;
  else if (!parentPath)
    currentObj._path = currentObj._key;
  else
    currentObj._path = parentPath + '/' + currentObj._key;

  for (const child of Object.values(currentObj))
    if (typeof child === 'object' && child !== null
      && child.hasOwnProperty('_path'))
      recursivePather(child, currentObj._path);
}


// Call this on the root of your model.
// This could be done automatically in _().
export function applyPaths<T>(model: T, initialPath = ''): T {
  recursivePather(model, initialPath);
  return model;
}


// https://stackoverflow.com/a/34624648/10247962// Hide the meta properties (_key, _path etc). This doesn't actually remove them from the object.
function deepClone<T>(originalObj: T): T {
  const newObj: any = Array.isArray(originalObj) ? [] : {};
  for (const [key, value] of Object.entries(originalObj))
    newObj[key] = (typeof value === 'object' && value !== null) ? deepClone(value) : value;

  return newObj;
}


// Applies a variable to a model's path and return a cloned model with the new pathes.
// ToDo: add it to Node as prop.
function cloneModel<T extends AnyNode>(model: T, ...vars: string[]): T {
  const clonedModel = deepClone(model);
  recursivePather(clonedModel, '', clonedModel._pathWithVars(...vars));
  return clonedModel;
}


// Used on _make() property.
// Gets a model-like object and makes it compatible with the db schema.
// It's only a object as a parameter, because if you want to pass a boolean e.g., just use set().
function dataToDb(data: any, model: AnyNode): any {
  if (typeof data !== 'object' || data === null || !model)
    return data;

  const newObj: any = {};

  // Cycle throught all current children
  for (const [key, value] of Object.entries(data) as [string, any][]) {

    // The model node is a parent of a VarNode.
    if ((model as any)._varNodeChild)
      newObj[key] = dataToDb(value, (model as any)._varNodeChild);

    // The model have a corresponding key
    else if (model.hasOwnProperty(key))
      newObj[(model as any)[key]['_key']] = dataToDb(value, (model as any)[key]);

    // It's some non-modeled data entered. We will always add it. (?)
    else
      newObj[key] = value;
  }
  return newObj;
}

// It is like the make() but somewhat the inverse of it.
function dataFromDb<T extends AnyNode>(dbData: any, model: T, addDataNotInModel: boolean = false): any {

  if (typeof dbData !== 'object' || dbData === null || !model)
    return dbData;

  const newObj: any = {};

  // Cycle throught all current children
  for (const [key, value] of Object.entries(dbData) as [string, any][]) {

    if ((model as any)._varNodeChild)
      newObj[key] = dataFromDb(value, (model as any)._varNodeChild);

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



