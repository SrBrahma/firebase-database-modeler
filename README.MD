This isn't a NPM package yet. Will later build it.

This repo is just saving the project for proper apresentation later,
but you may already use it by getting the src single file.

Made to work with Typescript, with its Intellisense, but is also usable with Js,
but certainly won't work as good.

# Usage:

```
import { createModel, _ } from './modeler';

export const users = createModel(
  _('users', {
    $userId: _('$', {
      stores: _('stores', {
        $storeId: _('$')
      })
    })
  })
);

users.$userId.stores.$storeId._ref(yourUserIdVar, yourStoreIdVar).push({
  name: 'Walmart',
  // etc
})
```

# API

## Functions

### \_(key: string, nestedNode?: Node)

Creates a new node. First parameter is the node key; the name of it in the database.
You may pass a '\$' to declare it as a variable.

The second parameter allows nesting.

```
const database = createModel({
  first: _('1st'),
  second: _('second', {
    nested: _('stuff')
  })
})

database.second.nested._key() // = 'stuff'
```

If your model only have one parent node, you don't have to give it an object key, so you can access it directly.

```
const second = createModel(
  _('second', {
    nested: _('stuff')
  })
)

second.nested._key() // = 'stuff'
```

## createModel(node: Node)

Use this to wrap your node/nodes. You must use it.

# Node properties

## \_key

Returns the value you entered as the first argument of the \_ function.
Is the last part of the path.

Ex: `users.$userId.stores._key() // Returns 'stores'`

### \_path

Returns the entire path (hierarchical concatenation of all keys). '\$' keys variables aren't translated.

Ex: `users.$userId.stores._path() // Returns 'users/$/stores`

### \_pathWithVars

Returns the path with '\$' variables translated. For each variable, you must pass
its value as parameter.

Ex: `users.$userId.stores.$storeId._pathWithVars('abc', '123') // Returns 'users/abc/stores/123'`

### \_ref

Is the best thing here. It returns a Realtime Database reference while using the same working of \_pathWithVars.

Ex: `users.$userId.stores._ref('abc').set('your data here!')`
