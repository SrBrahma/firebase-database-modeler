// General tests for internal development.

import { _, _$, _root } from './src';
import { Id, NullUndefinedPropsToOptional } from './src/types';
import { mEmptyObj, obj } from './src/utils';

export const root = _root({
  logs: _('l', {
    $logId: _$({
      key: _<string | null>('k'),
      data: _<number>('a')
    })
  })
});


type keyT = typeof root.logs.$logId.key._dbType;
type dataT = typeof root.logs.$logId.data._dbType;
type logIdT = typeof root.logs.$logId._dbType;
type logsT = typeof root.logs._dbType;
type rootT = typeof root._dbType;

type Q<T> = T extends obj ? keyof T : T;

type k = 'k';
type check = string extends k ? 1 : 0;

// type log2 = NullUndefinedPropsToOptional<logIdType>;

type fakeLogId = NullUndefinedPropsToOptional<{
  key: number,
  data: string | null,
}>;

type logs = {
  [x: string]: fakeLogId;
} | null;


type A = NullUndefinedPropsToOptional<logs>;

const AA: A = {

};

export const master = _root({
  users: _('u', {
    $userId: _$({
      joinedAt: _<number | null>('jA'),
      name: _<string>('n'),
      nameProvider: _<string | null>('nP'), // The user name that the provider exposes
      email: _<string | null>('e'), // The user email that the provider exposes
      provider: _<string | null>('p'),
      stores: _('s', {
        $storeId: _$<mEmptyObj>()
      })
    })
  })
});


type masterRoot = typeof master._dbType;

type AQQ = '$' extends '$' ? 1 : 0;