import { obj } from './aux';
import { AllNodeKeys, SoftVarNode } from './node';

// Use typeof in this to get the model property type if set (boolean, number, etc)
// This is also used in convertedFromDb() to build the fetched data
// This is only applied into final Nodes.
type _dbType<T> = { readonly _dbType: T; };


// The distributive and recursively terms here may not be quite right, as
// their functions varies. But, assume that they are part of recursive attributions.

// https://stackoverflow.com/a/54487392/10247962
type OmitDistributive<T, K extends PropertyKey> = T extends any ? (T extends obj ? Id<OmitRecursively<T, K>> : T) : never;
export type Id<T> = unknown & { [P in keyof T]: T[P] }; // Cosmetic use only makes the tooltips expad the type can be removed
type OmitRecursively<T extends any, K extends PropertyKey> = Omit<
  { [P in keyof T]: OmitDistributive<T[P], K> },
  K
>;


// Removes all the Node meta keys from the type, like _key, _path etc
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
    : { [P in string]: applyVarNodeIfChild<getVarNodeChild<T>> } | null)
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

// https://stackoverflow.com/a/50375286/10247962
// type UnionToIntersection<U> =
//   (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// How to check exact type https://fettblog.eu/typescript-match-the-exact-object-shape/