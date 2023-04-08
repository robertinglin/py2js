import py2js from "../src/py2js";

test("runs", async () => {
  const py = py2js();
  const pt = py("pytest", "tests.pytest");
  await pt.test().promise;
  py.end();
});
