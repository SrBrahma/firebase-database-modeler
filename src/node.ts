import { ref, cloneModel, dataToDb, dataFromDb, onceVal, onVal, exists, pathWithVars, set, update, push } from './functions';
import { Reference, EventType } from '@firebase/database-types';
import { ModelLikeDbData, Id } from './types';
import { obj, getVarNodeChild } from './aux';

// TODO: its not allowing any as ChildrenOrType, to set it as _type. Maybe a third param? Maybe unknown would work
export type Node<ChildrenOrType, Key extends string = string> = Id<Omit<{

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

  readonly _onceVal: (event: EventType, ...vars: string[]) => Promise<ModelLikeDbData<Node<ChildrenOrType, Key>> | null>;

  readonly _onVal: (event: EventType, callback: (val: ModelLikeDbData<Node<ChildrenOrType, Key>> | null) => void, ...vars: string[]) => Reference;

  readonly _exists: (...vars: string[]) => Promise<boolean>;

  readonly _set: (value: ModelLikeDbData<Node<ChildrenOrType, Key>>, ...vars: string[]) => Promise<any>;
  readonly _update: (value: Partial<ModelLikeDbData<Node<ChildrenOrType, Key>>>, ...vars: string[]) => Promise<any>;
  // TODO: improve _push rtn type? Generic conditional for ValType === undefined ? Reference : Promise<Reference> ?
  readonly _push: (value: ModelLikeDbData<Node<ChildrenOrType, Key>> | undefined, ...vars: string[]) => Reference;

  readonly _dbType: ModelLikeDbData<ChildrenOrType>; // We don't pass the Node here because it would throw a circular dep

} & (ChildrenOrType extends obj ? ChildrenOrType : unknown),
  '_varNodeChild'>>; // We omit it, as isn't useful to the user, outside the implementation.

// Node can be a VarNode or NoVarNode. A type of Node that any kind of Node extends it.
export type AnyNode = Node<unknown, string>;

// Use this only if using AnyNode throws circular dependency. _key must have readonly
// type SoftAnyNode = { readonly _key: string; };

export type VarNode = Node<unknown, '$'>;

// Use this only if using VarNode throws circular dependency
export type SoftVarNode = { readonly _key: '$'; };

export type AllNodeKeys = keyof Node<unknown>;




// Returns a Node.
export function _<ChildrenOrType, Key extends string = string>(key: Key, children?: ChildrenOrType)
  : Node<ChildrenOrType, Key> {

  // TODO: Rename this
  type LocalModelLikeDbData = ModelLikeDbData<Node<ChildrenOrType, Key>>;

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