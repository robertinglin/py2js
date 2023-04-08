import py2js from "../src/py2js";

const main = async () => {
  const py = py2js();
  const np = py("numpy");
  const npArray = np.array([1, 2, 3]);
  const flipped = np.flip(npArray);
  const preList = flipped.tolist();
  console.log(await preList.__get());

  const list = np.array([npArray, flipped]).tolist();
  console.log(await list.__get());
  py.end();
};

main();
