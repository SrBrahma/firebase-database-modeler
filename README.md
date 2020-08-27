<div align='center'>

# Firebase Database Modeler

[![npm version](https://badge.fury.io/js/firebase-database-modeler.svg)](https://www.npmjs.com/package/firebase-database-modeler)

</div>

Project not ready yet! Still fixing bugs and writing this README. Should be ready in a couple of weeks. I am using it in a real project, so the presentation of this one isn't the focus right now.

Supports firebase, firebase-admin and react-native-firebase packages

# Usage:

```typescript
import { finishModel, _, _$, mEmptyObj, modelerSetDatabase } from 'firebase-database-modeler';

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

stores._ref().push(
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

</br>

<b><h2> Functions </h2></b>

</br>

<b><h3> \_(key: string, nestedNode?: Node) </h3></b>

Creates a new node. First parameter is the node key; the name of it in the database.

The second parameter allows nesting.

You may pass a type to it.

```typescript
const root = _("/", {
  first: _("1st"),
  second: _("second", {
    nested: _<string>("stuff"),
  }),
});

database.second.nested._key(); // = 'stuff'
```

</br>

<b><h3> \_\$(key: string, nestedNode?: Node) </h3></b>

Creates a new Variable Node.

```typescript
const users = _$({
  name: _<string>("name"),
  age: _<number>("age"),
});
```

<b><h3> finishModel </h3></b>

</br>

<b><h2> Node properties </h2></b>

</br>

<b><h3> \_key: string </h3></b>

Returns the value you entered as the first argument of the \_ function.
Is the last part of the path.

```typescript
// E.g.:
users.$userId.stores._key; // Returns 'stores'
```

</br>

<b><h3> \_path: string </h3></b>

Returns the entire path (hierarchical concatenation of all keys). '\$' keys variables aren't converted.

```typescript
// E.g.:
stores.$storeId.name_path; // Returns 'stores/$/n'
```

</br>

<b><h3> \_pathWithVars (...vars: string[]) => string </h3></b>

Returns the path with '\$' variables converted. For each Variable Node, you must pass
its string value as parameter.

```typescript
// E.g.:
stores.$storeId.users.$userId_pathWithVars("abc", "DEADBEEF"); // Returns 'stores/abc/users/DEADBEEF
```

</br>

<b><h3> \_ref (...vars: string[]) => Reference </h3></b>

Returns a Realtime Database reference while using the same working of \_pathWithVars.

```typescript
// E.g.:
stores.$storeId.rating._ref("abc").set(2.7);
```

</br>

<b><h3> \_dbType : ModelLikeDbData </h3></b>

Use it with Typescript `typeof` to get the ModelLikeDbData type of the node. Its value is undefined, so, only useful for getting the type.

</br>

<b><h3> \_dataToDb (data: ModelLikeDbData) => any </h3></b>

Converts the inputted data to your database schema

</br>

<b><h3> \_dataFromDb (data: any) => ModelLikeDbData </h3></b>

Converts data from the database (gotten with on() or once()) to a model-like object, with typing.

</br>

<b><h3> \_onceVal (event: EventType, ...vars: string[]) => ModelLikeDbData </h3></b>

Same as model.\_dataFromDb(await model.\_ref(vars).once(event)).val()).

</br>

<b><h3> \_onVal (event: EventType, callback: (data: ModelLikeDbData) => void, ...vars: string[]) => Reference </h3></b>

Like Firebase ref.on(), it will call the callback for every time the event happens. But, this one will also call `model._dataFromDb(snapshot.val())` on the callback data.

</br>

<b><h3> \_exists (...vars: string[]): Promise\<boolean> </h3></b>

Returns if the reference exists.
Same as (await model.\_ref(vars).once('value')).exists()

```typescript
// E.g.:
await stores.$storeId.rating._exists(); // Will return true or false.
```

</br>

<b><h3> \_set (value: ModelLikeDbData, ...vars: string[]) => Promise\<any> </h3></b>

Same as model.\_ref(vars).set(value), with type checking on value.

</br>

<b><h3> \_update (value: Partial\<ModelLikeDbData>, ...vars: string[]) => Promise\<any> </h3></b>

Same as model.\_ref(vars).update(value), with type checking on value.

As the value have a Partial<> wrapping the ModelLikeDbData, its root properties are optional.

</br>

<b><h3> \_clone \<T> (...vars: string[]) => T </h3></b>

Deep clones the node applying vars to the '\$' keys in the path. Useful for not having to pass the vars all the time to a fixed ...

<br/>
<br/>

# Roadmap

- Optional properties.

- Optional database key; it would use the property key as the database key, getting them on finishModel().

- A generator for [Bolt](https://github.com/FirebaseExtended/bolt) using a model, or generate a model using a Bolt file.

- Firestore support. Easy to add, but I don't think I will ever use Firestore again (its max 1 write per second is a big limitation).

- \_push() with ModelLikeDbData

- Code testing
