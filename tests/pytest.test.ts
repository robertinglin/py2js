import py2js from "../src/py2js";

test("runs", async () => {
  const py = py2js();
  try {
    const pt = py("pytest", "tests.pytest");
    const res = pt.test();
    res.a = 3;
    const res2 = res.test();
    await res2.promise;
    expect(await res2.__get()).toBe(3);
  } finally {
    py.end();
  }
});
