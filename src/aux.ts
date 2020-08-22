import { VarNode } from './node';


// https://stackoverflow.com/a/34624648/10247962
export function deepClone<T>(originalObj: T): T {
  const newObj: any = Array.isArray(originalObj) ? [] : {};
  for (const [key, value] of Object.entries(originalObj))
    newObj[key] = (typeof value === 'object' && value !== null) ? deepClone(value) : value;

  return newObj;
}


export type obj = Record<string, unknown>;



// Returns if data is a non-null object
export function isObject(data: any) {
  return typeof data === 'object' && data !== null;
}

// My default way of writing an empty object, as Realtime Firebase
// doesn't allow empty objects.
export const mEmptyObj = { _: 0 as const }; // Without as const, the type is : number instead of : 0.
export type mEmptyObj = typeof mEmptyObj;




// Checks if the given argument is a Node. Can be a VarNode.
export function isNode(data: any): boolean {
  return isObject(data) && data.hasOwnProperty('_key');
}

// Checks if the given argument is a VarNode.
export function isVarNode(data: any): boolean {
  return isNode(data) && data._key === '$';
}

// If data is a Node and have a VarNode as child, return this VarNode obj. Else, null.
export function getVarNodeChild(data: any): VarNode | undefined {
  if (!isObject(data))
    return;
  return Object.values(data).find((e: any) => isVarNode(e)) as VarNode;
}

