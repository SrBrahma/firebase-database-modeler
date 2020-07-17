// This is an real example.

import { createModel, _ } from './src/modeler';

export const stores = createModel(
  _('stores', {
    $storeId: _('$', {
      users: _('users', {
        $userId: _('$', {
          isOwner: _('isOwner'),
          isMod: _('isMod'),
        })
      }),
      accessesData: _('accessesData', {
        $accessId: _('$', {
          count: _('count'),
          lastUpdate: _('lastUpdate'),
        })
      }),
      accessesInfo: _('accessesInfo', {
        $accessId: _('$', {
          name: _('name'),
          currentUser: _('currentUser'),
          isActive: _('isActive'),
        })
      }),
      name: _('name'),
      createdAt: _('createdAt'),
      trialUntil: _('trialUntil'),
      licenseUntil: _('licenseUntil'),
    })
  })
);

export const users = createModel(
  _('users', {
    $userId: _('$', {
      stores: _('stores', {
        $storeId: _('$')
      })
    })
  })
);


export const db = {
  users,
  stores
};