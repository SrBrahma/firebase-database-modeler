import type { Reference, EventType } from '@firebase/database-types';
import {
  ref, cloneModel, dataToDb, dataFromDb, onceVal,
  onVal, exists, pathWithVars, set, update, push, remove, pathTo, Database, recursiveModelApplicator, transaction
} from './functions';
import { ModelLikeDbData, Id } from './types';
import { getVarNodeChildKey, getNodeChildrenKeys, obj } from './utils';


type IsChildVarNode<Child> = Child[keyof Child] extends SoftVarNode ? true : false;

// Just an alias for improving the comprehension of the code.
// type ThisNode<ChildrenOrType, Key extends string> = Node<ChildrenOrType, Key>;

// TODO: its not allowing any as ChildrenOrType, to set it as _type. Maybe a third param? Maybe unknown would work
export type Node<ChildrenOrType = unknown, Key extends string = string> = Id<{

  /**
   * The key / segment of this Node.
   * If it is a '`$`', it is a VarNode
   * */
  readonly _key: Key;

  readonly _path: string;

  /**
   * Points to the database given by `_root(, database)` or by `._cloneModel(,, database)`
   * */
  readonly _database: Database | undefined;

  /**
   * Will throw an error if passed an database argument to ._ref() based functions.
   * Useful if using with more than one model and one of those uses this database argument.
   * */
  readonly _blockDatabase: boolean;

  /**
   * The key of the VarNode child property, if this Node is a parent of a VarNode. Else, undefined.
   * For internal usage. You certainly won't use this. I didn't omit this to keep the code of
   * this package type safe. May change on the future.
   * We use a key instead of direct object reference, to use the `._clone` safely.
   * */
  readonly _varNodeChildKey: string | undefined;

  /**
   * An array of keys of the Nodes that are children of the current Node. If none, [].
   * For internal usage. You certainly won't use this. I didn't omit this to keep the code of
   * this package type safe. May change on the future. Includes _varNodeChildKey if have one.
   * We use a key instead of direct object reference, to use the `._clone` safely.
   */
  readonly _nodesChildrenKeys: string[];

  /** Make sure you pass the same count of vars and $vars you have on the model path. */
  readonly _pathWithVars: (vars?: string | string[]) => string;

  // Using SoftNode because Node wasn't working.
  readonly _pathTo: (targetModel: SoftNode, vars?: string | string[]) => string;

  // This makes ModelLikeDbData uses SoftNode type, else would bug for some reason.
  /** Enter the model-like object and it returns a DB-like object, ready to be uploaded. */
  readonly _dataToDb: (data: ModelLikeDbData<ChildrenOrType>) => any;

  /** Enter the DB-like object and it returns a model-like object. */
  readonly _dataFromDb: (data: any) => ModelLikeDbData<ChildrenOrType>;

  // DB operations
  readonly _ref: (vars?: string | string[], database?: Database) => Reference;

  readonly _onceVal: (event: EventType, vars?: string | string[], database?: Database) => Promise<ModelLikeDbData<ChildrenOrType> | null>;

  readonly _onVal: (event: EventType, callback: (val: ModelLikeDbData<ChildrenOrType> | null) => void, vars?: string | string[], database?: Database) => Reference;

  /** Same as RTDB transaction, but will _dataFromDb the callback parameter, and will _dataToDb the return
   * of the callback.
   *
   * As the original function, it returns the promise of the resulting successful value at the current time.
   * */
  readonly _transaction: (
    callback: (current: ModelLikeDbData<ChildrenOrType> | null) => ModelLikeDbData<ChildrenOrType> | null | undefined,
    vars?: string | string[], database?: Database
  ) => Promise<ModelLikeDbData<ChildrenOrType> | null>;

  readonly _exists: (vars?: string | string[], database?: Database) => Promise<boolean>;

  readonly _set: (value: ModelLikeDbData<ChildrenOrType>, vars?: string | string[], database?: Database) => Promise<any>;

  readonly _update: (value: Partial<ModelLikeDbData<ChildrenOrType>>, vars?: string | string[], database?: Database) => Promise<any>;


  // TODO: improve _push rtn type? Generic conditional for ValType === undefined ? Reference : Promise<Reference> ?
  readonly _push: <T extends (IsChildVarNode<ChildrenOrType> extends true
    ? ModelLikeDbData<ChildrenOrType[keyof ChildrenOrType]>
    : ModelLikeDbData<ChildrenOrType>) >(value?: T, vars?: string | string[], database?: Database) => Reference & Promise<Reference>;

  readonly _remove: (vars?: string | string[], database?: Database) => Promise<any>;

  // // End of DB operations

  /**
   * Clones the model and applies the vars value to the paths.
   * Useful when you will use the model with vars for a good time,
   * so you don't have to keep passing the vars all the time.
   * */
  readonly _clone: (vars?: string | string[], database?: Database, blockDatabase?: boolean) => Node<ChildrenOrType, Key>;

  /**
   * How the data is stored in the Realtime Database, but showing the model keys instead of the real keys.
   *
   * Usage:
   *
   * `type A = typeof modelRoot.seg1.seg2._dbType`
   * */
  readonly _dbType: ModelLikeDbData<ChildrenOrType>;

  /** Same as _dbType but Excludes the null type from it, if present. */
  readonly _dbTypeNoNull: Exclude<ModelLikeDbData<ChildrenOrType>, null>;

  // /**
  //  * How the data is really stored in the Realtime Database.
  //  *
  //  * Usage:
  //  *
  //  * `type A = typeof modelRoot.seg1.seg2._realDbType`
  //  * */
  // readonly _realDbType: ModelRealDbData<ChildrenOrType>;

} & (ChildrenOrType extends obj ? ChildrenOrType : unknown)
  & (Key extends '/'
    ? {
      /**
       * https://firebase.google.com/docs/database/web/offline-capabilities#section-connection-state
       */
      _onConnected: (callback: (val: boolean) => void, database?: Database) => Reference;

      /**
       * https://firebase.google.com/docs/database/web/offline-capabilities#clock-skew
       */
      _onServerTimeOffset: (callback: (val: number) => void, database?: Database) => Reference;
    } : unknown)

