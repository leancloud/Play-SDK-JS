const a = new Promise(resolve => {
  console.log('before promise resolve');
  let x = 1;
  resolve(`aaa: ${x}`);
  x = 2;
  console.log('after promise resolve');
});
a.then(msg => console.log(msg));
a.then(msg => console.log(msg));
