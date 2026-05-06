import messages from "@/messages/en.json";

type MessageValues = Record<string, string | number>;

function readNestedMessage(path: string): string {
  const value = path
    .split(".")
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object") {
        return undefined;
      }

      return (current as Record<string, unknown>)[segment];
    }, messages);

  return typeof value === "string" ? value : path;
}

function interpolate(message: string, values?: MessageValues): string {
  if (!values) {
    return message;
  }

  return message.replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export function getMessage(path: string, values?: MessageValues): string {
  return interpolate(readNestedMessage(path), values);
}

export function getMessages(namespace: string) {
  return (key: string, values?: MessageValues) =>
    getMessage(`${namespace}.${key}`, values);
}
