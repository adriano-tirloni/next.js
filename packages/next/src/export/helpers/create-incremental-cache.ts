import path from 'path'
import fs from 'fs'
import { IncrementalCache } from '../../server/lib/incremental-cache'
import { hasNextSupport } from '../../telemetry/ci-info'

export function createIncrementalCache(
  incrementalCacheHandlerPath: string | undefined,
  isrMemoryCacheSize: number | undefined,
  fetchCacheKeyPrefix: string | undefined,
  distDir: string,
  experimental: { ppr: boolean }
) {
  // Custom cache handler overrides.
  let CacheHandler: any
  if (incrementalCacheHandlerPath) {
    CacheHandler = require(incrementalCacheHandlerPath)
    CacheHandler = CacheHandler.default || CacheHandler
  }

  const incrementalCache = new IncrementalCache({
    dev: false,
    requestHeaders: {},
    flushToDisk: true,
    fetchCache: true,
    maxMemoryCacheSize: isrMemoryCacheSize,
    fetchCacheKeyPrefix,
    getPrerenderManifest: () => ({
      version: 4,
      routes: {},
      dynamicRoutes: {},
      preview: {
        previewModeEncryptionKey: '',
        previewModeId: '',
        previewModeSigningKey: '',
      },
      notFoundRoutes: [],
    }),
    fs: {
      readFile: fs.promises.readFile,
      readFileSync: fs.readFileSync,
      writeFile: (f, d) => fs.promises.writeFile(f, d),
      mkdir: (dir) => fs.promises.mkdir(dir, { recursive: true }),
      stat: (f) => fs.promises.stat(f),
    },
    serverDistDir: path.join(distDir, 'server'),
    CurCacheHandler: CacheHandler,
    minimalMode: hasNextSupport,
    experimental,
  })

  ;(globalThis as any).__incrementalCache = incrementalCache

  return incrementalCache
}
