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

test("single object in array", async () => {
  const py = py2js();
  try {
    const pt = py("pytest", "tests.pytest");
    const test = pt.test();
    const result = await test
      .arrayTest([{ woo: "some named variable" }])
      .__get();
    expect(result).toStrictEqual([{ woo: "some named variable" }]);
  } finally {
    py.end();
  }
});

test("multiple objects in array", async () => {
  const py = py2js();
  try {
    const pt = py("pytest", "tests.pytest");
    const test = pt.test();
    const result = await test
      .arrayTest([
        { woo: "some named variable" },
        { hoo: "some more variables" },
      ])
      .__get();
    expect(result).toStrictEqual([
      { woo: "some named variable" },
      { hoo: "some more variables" },
    ]);
  } finally {
    py.end();
  }
});

test("exception", async () => {
  const py = py2js();
  try {
    const pt = py("pytest", "tests.pytest");
    const test = pt.test();
    await test.exceptionTest().promise;
  } catch (e) {
    expect(e.message).toBe("test exception");
    return;
  } finally {
    py.end();
  }
  expect("to never get here").toEqual(true);
});
