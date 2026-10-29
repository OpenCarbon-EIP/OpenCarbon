const MODELS = [
  'application',
  'company',
  'mission',
  'client',
  'worksite',
  'assessment',
  'document',
  'extraction',
  'emission_category',
  'emission_factor',
  'activity_line',
  'reduction_action',
] as const;

const MODEL_METHODS = [
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findMany',
  'create',
  'update',
  'updateMany',
  'delete',
  'count',
] as const;

type ModelMock = Record<(typeof MODEL_METHODS)[number], jest.Mock>;

export type PrismaMock = Record<(typeof MODELS)[number], ModelMock> & {
  $transaction: jest.Mock;
};

// Interactive transactions run their callback against the same mock, so tx calls can be asserted.
export const createPrismaMock = (): PrismaMock => {
  const mock = {} as PrismaMock;

  for (const model of MODELS) {
    mock[model] = Object.fromEntries(
      MODEL_METHODS.map((method) => [method, jest.fn()]),
    ) as ModelMock;
  }

  mock.$transaction = jest.fn((callback: (tx: PrismaMock) => unknown) =>
    callback(mock),
  );

  return mock;
};
