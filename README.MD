Project not ready yet! Still fixing bugs and writing this README. Should be ready in a couple of weeks. I am using it in a real project, so the presentation of this one isn't the focus right now.

This Readme will still be improved and completed. Some stuff here is already deprecated.

Supports firebase, firebase-admin and react-native-firebase packages

# Usage:

```typescript
import { createModel, _, _$, mEmptyObj, modelerSetDatabase } from 'firebase-database-modeler';

// There are multiple ways of setting up the database depending of the firebase package
// you are using (firebase, firebase-admin or react-native-firebase).
// The main point here is: you have to get the .database()

const database = firebase.database()
modelerSetDatabase(database)

const stores = _('stores', {
  $storeId: _$({
    name: _<string>('n'), // The DB node key can be different from the model key
    rating: _<number>('rating'),
    open: _<boolean>('open')
    users: _('users', {
      $userId: _$<mEmptyObj>() // Realtime Database doesn't allow empty objects, so I standartized the 'empty object' as being {_: 0}.
    })
  })

const root = _('/', {
  stores
})

// This must be called after setting your model at the root of your model.
finishModel(root);

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
const root
  first: _('1st'),
  second: _('second', {
    nested: _<string>('stuff'),
  }),
});

database.second.nested._key(); // = 'stuff'
```

### \_\$(key: string, nestedNode?: Node)

Creates a new Variable Node.

```typescript
const users = _$({
  name: _<string>("name"),
  age: _<number>("age"),
});
```

# Node properties

## \_key: string

Returns the value you entered as the first argument of the \_ function.
Is the last part of the path.

E.g.:

`users.$userId.stores._key // Returns 'stores'`

### \_path: string

Returns the entire path (hierarchical concatenation of all keys). '\$' keys variables aren't converted.

E.g.:

`stores.$storeId.name_path // Returns 'stores/$/n'`

### \_pathWithVars(...vars: string[]) => string

Returns the path with '\$' variables converted. For each Variable Node, you must pass
its string value as parameter.

E.g.:

`stores.$storeId.users.$userId_pathWithVars('abc', 'DEADBEEF') // Returns 'stores/abc/users/DEADBEEF`

### \_ref(...vars: string[]) => Reference

Returns a Realtime Database reference while using the same working of \_pathWithVars.

E.g.:

`stores.$storeId.rating._ref('abc').set(2.7)`

### \_dbType

Use it with typescript typeof to ...

### \_dataToDb(data: ModelLikeDbData) => any

Converts the inputted data to your database schema

### \_dataFromDb

Converts data from the database (gotten with on() or once()) to a model-like object, with typing.

### \_onceVal(event: EventType) => ModelLikeDbData

Same as model.\_dataFromDb(await model.\_ref(vars).once(event)).val()).

### \_onVal(event: EventType, callback())

### \_exists (...vars: string[]): Promise<boolean>

Returns if the reference exists.
Same as (await model.\_ref(vars).once('value')).exists()

E.g.:

`await stores.$storeId.rating._exists() // Will return true or false.`

### \_clone

# Roadmap

- A generator for [Bolt](https://github.com/FirebaseExtended/bolt) using a model, or generate a model using a Bolt file.

- Firestore support. Easy to add, but I don't think I will ever use Firestore again (its max 1 write per second is a big limitation).

- \_set() and \_push() with ModelLikeDbData
