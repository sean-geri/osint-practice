import { connect, type Cluster, type Collection } from 'couchbase';

let cluster: Cluster | undefined;
let collection: Collection | undefined;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env variable: ${name}`);
  return value;
}

export async function connectCouchbase(): Promise<void> {
  cluster = await connect(requireEnv('COUCHBASE_URL'), {
    username: requireEnv('COUCHBASE_USERNAME'),
    password: requireEnv('COUCHBASE_PASSWORD'),
  });
  collection = cluster.bucket(requireEnv('COUCHBASE_BUCKET')).defaultCollection();
}

export function getCollection(): Collection {
  if (!collection) throw new Error('Couchbase is not connected. Call connectCouchbase() first.');
  return collection;
}
