import { chunk } from 'lodash'

export type ChunkRunInput<T, R> = {
  inputs: T[]
  size: number
  run: (input: T) => Promise<R>
  afterChunk?: (
    results: PromiseSettledResult<Awaited<R>>[],
  ) => void | Promise<void>
}

export async function chunkRun<T = void, R = void>({
  inputs,
  size,
  run,
  afterChunk,
}: ChunkRunInput<T, R>): Promise<PromiseSettledResult<R>[]> {
  const chunkedInputsList = chunk(inputs, size)

  const allResults: PromiseSettledResult<Awaited<ReturnType<typeof run>>>[] =
    []

  for await (const chunkedInputs of chunkedInputsList) {
    const results = await Promise.allSettled(chunkedInputs.map(run))

    if (afterChunk) {
      await afterChunk(results)
    }

    allResults.push(...results)
  }

  return allResults
}