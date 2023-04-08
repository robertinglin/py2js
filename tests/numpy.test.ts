import py2js from "../src/py2js";

test("numpy", async () => {
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
});
