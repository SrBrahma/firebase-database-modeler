This repo is just saving the project for proper apresentation later,
but you may already use it by getting the src single file.

Will make it a NPM package someday.

Made to work with Typescript, with its Intellisense, but is also usable with Js,
but certainly won't work as good.

This Readme will still be improved and completed.

## See modelExample.ts!

# Usage:

```typescript
import { createModel, _, _$, mEmptyObj } from './modeler';

export const stores = _('stores', {
  $storeId: _$({
    name: _<string>('n'), // The DB node key can be different from the model key
    rating: _<number>('rating'),
    open: _<boolean>('open')
    users: _('users', {
      $userId: _$<mEmptyObj>() // Realtime Database doesn't allow empty objects, so I standartized the 'empty object' as being {_: 0}.
    })
  })


stores.push(
  // Using _dataToDb function, we get Intellisense help to construct the object, and it also converts the model keys to the DB keys!
  stores._dataToDb({
    name: 'Cool Store',
    rating: 4.2,
    open: true,
    users: {
      [aUserId]: mEmptyObj; // Yes! It allows passing dynamic properties keys, and mEmptyObj is also a const besides a type.
    }
  })
)


stores.$storeId.name._ref(aStoreId).set('New Name!')
```

# API

## Functions

### \_(key: string, nestedNode?: Node)

Creates a new node. First parameter is the node key; the name of it in the database.

The second parameter allows nesting.

You may pass a type to it.

```typescript
const database = createModel({
  first: _("1st"),
  second: _("second", {
    nested: _<string>("stuff"),
  }),
});

database.second.nested._key(); // = 'stuff'
```

If your model only have one parent node, you don't have to give it an object key, so you can access it directly.

```typescript
const second = createModel(
  _("second", {
    nested: _("stuff"),
  })
);

second.nested._key(); // = 'stuff'
```

# Node properties

## \_key

Returns the value you entered as the first argument of the \_ function.
Is the last part of the path.

Ex:

`users.$userId.stores._key() // Returns 'stores'`

### \_path

Returns the entire path (hierarchical concatenation of all keys). '\$' keys variables aren't converted.

Ex:

`stores.$storeId.name_path // Returns 'stores/$/n'`

### \_pathWithVars()

Returns the path with '\$' variables converted. For each variable, you must pass
its value as parameter.

Ex:

`stores.$storeId.users.$userId_pathWithVars('abc', 'DEADBEEF') // Returns 'stores/abc/users/DEADBEEF`

### \_ref

Is the best thing here (FOR NOW!). It returns a Realtime Database reference while using the same working of \_pathWithVars.

Ex:

`stores.$storeId.rating_ref('abc').set(2.7)`

### \_dbType

Use it with typescript typeof to ...

### \_dataToDb

### \_dataFromDb

Converts data from DB (gotten with on() or once()) to a model-like object, with typing.

### \_clone

# Roadmap

- NPM package

- Better readme
- Include set(), on(), once(), transition() functions directly to the Nodes. It will support model typing and converts Model keys <-> DB keys

- A generator for [Bolt](https://github.com/FirebaseExtended/bolt) using a model, or generate a model using a Bolt file.

- Firestore support. Easy to add, but I don't think I will ever use Firestore again (its max 1 write per second is a big limitation).
