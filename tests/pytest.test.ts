import py2js from "../src/py2js";

test("runs", async () => {
  const py = py2js();
  try {
    const pt = py("pytest", "tests.pytest");
    const res = pt.test();
    res.a = 3;
    const res2 = res.test({ "=a1": "some named variable" });
    await res2.promise;
    expect(await res2.__get()).toStrictEqual([
      3,
      "some named variable",
      "argument",
    ]);
  } finally {
    py.end();
  }
});
