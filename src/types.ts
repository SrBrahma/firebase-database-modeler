import { obj } from './utils';
import { AllNodeKeys, SoftVarNode } from './node';

/** To avoid passing a snapshot instead of the val() by mistake. */
export type DataFromDb = obj | string | number | boolean | null;


// Inspired on https://github.com/invertase/react-native-firebase/blob/master/packages/database/lib/index.d.ts
export type TransactionResult<T> = {
  committed: boolean;
  result: T;
};



// Use typeof in this to get the model property type if set (boolean, number, etc)
// This is also used in convertedFromDb() to build the fetched data
// This is only applied into final Nodes.
type _dbType<T = any> = { readonly _dbType: T; };


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



// Couldn't use T[K]['_dbType'], so made this.
type AuxDbToType<T> = T extends _dbType ? T['_dbType'] : T;

// Passes the type from _dbType to T.
// We need to do this initial obj checking because _dbTypes may point to a type like number.
type _dbTypeToProp<T> = T extends obj
  ? { [K in keyof T]: AuxDbToType<T[K]> }
  : T;



// Checks if the Node T has a child that is a VarNode (created with _$).
// If so, return this VarNode child, else, never.
// It turns all non VarNode props to never.
// The [keyof T] makes the possible VarNode as the return, instead of returning it as a keyName: VarNode.
// Also, if there isn't a VarNode (=all props are never), makes it returns never.
// SoftVarNode because VarNode was not working with the SoftNode below (why??)
type getVarNodeChild<T> = { [K in keyof T]: T[K] extends SoftVarNode ? T[K] : never }[keyof T];

// We use [P in string] instead of [$: string] or Record<string, ...>, because
// [$: string] was being decomposed as [x: string] and [x: number], and Record was
// returning "Type ... is not generic". This solution I discovered was a huge life saver.
// extends obj instead of AnyNode, because in the dbType case, it doesn't pass an initial Node (else would be circular dep)
type ApplyVarNodeIfChild<T> = T extends obj
  ? (getVarNodeChild<T> extends never
    ? T
    : { [P in string]: ApplyVarNodeIfChild<getVarNodeChild<T>> } | null)
  : T;

// Probably don't need to be recursive.
type NoMetaButDbType<T> = T extends obj ? OmitRecursively<T, Exclude<AllNodeKeys, '_dbType'>> : T;

// T is the model. It returns how db data looks like in a model-like way.
export type ModelLikeDbData<T> =
  // Makes '| null' or '| undefined' props optional
  NullUndefinedPropsToOptional<
    // Makes it prettier to typescript (removes the Pick<......> around the type)
    Id<
      // Remove meta keys
      NoMeta<
        // Pass the type from _dbType to property
        _dbTypeToProp<
          // Will use the _dbType on _dbTypeToProp
          NoMetaButDbType<
            // Convert $variables: T into {[x: string]: T}
            ApplyVarNodeIfChild<T>
          >
        >
      >
    >
  >;

/**
 * Get the property keys that can be undefined or null
 * Based on https://stackoverflow.com/a/53809800/10247962
*/
type NullableAndUndefinedKeys<T> = Exclude<{ [K in keyof T]:
  Extract<T[K], null | undefined> extends never ? never : K }[keyof T], undefined>;

/**
 * Applies optional to the given property keys
 * https://github.com/Microsoft/TypeScript/issues/25760#issuecomment-614417742
 */
type KeysToOptional<T, K extends keyof T> = Omit<T, K> & Partial<T>;


export type NullUndefinedPropsToOptional<T> =
  T extends obj
  ? (string extends keyof T
    ? T // Nothing if in an dynamic record (VarNode)
    : Id<KeysToOptional<T, NullableAndUndefinedKeys<T>>>
  ) : T;


  type AddNullIfUndefined<T> = T extends undefined ? T | null : T
  /** Adds null type to the given type (obj or simple) if it has undefined.
   *
   * Single level. */
  type AddNullToUndefined<T> = T extends obj
    ? {[K in keyof T]: AddNullIfUndefined<T[K]>} // couldn't add the check here directly for TS distributive working reasons
    : AddNullIfUndefined<T>

/** So the dev can remove a property (pass null) if it is undefinable. */
export type UpdateParam<T> = Partial<AddNullToUndefined<T>>


// https://stackoverflow.com/a/61132308/10247962
// type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };

// https://stackoverflow.com/a/50375286/10247962
// type UnionToIntersection<U> =
//   (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// How to check exact type https://fettblog.eu/typescript-match-the-exact-object-shape/