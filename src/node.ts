import {
  ref, cloneModel, dataToDb, dataFromDb, onceVal,
  onVal, exists, pathWithVars, set, update, push, remove, pathTo, Database, recursiveModelApplicator
} from './functions';
import { Reference, EventType } from '@firebase/database-types';
import { ModelLikeDbData, Id } from './types';
import { obj, getVarNodeChild } from './utils';


type IsChildVarNode<Child> = Child[keyof Child] extends SoftVarNode ? true : false;

// Just an alias for improving the comprehension of the code.
// type ThisNode<ChildrenOrType, Key extends string> = Node<ChildrenOrType, Key>;

// Little shorter version to use below.
type ThisNodeDbLikeData<ChildrenOrType, Key extends string> = ModelLikeDbData<Node<ChildrenOrType, Key>>;

// TODO: its not allowing any as ChildrenOrType, to set it as _type. Maybe a third param? Maybe unknown would work
export type Node<ChildrenOrType = unknown, Key extends string = string> = Id<Omit<{

  /** The key / segment of this Node.
   *
   * If it is a '`$`', it is a VarNode */
  readonly _key: Key;

  readonly _path: string;

  /** Points to the database given by `_root(, database)` or by `._cloneModel(,, database)`
   *
  */
  readonly _database: Database | undefined;

  /** Points to the VarNode child, if this Node is a parent of one VarNode. Else, undefined.
   *  The type here is any because it doesn't matter, as it is omitted from the Node, being it useless to the final user.
   *  It is present here, however, to inform us that it actually exists in the Node object, and it is used.
   */
  readonly _varNodeChild: any;

  /** Make sure you pass the same count of vars and $vars you have on the model path. */
  readonly _pathWithVars: (vars?: string | string[]) => string;

  // Using SoftNode because Node wasn't working.
  readonly _pathTo: (targetModel: SoftNode, vars?: string | string[]) => string;

  /** Enter the DB-like object and it returns a model-like object. */
  readonly _dataFromDb: (data: any) => ThisNodeDbLikeData<ChildrenOrType, Key>;

  // This makes ModelLikeDbData uses SoftNode type, else would bug for some reason.
  /** Enter the model-like object and it returns a DB-like object, ready to be uploaded. */
  readonly _dataToDb: (data: ThisNodeDbLikeData<ChildrenOrType, Key>) => any;

  // DB operations
  readonly _ref: (vars?: string | string[], database?: Database) => Reference;

  readonly _onceVal: (event: EventType, vars?: string | string[], database?: Database) => Promise<ThisNodeDbLikeData<ChildrenOrType, Key> | null>;

  readonly _onVal: (event: EventType, callback: (val: ThisNodeDbLikeData<ChildrenOrType, Key> | null) => void, vars?: string | string[], database?: Database) => Reference;

  readonly _exists: (vars?: string | string[], database?: Database) => Promise<boolean>;

  readonly _set: (value: ThisNodeDbLikeData<ChildrenOrType, Key>, vars?: string | string[], database?: Database) => Promise<any>;

  readonly _update: (value: Partial<ThisNodeDbLikeData<ChildrenOrType, Key>>, vars?: string | string[], database?: Database) => Promise<any>;

  // TODO: improve _push rtn type? Generic conditional for ValType === undefined ? Reference : Promise<Reference> ?
  readonly _push: (value: undefined | (IsChildVarNode<ChildrenOrType> extends true
    ? ModelLikeDbData<ChildrenOrType[keyof ChildrenOrType]>
    : ThisNodeDbLikeData<ChildrenOrType, Key>), vars?: string | string[], database?: Database) => Reference;

  readonly _remove: (vars?: string | string[], database?: Database) => Promise<any>;

  // End of DB operations

  // Clones the model and applies the vars value to the paths.
  // Useful when you will use the model with vars for a good time,
  // so you don't have to keep passing the vars all the time.
  readonly _clone: (vars?: string | string[]) => Node<ChildrenOrType, Key>;


  readonly _dbType: ModelLikeDbData<ChildrenOrType>; // We don't pass the Node here because it would throw a circular dep

} & (ChildrenOrType extends obj ? ChildrenOrType : unknown),
  '_varNodeChild'>>; // We omit it, as isn't useful at all to the user, outside the implementation.

// Comments below aren't used anymore. Will be removed soon
// Node can be a VarNode or ~NoVarNode. A type of Node that any kind of Node extends it.
// export type AnyNode = Node<unknown, string>;
// Use this only if using AnyNode throws circular dependency. _key must have readonly
export type SoftNode = { readonly _key: string; };

// This doesn't work for most cases, so we are using SoftVarNode for conditionals. 'unknown's fault?
export type VarNode = Node<unknown, '$'>;

// Use this only if using VarNode throws circular dependency
export type SoftVarNode = { readonly _key: '$'; };

export type AllNodeKeys = keyof Node<unknown>;


/** Creates a Node */
export function _<ChildrenOrType, Key extends string = string>(key: Key, children?: ChildrenOrType)
  : Node<ChildrenOrType, Key> {

  // TODO: Rename this
  type LocalModelLikeDbData = ThisNodeDbLikeData<ChildrenOrType, Key>;

  const model = {
    _varNodeChild: getVarNodeChild(children),
    _key: key,
    _path: '', // Will be set later
    _database: undefined, // Will be set later (or not)
    _pathWithVars(vars?: string | string[]): string {
      return pathWithVars(this._path, vars);
    },
    _pathTo(targetModel: Node, vars?: string | string[]): string {
      return pathTo(this, targetModel, vars);
    },
    _dataToDb(obj: LocalModelLikeDbData): any {
      return dataToDb(this, obj);
    },
    // You enter the model-like obj and it returns a db-like obj, ready to be uploaded
    _dataFromDb(data: any): LocalModelLikeDbData {
      return dataFromDb(this, data);
    },

    _ref(vars?: string | string[], database?: Database): Reference {
      return ref(this, vars, database);
    },
    // You enter the model-like obj and it returns a db-like obj, ready to be uploaded
    _onceVal(event: EventType, vars?: string | string[], database?: Database): Promise<LocalModelLikeDbData | null> {
      return onceVal(this, event, vars, database);
    },
    _onVal(event: EventType, callback: (val: LocalModelLikeDbData | null) => void, vars?: string | string[], database?: Database): Reference {
      return onVal(this, event, callback, vars, database);
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
    // _push value type is set in the Node type. A little complex to be here.
    _push(value: any, vars?: string | string[], database?: Database) {
      return push(this, value, vars, database);
    },
    _remove(vars?: string | string[], database?: Database) {
      return remove(this, vars, database);
    },

    _clone(vars?: string | string[]): Node<ChildrenOrType, Key> {
      return cloneModel(this, vars);
    },

    _dbType: undefined,
    ...children,
  } as any as Node<ChildrenOrType, Key>;
  // For some reason (complex af?) this type force is needed.
  // TODO: make it doesn't need this type force?

  return model;
}

/** Creates a Variable Node */
export function _$<ChildrenOrType>(children: ChildrenOrType = undefined as any as ChildrenOrType)
  : Node<ChildrenOrType, '$'> {
  return _('$' as const, children);
}

/** Creates a Root Node. */
export function _root<ChildrenOrType>(children: ChildrenOrType = undefined as any as ChildrenOrType, database?: Database)
  : Node<ChildrenOrType, '/'> {
  const model = _('/' as const, children) as any;
  // Without as any, recursiveModelApplicator was throwing error.
  // TODO: Fix? How?

  recursiveModelApplicator(model, {
    path: {},
    database
  });

  return model;
}