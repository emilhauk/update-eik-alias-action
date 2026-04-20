import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process'
import core from '@actions/core'
import assert from 'assert'

// https://ihateregex.io/expr/semver/
const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

function getEikConfig() {
  if (fs.existsSync('./eik.json')) {
    return JSON.parse(fs.readFileSync('./eik.json', {encoding: 'utf-8'}))
  }
  const pkg = JSON.parse(fs.readFileSync('./package.json', {encoding: 'utf-8'}))
  return {
    name: pkg.name,
    version: pkg.version,
    ...(pkg.eik || {}),
  }
}

try {
  const eikConfig = getEikConfig();

  const version = core.getInput('version') || eikConfig.version
  assert(SEMVER_REGEX.test(version), `Expecting version to be a semver (https://semver.org/), was (${version})`)

  const alias = core.getInput('alias') || version.split('.')[0]
  assert(/^\d+$/.test(alias), `Expecting alias be a number`)

  const eikServerKey = core.getInput('eik-server-key')
  core.setSecret(eikServerKey)

  assert(eikConfig.server, 'Found no asset server in config')

  core.info(`Updating alias (${alias}) to version (${version})`)
  const login = execSync(`npx @eik/cli login --server ${eikConfig.server} --key ${eikServerKey}`)
  if (login && login.stdout) {
    core.info(login.stdout.toString())
  }

  const eikrcPath = path.join(os.homedir(), '.eikrc')
  const eikrc = JSON.parse(fs.readFileSync(eikrcPath, {encoding: 'utf-8'}))
  const token = new Map(eikrc.tokens).get(eikConfig.server)
  assert(token, `No token found in ${eikrcPath} for server ${eikConfig.server}`)
  core.setSecret(token)

  const type = eikConfig.type || 'package'
  const updateAlias = execSync(`npx @eik/cli alias ${eikConfig.name} ${version} ${alias} --server ${eikConfig.server} --token ${token} --type ${type}`)
  if (updateAlias && updateAlias.stdout) {
    core.info(updateAlias.stdout.toString())
  }
} catch (error) {
  if (error && error.stdout) {
    core.info(error.stdout.toString())
  }
  core.setFailed(error)
}
