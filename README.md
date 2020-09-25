<div align="center">

# Firebase Database Modeler

[![npm version](https://badge.fury.io/js/firebase-database-modeler.svg)](https://www.npmjs.com/package/firebase-database-modeler)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![TypeScript](https://badgen.net/npm/types/env-var)](http://www.typescriptlang.org/)

</div>

Firebase Database Modeler upgrades your Realtime Database to a whole new level!

Full and awesome Typescript support!


Supports firebase, firebase-admin and react-native-firebase packages.

README still being improved. Not a focus right now, as I am using this package in a full time real project development.


# Instalation

```js
npm install --save firebase-database-modeler
// or
yarn add firebase-database-modeler
```

# Usage

```typescript
import { _, _$, _root, modelerSetDefaultDatabase } from 'firebase-database-modeler';

// There are multiple ways of setting up the database depending of the firebase package
// you are using (firebase, firebase-admin or react-native-firebase).
// Read their docs to see how to get the firebase.database().
const database = firebase.database()

modelerSetDefaultDatabase(database)

const stores = _('stores', {
  $storeId: _$({
    name: _<string>('n'), // The DB property key can be different from the model property key!
    rating: _<number>('rating'),
    open: _<boolean>('open')
    users: _('users', {
      $userId: _$({
        name: _<string>('name')
      })
    })
  })
})

const root = _root({
  stores
})

async function createStore(storeId: string, userId: string, userName: string) {
  // Typescript IntelliSense will fully guide you to build the object!
  // In _set(), all the model properties are required.
  await stores.$storeId._set({
    name: 'Cool Store', // In the model declaration, we've set this name property
                        // to have the key 'n' in the DB. _set() automatically converts this!
    rating: 4.2,
    open: true,
    users: {
      [userId]: {
        name: userName
      };
    }
  }, storeId) // This storeId variable will be used as the $storeId path segment
}

async function setStoreName(storeId: string, newName: string) {
  // Typescript will complain if the _set() first argument is not a string, in this case.
  await stores.$storeId._set(newName, storeId)
}

// The type of this function will be the store model type! This package
// automatically converts the model schema to the DB schema!
async function getStore(storeId: string) {
  return await stores.$storeId._onceVal('value', storeId)
}

```


# API

<br/>

## Functions

<br/>

<b><h3> \_(key: string, children?: Node) : Node </h3></b>

Creates a Node. First parameter is the Node key: the name of it in the database.

The second parameter allows Node nesting.

You may pass a type to it.

```typescript
const root = _('/', {
  first: _('1st'),
  second: _('second', {
    nested: _<string>('stuff'),
  }),
});

database.second.nested._key(); // = 'stuff'
```


<br/>

<b><h3> \_\$(key: string, children?: Node) : Node </h3></b>

Creates a Variable Node. It's the same as calling `_('$', children)`.

```typescript
const users = _('users', {
  $userId: _$({
    name: _<string>('name'),
    age: _<number>('age'),
  })
})
```


<br/>

<b><h3> \_\/(key: string, children?: Node) : Node </h3></b>

Creates a Root Node. You MUST call this to your Model root to make everything work. It's the same as calling `_('/', children)`.

```typescript
const root = _root({
  users:
  name: _<string>('name'),
  age: _<number>('age'),
});
```


<b><h3> pathSegmentIsValid(segment: string) : boolean </h3></b>

A path segment is 'each/part/of/a/path', separated by '/'. This function checks if the given segment is a string, and if matches the RegEx `/^[a-zA-Z0-9_-]+$/` . Useful to check if the client/server is using a valid and safe path.

This is automatically called by `_pathWithVars` (see below)


<br/>

## Node properties

<br/>

<b><h3> \._key : string </h3></b>

Returns the value you entered as the first argument of the \_ function.
Is the last part of the path.

```typescript
// E.g.:
users.$userId.stores._key; // Returns 'stores'
```


<br/>

<b><h3> \._path : string </h3></b>

Returns the entire path (hierarchical concatenation of all keys / segments). '\$' keys variables aren't converted.

This property is recursively set when you call the `_root({yourModel})`, and that's why we have to call it.

```typescript
// E.g.:
stores.$storeId.users.$userId.name._path; // Returns 'stores/$/users/$/name'
```


<br/>

<b><h3> \._pathWithVars (vars?: string | string[]) => string </h3></b>

Returns the path with **'\$'** variables converted. For each Variable Node, you must pass
its string value as parameter. Each `vars` item is tested with the `pathSegmentIsValid` function.

```typescript
// E.g.:
stores.$storeId.users.$userId_pathWithVars(['abc', '0xDEADBEEF']); // Returns 'stores/abc/users/0xDEADBEEF
```


<br/>

<b><h3> \._pathTo (targetNode: Node, vars?: string | string[]) => string </h3></b>

Returns the path from the current node to the given target node. If the target node is not a child of any level of the current node, an error is thrown. _pathWithVars(...vars) is executed. The current node key / segment isn't included in the result, but is the target node.

The `vars` here is relative: You must only pass the vars that are after the model you called the _pathTo. Example below.

This method is very useful in a update() function as the object dynamic key. Example below.


```typescript
// E.g.:

const m$storeId = stores.$storeId; // Just to reduce code size. This 'm' in the start of the const stands for model. I use this "standard" in my codes.

m$storeId._pathTo(m$storeId.users.$userId); // Returns 'users/$'

m$storeId._pathTo(m$storeId.users.$userId, 'xyz'); // Returns 'users/xyz'. Notice that the vars 'xyz' is for the $userId and not for the $storeId.

// Example to show its functionality in update(). This example will change at the same time both users names. We do not use _update() as we are not following the object model properties directly.
m$storeId._ref('store1').update({
  [m$storeId._pathTo(m$storeId.users.$userId.name, 'user1')]: 'John', // _pathTo result is 'users/user1/name'
  [m$storeId._pathTo(m$storeId.users.$userId.name, 'user2')]: 'Anna', // _pathTo result is 'users/user2/name'
})
```


<br/>

<b><h3> \._dbType : ModelLikeDbData </h3></b>

Use it with Typescript `typeof` to get the ModelLikeDbData type of the node. Its real value is undefined, so, only useful for getting the type.

**ModelLikeDbData** is a type that is almost like to the DB schema, but with the property keys still being the model ones. `~'$variableNodes: (childrenNodesType)'` types are converted to `~'[x: string]: (childrenNodesType)'`. You will read this type name a few times in this README.

You probably won't use this property directly.


<br/>

<b><h3> \._ref (vars?: string | string[], database?: Database) => Reference </h3></b>

Returns a Realtime Database reference while using the same working of \_pathWithVars.

If you are using more than one Realtime Database instances in your project, you may pass it as argument.

The `vars` and `database` parameters will appear in another functions, with the same functionality.

```typescript
// E.g.:
stores.$storeId.rating._ref('abc').set(2.7);
```





<br/>

<b><h3> \._dataToDb (data: ModelLikeDbData) => any </h3></b>

Converts the inputted data to your Realtime Database schema, the exact way that will appear in your DB.


<br/>

<b><h3> \._dataFromDb (data: any) => ModelLikeDbData </h3></b>

Converts data from the DB (received with ref.on() or ref.once()) to a Model-Like object, with typings.


<br/>

<b><h3> \._onceVal (event: EventType, vars?: string | string[], database?: Database) => ModelLikeDbData </h3></b>

A simple way to retrieve data from the DB once.

Same as `model._dataFromDb(await model.\_ref(vars).once(event)).val()`.


<br/>

<b><h3> \._onVal (event: EventType, callback: (data: ModelLikeDbData) => void, vars?: string | string[], database?: Database) => Reference </h3></b>

Like Firebase `ref.on()`, it will execute the callback for every time the event happens. This one will also execute `model._dataFromDb(snapshot.val())` in the snapshot.


<br/>

<b><h3> \._exists (vars?: string | string[], database?: Database) => Promise\<boolean> </h3></b>

Returns if the reference exists.
Same as `(await model._ref(vars).once('value')).exists()`

```typescript
// E.g.:
await stores.$storeId.rating._exists(); // Will return true or false.
```


<br/>

<b><h3> \._set (value: ModelLikeDbData, vars?: string | string[], database?: Database) => Promise\<any> </h3></b>

Same as `model._ref(vars).set(model._dataToDb(value))`, with type checking on value.


<br/>

<b><h3> \._update (value: Partial\<ModelLikeDbData>, vars?: string | string[], database?: Database) => Promise\<any> </h3></b>

Same as `model._ref(vars).update(model._dataToDb(value))`, with type checking on value.

As the value have a Partial<> wrapping the ModelLikeDbData, its root properties are optional.


<br/>

<b><h3> \._push (value: \<ModelLikeDbData>, vars?: string | string[], database?: Database) => Promise\<any> </h3></b>

Same as `model._ref(vars).push((model._dataToDb(value)))`, with type checking on value.

With the same working of ref().push(), you may pass undefined as the `value` to just create the reference (to access the client side `key` property), without actually storing the new data. To learn more about it, Google about push() with or without arguments!

If the child of the used model is a Variable Node, the `value` type will smartly be `~'ModelLikeDbData<child>'` ( = if your model is stores/$storeId/... and you call stores._push(), the type annotation will be the $storeId type)

```typescript
// E.g.:
const newStoreId = (await stores._push({
  name: 'Cool Store',
  rating: 4.2,
  open: true,
  users: {
    [aUserId]: {
      name: theUserName
    };
  }
})).key! // ! because the type of Reference.key is (string | null), but we know that in this case it is a string

stores.$storeId.name._ref(newStoreId).set('New Name!') // Changes 'Cool Store' to 'New Name!'
```


<br/>

<b><h3> \._clone \<T> (vars?: string | string[]) => T </h3></b>

Deep clones the Node applying vars to the '\$' keys to the new cloned model ._path. Useful for not having to pass the vars all the time to a Model that you will use for a while, like having it in a Class.


<br/>
<br/>

# Roadmap

- Optional properties.

- Optional database key; it would use the property key as the database key, getting them on finishModel().

- Firestore support. Easy to add, but I don't think I will ever use Firestore again (its max 1 write per second is a big limitation).

- Code tests

- Improve this README


<br/>

# Attention!

### Model object reuse

Don't use the same model object in more than one place! See example.

```typescript
const modelObj = {
  prop: _<string>('prop')
};
const root = _root({
  model1: _('segment1', model),
  model2: _('segment2', model),
})
root.model1.prop._path()
// This will return /segment2/prop instead of /segment1/prop, because the path
// applied to model2.prop was also applied to model1.prop, as they are the same object.
// This "same path" behavior applies to any DB operation you would do.
```

To avoid this issue, you can either create a modelObj2 with the same content, or use the `deepClone` function that this package exports. It just deep clones an object.


### Not allowed characters

Your Realtime Database paths / segments must not include '$' char and it's not recomended to a segment to start with an '_', as those chars are specially treated by this package.

For this package model keys, only the '_' recommendation remains ( = you may use the '$'. Actually, is recommended to use it to indicate that it is a Variable Node).

IDs generated by Firebase Auth and Realtime Database reference.push() don't include '$' and doesn't start with an '_'.