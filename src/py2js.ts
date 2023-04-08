import { pythonBridge } from "python-bridge";

const instances = new Map<string, any>();

const py2js = (instanceId?: string) => {
  if (!instanceId) {
    instanceId = "default";
  }

  if (instances.has(instanceId)) {
    return instances.get(instanceId);
  }

  const queue: any[] = [];

  const bridge = pythonBridge({
    stdio: ["pipe", process.stdout, process.stderr],
  });
  // bridge.stdout.pipe(process.stdout);
  const importedLibraries = new Set<string>();

  const instance = (library: string) => {
    if (!importedLibraries.has(library)) {
      // @ts-ignore
      queue.push(bridge.ex([`import ${library}`]));
      importedLibraries.add(library);
    }

    const convert = (firstArg: string, funcArgs: any[]) => {
      const toExecute: string[] = [firstArg];
      const values: any[] = [];
      funcArgs.forEach((arg, ind) => {
        if (typeof arg === "object" && arg.type === "pointer") {
          toExecute[toExecute.length - 1] += arg.var;
          if (ind !== funcArgs.length - 1) {
            toExecute[toExecute.length - 1] += ", ";
          }
        } else {
          if (ind !== funcArgs.length - 1) {
            toExecute.push(", ");
          }
          if (Array.isArray(arg)) {
            toExecute[toExecute.length - 1] += "[";
            for (let i = 0; i < arg.length; i++) {
              if (typeof arg[i] === "object" && arg[i].type === "pointer") {
                toExecute[toExecute.length - 1] += arg[i].var;
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
            if (toExecute[toExecute.length - 1] === ", ") {
              toExecute.push("]");
            } else {
              toExecute[toExecute.length - 1] += "]";
            }
          } else {
            values.push(arg);
          }
        }
      });
      if (!toExecute[toExecute.length - 1].endsWith(", ")) {
        toExecute[toExecute.length - 1] += ")";
      } else {
        toExecute.push(")");
      }
      return { toExecute, values };
    };

    const createPointer = (varName: string) => {
      const queuePosition = queue.length;
      return new Proxy(
        {
          type: "pointer",
          var: varName,
          __print: () => {
            const toExecute = `print(${varName})`;
            // @ts-ignore
            queue.push(bridge.ex([toExecute]));
          },
          __get: async () => {
            await Promise.all(queue.slice(queuePosition));
            // @ts-ignore
            return await bridge([varName]);
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

              // @ts-ignore
              queue.push(bridge.ex(toExecute, ...values));

              return createPointer(nextVar);
            };
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

            // @ts-ignore
            queue.push(bridge.ex(toExecute, ...values));

            return createPointer(varName);
          };
        },
      }
    );
  };

  instances.set(instanceId, instance);

  instance.__bridge = bridge;
  instance.end = () => {
    bridge.end();
  };

  return instance;
};
export default py2js;
