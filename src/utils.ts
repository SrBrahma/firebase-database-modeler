import { Node, SoftNode } from './node';

/* js version for testing
function clone(originalObj) {
  const newObj = Array.isArray(originalObj) ? [] : {};
  for (const [key, value] of Object.entries(originalObj))
    newObj[key] = (typeof value === 'object' && value !== null) ? clone(value) : value;

  return newObj;
}
*/

// https://stackoverflow.com/a/34624648/10247962
export function deepClone<T extends obj>(obj: T): T {
  const newObj: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj))
    newObj[key] = isObject(value) ? deepClone(value) : value;

  return newObj;
}

/**
 * Will deep clone only the children of the object that are Nodes. Else, will only shallow copy.
 * Did this because using deep clone in a Model with database set (in _root() or in _clone())
 * would have an infinite recursion, as Database points to itself.
*/
export function deepCloneNode<T extends SoftNode>(model: T): T {
  const newObj: any = {};
  for (const [key, value] of Object.entries(model))
    newObj[key] = isNode(value) ? deepCloneNode(value) : value;

  return newObj;
}

export type obj<T = unknown> = Record<string, T>;

// Returns if data is a non-null object
export function isObject(data: any): data is obj {
  return typeof data === 'object' && data !== null;
}

// My default way of writing an empty object, as Realtime Firebase
// doesn't allow empty objects.
export const mEmptyObj = { _: 0 as const }; // Without as const, the type is : number instead of : 0.
export type mEmptyObj = typeof mEmptyObj;




// Checks if the given argument is a Node. Can be a VarNode.
export function isNode(data: any): data is Node {
  return isObject(data) && data.hasOwnProperty('_key');
}

// Checks if the given argument is a VarNode.
export function isVarNode(data: any): boolean {
  return isNode(data) && data._key === '$';
}

// If data is a Node and have a VarNode as child, return this VarNode obj. Else, null.
export function getVarNodeChildKey(childrenData: any): string | undefined {
  if (!isObject(childrenData))
    return undefined;
  // Should have just one child.
  return Object.entries(childrenData).find(([key, data]) => isVarNode(data))?.[0];
}


// _varNodeChildKey in params to type check the model already have one.
// Also keeps the function safe if the _varNodeChildKey property changes.
// (as the "as any" would accept an old term not being used anymore)
export function getVarNodeChild(model: SoftNode, _varNodeChildKey: string): SoftNode {
  return (model as any)[_varNodeChildKey];
}

export function getNodeChild(model: SoftNode, _nodeChildKey: string): SoftNode {
  return (model as any)[_nodeChildKey];
}



export function getNodeChildrenKeys(children: any): string[] {
  if (!isObject(children))
    return [];
  const result: string[] = [];
  for (const [key, child] of Object.entries(children))
    if (isNode(child))
      result.push(key);

  return result;
}

