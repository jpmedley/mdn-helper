let constructor = tree._interface.extAttrs.items[n];
let exposed;
let raisesException;

let property = tree._interface.members[n] // where .type = 'attribute';
let stringifier = has(tree._interface.members[n].stringifier_);
let getter = has(tree._interface.members[n].getter);
let setter = has(tree._interface.members[n].setter);
let readonly = tree._interface.members[n].attribute.readonly != null;
let method = tree._interface.members[n] // where .type = 'operation'

//return value for properties (new structure):
let ret = item[1].idlType.baseName;
//return value for properties returning a promise:
let ret = item[1].idltype[0].idltype;
  //Promise itself is at:
  let pr = item[1].idlType.baseName;
