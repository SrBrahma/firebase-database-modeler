import { firebase } from '../firebase'; // ToDo deal with it. init function passing the firebase?
// But is a namespace. Pass the database()? But what about the database.Reference?


interface Node {
  _key: string;
  _path: string;

  /*
   * Make sure you pass the same count of vars and $vars you have on the model path.
   * @memberof ModelNodeI
   */
  _pathWithVars: (...vars: string[]) => string;
  _ref: (...vars: string[]) => firebase.database.Reference;
}

const allDolarRegex = new RegExp('\\$', 'g');

// Returns a Node
export function _<T>(key: string, rest: T = {} as T): Node & T {
  return {
    _key: key,
    _path: '',
    _pathWithVars(...vars: string[]) {
      return this._path.replace(allDolarRegex, () => vars.shift()!);
    },
    _ref(...vars: string[]) {
      return firebase.database().ref(this._pathWithVars(...vars));
    },
    ...(rest)
  };
}



function recursivePather(parentPath: string, currentObj: any) {

  if (currentObj.hasOwnProperty('_path')) {
    if (!parentPath)
      currentObj._path = currentObj._key;
    else
      currentObj._path = parentPath + '/' + currentObj._key;

    parentPath = currentObj._path;
  }
  for (const child of Object.values(currentObj))
    if (typeof child === 'object' && child !== null)
      recursivePather(parentPath, child);
}


export function createModel<T>(model: T, parentPath = ''): T {
  recursivePather(parentPath, model);
  return model;
}