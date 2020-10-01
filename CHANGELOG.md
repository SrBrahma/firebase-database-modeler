## 2.2.0

Added `blockDatabase` parameter to the `_root` and `._clone` functions.

Also added `._blockDatabase` property which reflexes the parameter above.

Fixed `._clone` not using the `database` parameter.

### 2.1.x

* Fixed `._push()` not allowing no args

* Fixed `._push()` return

## 2.1.0

* Added `database` to the `_root()` and `._clone()` functions.

# Major 2.0.0

* Changed variadic `...vars: string[]` to `vars?: string | string[]`.

* Added `database` parameter to all database related model methods, allowing multiple Realtime Database instances.

* Removed `finishModel()`. You now have to call `_root()` in your root Node instead of just `_()`.

* Renamed `modelerSetDatabase` to `modelerSetDefaultDatabase`