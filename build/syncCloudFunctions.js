import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join, resolve, sep } from 'node:path'

export function syncCloudFunctions({ projectRoot, outputDirectory }) {
  const sourceDirectory = join(projectRoot, 'cloudfunctions')
  const targetDirectory = join(outputDirectory, 'cloudfunctions')
  const projectConfigPath = join(outputDirectory, 'project.config.json')

  if (!existsSync(sourceDirectory) || !existsSync(projectConfigPath)) return

  rmSync(targetDirectory, { recursive: true, force: true })
  cpSync(sourceDirectory, targetDirectory, {
    recursive: true,
    filter(source) {
      return !source.split(sep).includes('node_modules') && basename(source) !== '.DS_Store'
    },
  })

  const projectConfig = JSON.parse(readFileSync(projectConfigPath, 'utf8'))
  projectConfig.cloudfunctionRoot = 'cloudfunctions/'
  writeFileSync(projectConfigPath, `${JSON.stringify(projectConfig, null, 2)}\n`)
}

export function createCloudFunctionsSyncPlugin({ projectRoot = process.cwd() } = {}) {
  let outputDirectory = ''

  return {
    name: 'sync-weixin-cloud-functions',
    configResolved(config) {
      outputDirectory = resolve(projectRoot, config.build.outDir)
    },
    writeBundle() {
      syncCloudFunctions({ projectRoot, outputDirectory })
    },
  }
}
