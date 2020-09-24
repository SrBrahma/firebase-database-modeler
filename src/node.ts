import {
  ref, cloneModel, dataToDb, dataFromDb, onceVal,
  onVal, exists, pathWithVars, set, update, push, remove, pathTo
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

  // test: ChildrenOrType;

  readonly _key: Key; // Pass '$' to define as VarNode
  _path: string;

  // Points to the VarNode child, if this Node is a parent of one VarNode. Else, undefined.
  // The type here is any because it doesn't matter, as it is omitted from the Node, being it useless to the final user.
  // It is present here, however, to inform us that it actually exists in the Node object, and it is used.
  readonly _varNodeChild: any;

  // Make sure you pass the same count of vars and $vars you have on the model path.
  readonly _pathWithVars: (...vars: string[]) => string;
  readonly _ref: (...vars: string[]) => Reference;

  readonly _pathTo: (targetModel: Node, ...vars: string[]) => string;

  // Clones the model and applies the vars value to the paths.
  // Useful when you will use the model with vars for a good time,
  // so you don't have to keep passing the vars all the time.
  readonly _clone: (...vars: string[]) => Node<ChildrenOrType, Key>;

  // You enter the model-like obj and it returns a db-like obj, ready to be uploaded.
  // This makes ModelLikeDbData uses SoftAnyNode type, else would bug for some reason.
  readonly _dataToDb: (data: ThisNodeDbLikeData<ChildrenOrType, Key>) => any;

  // You enter the db-like fetched obj and it returns a model-like obj
  readonly _dataFromDb: (data: any) => ThisNodeDbLikeData<ChildrenOrType, Key>;

  readonly _onceVal: (event: EventType, ...vars: string[]) => Promise<ThisNodeDbLikeData<ChildrenOrType, Key> | null>;

  readonly _onVal: (event: EventType, callback: (val: ThisNodeDbLikeData<ChildrenOrType, Key> | null) => void, ...vars: string[]) => Reference;

  readonly _exists: (...vars: string[]) => Promise<boolean>;

  readonly _set: (value: ThisNodeDbLikeData<ChildrenOrType, Key>, ...vars: string[]) => Promise<any>;
  readonly _update: (value: Partial<ThisNodeDbLikeData<ChildrenOrType, Key>>, ...vars: string[]) => Promise<any>;
  // TODO: improve _push rtn type? Generic conditional for ValType === undefined ? Reference : Promise<Reference> ?
  readonly _push: (value: undefined | (IsChildVarNode<ChildrenOrType> extends true
    ? ModelLikeDbData<ChildrenOrType[keyof ChildrenOrType]>
    : ThisNodeDbLikeData<ChildrenOrType, Key>), ...vars: string[]) => Reference;

  readonly _remove: (...vars: string[]) => Promise<any>;

  readonly _dbType: ModelLikeDbData<ChildrenOrType>; // We don't pass the Node here because it would throw a circular dep

} & (ChildrenOrType extends obj ? ChildrenOrType : unknown),
  '_varNodeChild'>>; // We omit it, as isn't useful at all to the user, outside the implementation.

// Comments below aren't used anymore. Will be removed soon
// Node can be a VarNode or ~NoVarNode. A type of Node that any kind of Node extends it.
// export type AnyNode = Node<unknown, string>;
// Use this only if using AnyNode throws circular dependency. _key must have readonly
// type SoftAnyNode = { readonly _key: string; };

// This doesn't work for most cases, so we are using SoftVarNode for conditionals. 'unknown's fault?
export type VarNode = Node<unknown, '$'>;

// Use this only if using VarNode throws circular dependency
export type SoftVarNode = { readonly _key: '$'; };

export type AllNodeKeys = keyof Node<unknown>;


// Returns a Node.
export function _<ChildrenOrType, Key extends string = string>(key: Key, children?: ChildrenOrType)
  : Node<ChildrenOrType, Key> {

  // TODO: Rename this
  type LocalModelLikeDbData = ThisNodeDbLikeData<ChildrenOrType, Key>;

  return {
    _varNodeChild: getVarNodeChild(children),
    _key: key,
    _path: '',
    _pathWithVars(...vars: string[]): string {
      return pathWithVars(this._path, ...vars);
    },
    _ref(...vars: string[]): Reference {
      return ref(this, ...vars);
    },
    _pathTo(targetModel: Node, ...vars: string[]): string {
      return pathTo(this, targetModel, ...vars);
    },
    _clone(...vars: string[]): Node<ChildrenOrType, Key> {
      return cloneModel(this, ...vars);
    },
    // You enter the model-like obj and it returns a db-like obj, ready to be uploaded
    _dataToDb(obj: LocalModelLikeDbData): any {
      return dataToDb(this, obj);
    },
    // You enter the model-like obj and it returns a db-like obj, ready to be uploaded
    _dataFromDb(data: any): LocalModelLikeDbData {
      return dataFromDb(this, data);
    },
    _onceVal(event: EventType, ...vars: string[]): Promise<LocalModelLikeDbData | null> {
      return onceVal(this, event, ...vars);
    },
    _onVal(event: EventType, callback: (val: LocalModelLikeDbData | null) => void, ...vars: string[]): Reference {
      return onVal(this, event, callback, ...vars);
    },
    _exists(...vars: string[]): Promise<boolean> {
      return exists(this, ...vars);
    },
    _set(value: LocalModelLikeDbData, ...vars: string[]) {
      return set(this, value, ...vars);
    },
    _update(value: Partial<LocalModelLikeDbData>, ...vars: string[]) {
      return update(this, value, ...vars);
    },
    _push(value: LocalModelLikeDbData | undefined, ...vars: string[]) {
      return push(this, value, ...vars);
    },
    _remove(...vars: string[]) {
      return remove(this, ...vars);
    },
    _type: undefined,
    ...children,
  } as any as Node<ChildrenOrType, Key>;
  // For some reason (complex af?) this type force is needed.
  // TODO: make it doesn't need this type force?
}

// Var node
export function _$<ChildrenOrType>(children: ChildrenOrType = undefined as any as ChildrenOrType)
  : Node<ChildrenOrType, '$'> {
  return _<ChildrenOrType, '$'>('$', children);
}