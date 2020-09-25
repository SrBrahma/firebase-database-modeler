# Major 2.0.0

* Changed variadic `...vars: string[]` to `vars?: string | string[]`.

* Added `database` parameter to all database related model methods, allowing multiple Realtime Database instances.

* Removed `finishModel()`. You now have to call `_root()` in your root Node instead of just `_()`.

* Renamed `modelerSetDatabase` to `modelerSetDefaultDatabase`