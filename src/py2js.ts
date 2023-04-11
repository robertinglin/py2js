import { pythonBridge } from "python-bridge";

const instances = new Map<string, any>();

const showDebug = false;

const DEBUG = (...args: any[]) => {
  if (showDebug) {
    console.log(...args);
  }
};

const py2js = (instanceId?: string) => {
  if (!instanceId) {
    instanceId = "v" + Math.random().toString(36).substring(7);
  }

  if (instances.has(instanceId)) {
    return instances.get(instanceId);
  }

  const queue: any[] = [];

  const bridge = pythonBridge({
    stdio: ["pipe", process.stdout, process.stderr],
    cwd: process.cwd(),
  });

  bridge.ex`
  import os
  import sys
  sys.path.append(os.getcwd())
  `;

  // bridge.stdout.pipe(process.stdout);
  const importedLibraries = new Set<string>();

  const instance = (library: string, module?: string) => {
    if (!importedLibraries.has(library)) {
      if (module) {
        // @ts-ignore
        queue.push(bridge.ex([`from ${module} import ${library}`]));
      } else {
        // @ts-ignore
        queue.push(bridge.ex([`import ${library}`]));
      }
      importedLibraries.add(library);
    }

    const convert = (firstArg: string, funcArgs: any[], isFunction = true) => {
      const toExecute: string[] = [firstArg];
      const values: any[] = [];

      DEBUG(funcArgs, firstArg);

      funcArgs.forEach((arg, ind) => {
        if (typeof arg === "object" && arg.type === "pointer") {
          toExecute[toExecute.length - 1] += arg.__var;
          if (ind !== funcArgs.length - 1) {
            toExecute[toExecute.length - 1] += ", ";
          }
        } else if (
          typeof arg === "object" &&
          Object.keys(arg).every((key) => key.startsWith("="))
        ) {
          Object.keys(arg).forEach((key, ind) => {
            if (ind !== 0) {
              toExecute.push(", ");
            }
            toExecute[toExecute.length - 1] += `${key.slice(1)}=`;
            if (typeof arg[key] === "object" && arg[key].type === "pointer") {
              toExecute[toExecute.length - 1] += arg[key].__var;
            } else {
              values.push(arg[key]);
            }
          });
        } else {
          if (ind !== funcArgs.length - 1) {
            toExecute.push(", ");
          }
          if (Array.isArray(arg)) {
            toExecute[toExecute.length - 1] += "[";
            for (let i = 0; i < arg.length; i++) {
              if (typeof arg[i] === "object" && arg[i].type === "pointer") {
                toExecute[toExecute.length - 1] += arg[i].__var;
                if (i !== arg.length - 1) {
                  toExecute[toExecute.length - 1] += ", ";
                }
              } else {
                values.push(arg[i]);
                if (i !== arg.length - 1) {
                  toExecute.push(", ");
                }
              }
            }
            if (
              toExecute[toExecute.length - 1] === ", " ||
              (toExecute[toExecute.length - 1].endsWith("[") &&
                values.length !== 0)
            ) {
              toExecute.push("]");
            } else {
              toExecute[toExecute.length - 1] += "]";
            }
          } else {
            values.push(arg);
          }
        }
      });
      if (isFunction) {
        if (values.length === 0 || toExecute[toExecute.length - 1] === "]") {
          toExecute[toExecute.length - 1] += ")";
        } else {
          toExecute.push(")");
        }
      } else {
        toExecute.push(" ");
      }
      return { toExecute, values };
    };

    const execute = (toExecute: string[], values: any[]) => {
      const promise = new Promise((resolve, reject) => {
        bridge
          // @ts-ignore
          .ex(toExecute, ...values)
          .then((res: any) => {
            resolve(res);
          })
          .catch((err: any) => {
            const error = new Error(err.exception.message);
            // @ts-ignore
            error.exception = err;
            reject(error);
          });
      });
      queue.push(promise);
      return promise;
    };

    const createPointer = (varName: string, promise: Promise<any>) => {
      return new Proxy(
        {
          type: "pointer",
          __var: varName,
          promise: promise,
          __print: () => {
            const toExecute = `print(${varName})`;
            // @ts-ignore
            queue.push(bridge.ex([toExecute]));
          },
          __get: async () => {
            await promise;
            // @ts-ignore
            return await bridge([varName]).catch((err: any) => {
              if (err.exception.type.name !== "NameError") {
                throw err;
              }
              return undefined;
            });
          },
        },
        {
          get: (_target, functionName: string) => {
            // @ts-ignore
            if (_target[functionName]) {
              // @ts-ignore
              return _target[functionName];
            }
            if (functionName === "then") return null;
            return (...args: any[]) => {
              // create random var name
              const nextVar = "v" + Math.random().toString(36).substring(7);
              const { toExecute, values } = convert(
                `${nextVar} = ${varName}.${functionName}(`,
                Array.from(args)
              );

              DEBUG("POINTER", toExecute, values);

              return createPointer(nextVar, execute(toExecute, values));
            };
          },
          set: (_target, setName: string, value: any) => {
            const { toExecute, values } = convert(
              `${varName}.${setName} =`,
              [value],
              false
            );
            DEBUG("POINTERSET", toExecute, values);
            execute(toExecute, values);

            return true;
          },
        }
      );
    };

    return new Proxy(
      {},
      {
        get: (_target, functionName: string) => {
          if (functionName === "then") return null;

          return (...args: any[]) => {
            // create random var name
            const varName = "v" + Math.random().toString(36).substring(7);
            const { toExecute, values } = convert(
              `${varName} = ${library}.${functionName}(`,
              Array.from(args)
            );
            DEBUG("COREGET", toExecute, values);

            return createPointer(varName, execute(toExecute, values));
          };
        },
        set: (_target, setName: string, value: any) => {
          const { toExecute, values } = convert(
            `${library}.${setName} =`,
            [value],
            false
          );
          DEBUG("CORESET", toExecute, values);

          execute(toExecute, values);
          return true;
        },
      }
    );
  };

  instances.set(instanceId, instance);

  instance.bridge = bridge;
  instance.end = () => {
    bridge.end();
    if (instanceId) instances.delete(instanceId);
  };
  instance.id = instanceId;

  return instance;
};
export default py2js;
