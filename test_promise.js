const a = new Promise(res => {
  console.log('before promise resolve');
  let x = 1;
  res(`aaa: ${x}`);
  x = 2;
  console.log('after promise resolve');
});
console.log('after a');
a.then(msg => console.log(msg));
a.then(msg => console.log(msg));
