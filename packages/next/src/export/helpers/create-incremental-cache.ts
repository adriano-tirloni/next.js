import path from 'path'
import fs from 'fs'
import { IncrementalCache } from '../../server/lib/incremental-cache'
import { hasNextSupport } from '../../telemetry/ci-info'

export function createIncrementalCache(
  incrementalCacheHandlerPath: string | undefined,
  isrMemoryCacheSize: number | undefined,
  fetchCacheKeyPrefix: string | undefined,
  distDir: string,
  dir: string
) {
  // Custom cache handler overrides.
  let CacheHandler: any
  if (incrementalCacheHandlerPath) {
    CacheHandler = require(path.isAbsolute(incrementalCacheHandlerPath)
      ? incrementalCacheHandlerPath
      : path.join(dir, incrementalCacheHandlerPath))
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
      mkdir: (d) => fs.promises.mkdir(d, { recursive: true }),
      stat: (f) => fs.promises.stat(f),
    },
    serverDistDir: path.join(distDir, 'server'),
    CurCacheHandler: CacheHandler,
    minimalMode: hasNextSupport,
  })

  ;(globalThis as any).__incrementalCache = incrementalCache

  return incrementalCache
}
