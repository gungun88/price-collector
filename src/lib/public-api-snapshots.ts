import "server-only";

export const PUBLIC_API_SNAPSHOT_SCHEMA_VERSION = 1;

export type PublicApiSnapshotKind =
  | "explorer"
  | "offers"
  | "product_offers"
  | "merchants"
  | "refresh_state"
  | "api_transit";

export type PublicApiSnapshotPayload<T> = {
  generatedAt: string;
  value: T;
};

export async function readPublicApiSnapshot<T>(
  _kind: PublicApiSnapshotKind,
  _key: string,
): Promise<PublicApiSnapshotPayload<T> | null> {
  return null;
}

export async function writePublicApiSnapshot<T>(_input: {
  kind: PublicApiSnapshotKind;
  key: string;
  payload: T;
  generatedAt?: string;
}): Promise<boolean> {
  return false;
}
