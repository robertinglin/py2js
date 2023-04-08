# py2js

Py2js wraps python-bridge allowing any python library to be used as if it were a JS library instead.

For example once you've installed numpy through pip you can run the following.

```
 const py = py2js();
  const np = py("numpy");
  const npArray = np.array([1, 2, 3]);
  const flipped = np.flip(npArray);
  const preList = flipped.tolist();
  expect(await preList.__get()).toEqual([3, 2, 1]);

  const list = np.array([npArray, flipped]).tolist();
  expect(await list.__get()).toEqual([
    [1, 2, 3],
    [3, 2, 1],
  ]);
  py.end();
```
