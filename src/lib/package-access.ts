export type PackageUser = { id: string; role?: string | null };

export function packageScope(user: PackageUser) {
  return user.role === "admin" ? {} : { createdById: user.id };
}

export function canAccessPackage(user: PackageUser, createdById: string) {
  return user.role === "admin" || user.id === createdById;
}
