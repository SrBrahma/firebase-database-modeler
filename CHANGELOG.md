## 2.4.0

Any null or undefined node are now optional, via `_<T | null>()` or `_<T | undefined>()`. Parents of `_$()` are now automatically optional. README about this will be added later.


## 2.3.0

- Added `._childrenNodeKeys`, an string[] of the Node children that are Node. Internal usage.

- Changed `._varNodeChild` (: Reference) to `._varNodeChildKey` (: string | undefined), for better ._clone'ing.

- Fixed `._clone` with self referencing data. This happened to me when passing a database to _root() or ._clone(),
as it self references.

- Due to changes above, improved `._clone` performance.

- Improved performance in `dataToDb` and `dataFromDb`.

- Refactored part of the code (`Node` and `_()`) to remove type forcing.


### 2.2.4

- Fixed `._pathTo` returning an empty string sometimes

### 2.2.3

- Fixed `._path` not starting with `/`. (cosmetic).

- Fixed `._push` on a VarNode parent not using the VarNode child in the `dataToDb` conversion.

### 2.2.2

- Fixed `._pathWithVars()`-like functions not working with string (not string[]) var.

### 2.2.1

- Improved invalid `vars` in `._ref()`-like functions. It now also shows the non parsed path.

## 2.2.0

- Added `blockDatabase` parameter to the `_root` and `._clone` functions.

- Also added `._blockDatabase` property which reflexes the parameter above.

- Fixed `._clone` not using the `database` parameter.

### 2.1.x

-  Fixed `._push()` not allowing no args

-  Fixed `._push()` return

## 2.1.0

-  Added `database` to the `_root()` and `._clone()` functions.

# Major 2.0.0

-  Changed variadic `...vars: string[]` to `vars?: string | string[]`.

-  Added `database` parameter to all database related model methods, allowing multiple Realtime Database instances.

-  Removed `finishModel()`. You now have to call `_root()` in your root Node instead of just `_()`.

-  Renamed `modelerSetDatabase` to `modelerSetDefaultDatabase`