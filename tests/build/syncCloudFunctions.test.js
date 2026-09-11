import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { syncCloudFunctions } from '../../build/syncCloudFunctions.js'

const tempDirectories = []

afterEach(() => {
  tempDirectories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }))
})

describe('syncCloudFunctions', () => {
  it('把云函数复制到微信产物并写入 cloudfunctionRoot', () => {
    const root = mkdtempSync(join(tmpdir(), 'two-person-menu-'))
    tempDirectories.push(root)
    const source = join(root, 'cloudfunctions', 'two-person-menu-api')
    const output = join(root, 'dist', 'dev', 'mp-weixin')
    mkdirSync(join(source, 'node_modules'), { recursive: true })
    mkdirSync(output, { recursive: true })
    writeFileSync(join(source, 'index.js'), 'exports.main = () => true')
    writeFileSync(join(source, 'node_modules', 'ignored.js'), 'ignore me')
    writeFileSync(join(output, 'project.config.json'), JSON.stringify({ appid: 'wx-test' }))

    syncCloudFunctions({ projectRoot: root, outputDirectory: output })

    expect(readFileSync(join(output, 'cloudfunctions', 'two-person-menu-api', 'index.js'), 'utf8')).toContain(
      'exports.main',
    )
    expect(() => readFileSync(join(output, 'cloudfunctions', 'two-person-menu-api', 'node_modules', 'ignored.js'))).toThrow()
    expect(JSON.parse(readFileSync(join(output, 'project.config.json'), 'utf8'))).toMatchObject({
      appid: 'wx-test',
      cloudfunctionRoot: 'cloudfunctions/',
    })
  })
})