>;


// Comments below aren't used anymore. Will be removed soon
// Node can be a VarNode or ~NoVarNode. A type of Node that any kind of Node extends it.
// export type AnyNode = Node<unknown, string>;

// Use this if using Node throws an error for this package functions.
// You may add here any Node type you need in the function.
// (usually using 'this' keyword in the _() throws an error as we are using the Node instead of
// this SoftNode in the functions implementations)
export type SoftNode = {
  readonly _key: string;
  readonly _path: string;
  readonly _blockDatabase: boolean;
  readonly _database: Database | undefined;
  readonly _varNodeChildKey: string | undefined;
  readonly _nodesChildrenKeys: string[];
  readonly _pathWithVars: (vars?: string | string[]) => string;
  readonly _ref: (vars?: string | string[], database?: Database) => Reference;
  readonly _dataToDb: (data: any) => any;
  readonly _dataFromDb: (data: any) => any;
};

// This doesn't work for most cases, so we are using SoftVarNode for conditionals. 'unknown's fault?
export type VarNode = Node<unknown, '$'>;

// Use this only if using VarNode throws circular dependency
export type SoftVarNode = { readonly _key: '$'; };

export type AllNodeKeys = keyof Node<unknown>;


/** Creates a Node */
export function _<ChildrenOrType, Key extends string = string>(key: Key, children?: ChildrenOrType)
  : Node<ChildrenOrType, Key> {

  // TODO: Rename this
  type LocalModelLikeDbData = ModelLikeDbData<ChildrenOrType>;

  const model: Node<ChildrenOrType, Key> = {
    _varNodeChildKey: getVarNodeChildKey(children),
    _nodesChildrenKeys: getNodeChildrenKeys(children),
    _key: key,
    _path: '', // Will be set later
    _database: undefined, // Will be set later (or not)
    _blockDatabase: false, // Will be set later (or not)
    _pathWithVars(vars?: string | string[]): string {
      return pathWithVars(this._path, vars);
    },
    _pathTo(targetModel: SoftNode, vars?: string | string[]): string {
      return pathTo(this, targetModel, vars);
    },
    _dataToDb(obj: LocalModelLikeDbData): any {
      return dataToDb(this, obj);
    },
    _dataFromDb(data: any): LocalModelLikeDbData | null {
      return dataFromDb(this, data);
    },

    _ref(vars?: string | string[], database?: Database): Reference {
      return ref(this, vars, database);
    },
    _onceVal(event: EventType, vars?: string | string[], database?: Database): Promise<LocalModelLikeDbData | null> {
      return onceVal(this, event, vars, database);
    },
    _onVal(event: EventType, callback: (val: LocalModelLikeDbData | null) => void, vars?: string | string[], database?: Database): Reference {
      return onVal(this, event, callback, vars, database);
    },
    _transaction(callback: (current: ModelLikeDbData<ChildrenOrType> | null) => ModelLikeDbData<ChildrenOrType> | null | undefined,
      vars?: string | string[], database?: Database): Promise<ModelLikeDbData<ChildrenOrType> | null> {
      return transaction(this, callback, vars, database);
    },
    _exists(vars?: string | string[], database?: Database): Promise<boolean> {
      return exists(this, vars, database);
    },
    _set(value: LocalModelLikeDbData, vars?: string | string[], database?: Database) {
      return set(this, value, vars, database);
    },
    _update(value: Partial<LocalModelLikeDbData>, vars?: string | string[], database?: Database) {
      return update(this, value, vars, database);
    },
    // value parameter is set as any here to simplify. Its type is on Node.
    _push(value?: any, vars?: string | string[], database?: Database) {
      return push(this, value, vars, database);
    },
    _remove(vars?: string | string[], database?: Database) {
      return remove(this, vars, database);
    },

    _clone(vars?: string | string[], database?: Database, blockDatabase: boolean = false): Node<ChildrenOrType, Key> {
      return cloneModel(this, vars, database, blockDatabase);
    },

    _dbType: undefined as any as LocalModelLikeDbData,
    _dbTypeNoNull: undefined as any as LocalModelLikeDbData,

    ...(key === '/') && {
      _onConnected(callback: (val: boolean) => void, database?: Database): Reference {
        // We can't use child('.info...') as it would complain about the '.' of '.info'
        const refe = ref(model, [], database, '.info/connected');
        refe.on('value', snap => callback(snap.val()));
        return refe;
      },
      _onServerTimeOffset(callback: (val: number) => void, database?: Database): Reference {
        const refe = ref(model, [], database, '.info/serverTimeOffset');
        refe.on('value', snap => callback(snap.val()));
        return refe;
      },
    },
    ...children as any,
    // TODO: Error without this type force. How to fix? Also, being any, makes the model don't
    // throw a TS error if missing types in this const
  };

  return model;
}

/** Creates a Variable Node */
export function _$<ChildrenOrType>(children: ChildrenOrType = undefined as any as ChildrenOrType)
  : Node<ChildrenOrType, '$'> {
  return _('$' as const, children);
}

/**
 * Creates a Root Node.
 *
 * If `blockDatabase`, will throw an error if passed an database argument to ._ref() based functions.
 * Useful if using with more than one model and one of those uses the database argument.
 * */
export function _root<ChildrenOrType>(children: ChildrenOrType = undefined as any as ChildrenOrType,
  database?: Database, blockDatabase: boolean = false)
  : Node<ChildrenOrType, '/'> {
  const model = _('/' as const, children);
  // Without as any, recursiveModelApplicator was throwing error.
  // TODO: Fix? How?

  recursiveModelApplicator(model, {
    path: {},
    database,
    blockDatabase
  });

  return model;
}