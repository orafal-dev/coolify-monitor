export type CoolifyEnvironmentRef = {
  id: number;
  name: string;
  uuid: string;
};

export type EnvironmentIndexEntry = {
  projectUuid: string;
  projectName: string;
  environmentUuid: string;
  environmentName: string;
};

export type EnvironmentIndex = Map<number, EnvironmentIndexEntry>;

export type NestedCoolifyEnvironment = {
  uuid?: string | null;
  name?: string | null;
  project?: {
    uuid?: string | null;
    name?: string | null;
  } | null;
};
