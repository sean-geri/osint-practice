import { CollectionExistsError, connect, type Bucket, type Cluster, type Collection } from 'couchbase';

// Each kind of document lives in its own collection inside the bucket's default scope.
export const COLLECTIONS = ['domains', 'ips'] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

const SCOPE = '_default';

let cluster: Cluster | undefined;
let bucket: Bucket | undefined;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env variable: ${name}`);
  return value;
}

// Creates any missing collections, so a fresh bucket works without manual setup.
async function ensureCollections(target: Bucket): Promise<void> {
  const manager = target.collections();
  for (const name of COLLECTIONS) {
    try {
      await manager.createCollection(name, SCOPE);
      console.log(`Created Couchbase collection: ${SCOPE}.${name}`);
    } catch (err) {
      if (!(err instanceof CollectionExistsError)) throw err;
    }
  }
}

export async function connectCouchbase(): Promise<void> {
  cluster = await connect(requireEnv('COUCHBASE_URL'), {
    username: requireEnv('COUCHBASE_USERNAME'),
    password: requireEnv('COUCHBASE_PASSWORD'),
  });
  bucket = cluster.bucket(requireEnv('COUCHBASE_BUCKET'));
  await ensureCollections(bucket);
}

export function getCollection(name: CollectionName): Collection {
  if (!bucket) throw new Error('Couchbase is not connected. Call connectCouchbase() first.');
  return bucket.scope(SCOPE).collection(name);
}
