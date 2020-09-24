<div align="center">

# Firebase Database Modeler

[![npm version](https://badge.fury.io/js/firebase-database-modeler.svg)](https://www.npmjs.com/package/firebase-database-modeler)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![TypeScript](https://badgen.net/npm/types/env-var)](http://www.typescriptlang.org/)

</div>

Project not ready yet! Still fixing bugs and writing this README. Should be ready in a couple of weeks. I am using it in a real project, so the presentation of this one isn't the focus right now.

Supports firebase, firebase-admin and react-native-firebase packages

# Instalation

```js
npm install --save firebase-database-modeler
// or
yarn add firebase-database-modeler
```

# Usage

```typescript
import { finishModel, _, _$, mEmptyObj, modelerSetDatabase } from 'firebase-database-modeler';

// There are multiple ways of setting up the database depending of the firebase package
// you are using (firebase, firebase-admin or react-native-firebase).
// Read their docs to see how to obtain the respective firebase.database().
const database = firebase.database()

modelerSetDatabase(database)

const stores = _('stores', {
  $storeId: _$({
    name: _<string>('n'), // The DB node key can be different from the model key
    rating: _<number>('rating'),
    open: _<boolean>('open')
    users: _('users', {
      $userId: _$({
        name: _<string>('name')
      })
    })
  })

const root = _('/', {
  stores
})

// This must be called after setting your model at the root of your model.
finishModel(root);

const newStoreId = (await stores._push({
  name: 'Cool Store',
  rating: 4.2,
  open: true,
  users: {
    [aUserId]: {
      name: theUserName
    };
  }
})).key! // ! because the type of Reference.key is string | null, but we know that in this case it is a string

stores.$storeId.name._ref(newStoreId).set('New Name!') // Changes 'Cool Store' to 'New Name!'
// Or also
stores.$storeId.name._set('New Name!', newStoreId)
```

# API

<br/>

## Functions

<br/>

<b><h3> \_(key: string, nestedNode?: Node) => Node </h3></b>

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

<br/>

<b><h3> \_\$(key: string, nestedNode?: Node) => Node </h3></b>

Creates a new Variable Node.

```typescript
const users = _$({
  name: _<string>("name"),
  age: _<number>("age"),
});
```

<b><h3> finishModel(model: Node, initialPath: string = '') </h3></b>

You must call it after setting up the model to recursively apply the _path's.


<br/>

<b><h3> pathSegmentIsValid(segment: string): boolean </h3></b>

A path segment is "each/part/of/a/path", separated by '/'. This function checks if the given segment is a string, and if matches the RegEx `/^[a-zA-Z0-9_-]+$/` . Useful to check if the client/server is using a valid and safe path.

This is automatically called by `_pathWithVars` (see below)


<br/>

## Node properties

<br/>

<b><h3> \_key: string </h3></b>

Returns the value you entered as the first argument of the \_ function.
Is the last part of the path.

```typescript
// E.g.:
users.$userId.stores._key; // Returns 'stores'
```


<br/>

<b><h3> \_path: string </h3></b>

Returns the entire path (hierarchical concatenation of all keys). '\$' keys variables aren't converted.

```typescript
// E.g.:
stores.$storeId.users.$usersId.name._path; // Returns 'stores/$/users/$/name'
```


<br/>

<b><h3> \_pathWithVars (...vars: string[]) => string </h3></b>

Returns the path with *'\$'* variables converted. For each Variable Node, you must pass
its string value as parameter. Each `vars` item is tested with the `pathSegmentIsValid` function.

```typescript
// E.g.:
stores.$storeId.users.$userId_pathWithVars("abc", "DEADBEEF"); // Returns 'stores/abc/users/DEADBEEF
```


<br/>

<b><h3> \_pathTo (targetNode: Node, ...vars: string[]) => string </h3></b>

Returns the path from the current node to the given target node. If the target node is not a child of any level of the current node, an error is thrown. _pathWithVars(...vars) is executed. The current node key / segment isn't included in the result, but is the target node.

This method is very useful to use in a update() function as the object key, as you can easily

```typescript
// E.g.:

const m$storeId = stores.$storeId; // Just to reduce code size

m$storeId._pathTo(m$storeId.users.$userId); // Returns 'users/$'

m$storeId._pathTo(m$storeId.users.$userId, 'xyz'); // Returns 'users/xyz'

// Example to show its functionality in update(). This example will change at the same time both users names.
m$storeId._ref().update({
  [m$storeId._pathTo(m$storeId.users.$userId.name, 'store1', 'user1')]: 'John',
  [m$storeId._pathTo(m$storeId.users.$userId.name, 'store1', 'user2')]: 'Anna',
})
```


<br/>

<b><h3> \_ref (...vars: string[]) => Reference </h3></b>

Returns a Realtime Database reference while using the same working of \_pathWithVars.

```typescript
// E.g.:
stores.$storeId.rating._ref("abc").set(2.7);
```


<br/>

<b><h3> \_dbType : ModelLikeDbData </h3></b>

Use it with Typescript `typeof` to get the ModelLikeDbData type of the node. Its value is undefined, so, only useful for getting the type.

<br/>

<b><h3> \_dataToDb (data: ModelLikeDbData) => any </h3></b>

Converts the inputted data to your database schema

<br/>

<b><h3> \_dataFromDb (data: any) => ModelLikeDbData </h3></b>

Converts data from the database (gotten with on() or once()) to a model-like object, with typing.

<br/>

<b><h3> \_onceVal (event: EventType, ...vars: string[]) => ModelLikeDbData </h3></b>

Same as `model._dataFromDb(await model.\_ref(vars).once(event)).val()`.

<br/>

<b><h3> \_onVal (event: EventType, callback: (data: ModelLikeDbData) => void, ...vars: string[]) => Reference </h3></b>

Like Firebase ref.on(), it will call the callback for every time the event happens. But, this one will also call `model._dataFromDb(snapshot.val())` on the callback data.


<br/>

<b><h3> \_exists (...vars: string[]): Promise\<boolean> </h3></b>

Returns if the reference exists.
Same as `(await model._ref(vars).once('value')).exists()`

```typescript
// E.g.:
await stores.$storeId.rating._exists(); // Will return true or false.
```


<br/>

<b><h3> \_set (value: ModelLikeDbData, ...vars: string[]) => Promise\<any> </h3></b>

Same as `model._ref(vars).set(model._dataToDb(value))`, with type checking on value.


<br/>

<b><h3> \_update (value: Partial\<ModelLikeDbData>, ...vars: string[]) => Promise\<any> </h3></b>

Same as `model._ref(vars).update(model._dataToDb(value))`, with type checking on value.

As the value have a Partial<> wrapping the ModelLikeDbData, its root properties are optional.


<br/>

<b><h3> \_push (value: \<ModelLikeDbData>, ...vars: string[]) => Promise\<any> </h3></b>

Same as `model._ref(vars).push((model._dataToDb(value)))`, with type checking on value.

With the same working of ref().push(), you may pass undefined as the `value` to just create the reference (to access the client side `key` property), without actually storing the new data. To learn more about it, Google it!

If the child of the used model is a VarNode, the `value` type will smartly be `~"ModelLikeDbData<child>"`

<br/>

<b><h3> \_clone \<T> (...vars: string[]) => T </h3></b>

Deep clones the node applying vars to the '\$' keys in the path. Useful for not having to pass the vars all the time to a fixed ...(TODO)

<br/>
<br/>

# Roadmap

- Optional properties.

- Optional database key; it would use the property key as the database key, getting them on finishModel().

- A generator for [Bolt](https://github.com/FirebaseExtended/bolt) using a model, or generate a model using a Bolt file.

- Firestore support. Easy to add, but I don't think I will ever use Firestore again (its max 1 write per second is a big limitation).

- Code testing
