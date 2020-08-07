import { applyPaths, _, mEmptyObj, _$ } from './src/modeler';

// _() should be informally "named" as create node.




export const stores = _('stores', {
  $storeId: _$({
    users: _('users', {
      $userId: _$({
        isOwner: _<boolean>('isOwner'),
        isMod: _<boolean>('isMod'),
      })
    }),
    accessesData: _('accessesData', {
      $accessId: _$({
        count: _<number>('count'),
        lastUpdate: _<number>('lastUpdate'),
      })
    }),
    accessesInfo: _('accessesInfo', {
      $accessId: _$({
        name: _<string>('name'),
        currentUser: _<string>('currentUser'),
        isActive: _<boolean>('isActive'),
      })
    }),
    name: _<string>('name'),
    createdAt: _<number>('createdAt'),
    trialUntil: _<number>('trialUntil'),
    licenseUntil: _<number>('licenseUntil'),
  })
});

export const users = _('users', {
  $userId: _$({
    stores: _('stores', {
      // For now, an empty object, as someday there may an info inside.
      $storeId: _$<mEmptyObj>()
    })
  })
});

export const root = _('', {
  users,
  stores
});

applyPaths(root);

