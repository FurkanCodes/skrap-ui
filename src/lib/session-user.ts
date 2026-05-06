export interface ViewerSessionUser {
  id: string | null;
  email: string | null;
  name: string | null;
  image: string | null;
}

export function extractSessionUser(session: unknown): ViewerSessionUser | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const maybeUser = (session as { user?: unknown }).user;
  if (!maybeUser || typeof maybeUser !== "object") {
    return null;
  }

  const user = maybeUser as {
    id?: unknown;
    email?: unknown;
    name?: unknown;
    image?: unknown;
  };
  const id = typeof user.id === "string" && user.id.trim().length > 0 ? user.id : null;
  const email = typeof user.email === "string" && user.email.trim().length > 0 ? user.email : null;
  const name = typeof user.name === "string" && user.name.trim().length > 0 ? user.name : null;
  const image = typeof user.image === "string" && user.image.trim().length > 0 ? user.image : null;

  if (!id && !email && !name && !image) {
    return null;
  }

  return { id, email, name, image };
}
