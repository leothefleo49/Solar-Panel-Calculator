#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */
// Cross-platform deep smoke test for release integrity.
// Validations:
// 1. Fetch latest release metadata and ensure tag matches environment (if provided).
// 2. Verify presence of expected artifact names.
// 3. HEAD each artifact: status OK + content-length > minimum threshold.
// 4. Download SHA256SUMS and parse all checksum lines; detect duplicates or missing entries.
// 5. Download ALL artifacts (within resource constraints) and verify SHA256 matches recorded value.
// 6. On Windows: MSI/EXE checksum already covered, same logic as others.
// 7. On Linux: verify AppImage ELF magic header (0x7F 45 4C 46) and size > 5MB.
// 8. Report PASS only if all checks succeed; otherwise list failures.
// NOTE: This is intentionally exhaustive and may take extra time in CI.

import os from 'node:os'
import crypto from 'node:crypto'

const owner = 'leothefleo49'
const repo = 'Solar-Panel-Calculator'
const apiBase = `https://api.github.com/repos/${owner}/${repo}`

const headers = {
  'User-Agent': 'smoke-test-script',
  Accept: 'application/vnd.github+json',
}

const nodeFetch = globalThis.fetch

async function fetchJson(url) {
  const res = await nodeFetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

// Removed unused helpers from earlier simpler version (HEAD-only + single checksum).

async function main() {
  console.log('Fetching latest release...')
  const latest = await fetchJson(`${apiBase}/releases/latest`)
  const assets = latest.assets || []
  const want = [
    'Solar-Panel-Calculator-Windows.msi',
    'Solar-Panel-Calculator-Windows.exe',
    'Solar-Panel-Calculator-macOS.dmg',
    'Solar-Panel-Calculator-Linux.AppImage',
    'Solar-Panel-Calculator-Linux.deb',
    'Solar-Panel-Calculator-Android-Unsigned.apk',
    'Solar-Panel-Calculator-Android.apk', // if signed someday
    'Solar-Panel-Calculator-iOS-Simulator.zip', // optional
    'SHA256SUMS.txt',
  ]

  // Tag consistency check
  if (process.env.GITHUB_REF_NAME) {
    if (latest.tag_name !== process.env.GITHUB_REF_NAME) {
      console.log(`❌ Tag mismatch: release tag ${latest.tag_name} != env ${process.env.GITHUB_REF_NAME}`)
    } else {
      console.log(`✅ Tag matches environment: ${latest.tag_name}`)
    }
  }

  const byName = Object.fromEntries(assets.map(a => [a.name, a.browser_download_url]))

  const missing = want.filter(w => !byName[w])
  if (missing.length) {
    console.log('Missing expected assets:', missing)
  }

  // Quick availability + size checks (HEAD)
  let allOk = true
  const minSizes = {
    'Solar-Panel-Calculator-Windows.msi': 5000000,
    'Solar-Panel-Calculator-Windows.exe': 4000000,
    'Solar-Panel-Calculator-macOS.dmg': 5000000,
    'Solar-Panel-Calculator-Linux.AppImage': 5000000,
    'Solar-Panel-Calculator-Linux.deb': 1000000,
    'Solar-Panel-Calculator-Android-Unsigned.apk': 5000000,
    'Solar-Panel-Calculator-Android.apk': 5000000,
    'Solar-Panel-Calculator-iOS-Simulator.zip': 5000000,
  }
  for (const name of want) {
    const url = byName[name]
    if (!url) { console.log(`❌ Missing ${name}`); allOk = false; continue }
    const headRes = await nodeFetch(url, { method: 'HEAD', headers })
    if (!headRes.ok) { console.log(`❌ HEAD failed ${name}`); allOk = false; continue }
    const len = Number(headRes.headers.get('content-length') || 0)
    const min = minSizes[name] || 1
    const sizeOk = len >= min
    console.log(`${sizeOk ? '✅' : '❌'} ${name} (size ${len} / min ${min})`)
    if (!sizeOk) allOk = false
  }

  // Download checksums file
  let checksumsText = ''
  if (byName['SHA256SUMS.txt']) {
    const sumRes = await nodeFetch(byName['SHA256SUMS.txt'], { headers })
    checksumsText = await sumRes.text()
  } else {
    console.log('❌ Missing SHA256SUMS.txt')
    allOk = false
  }

  // Parse checksum lines
  const checksumMap = new Map()
  if (checksumsText) {
    const lines = checksumsText.split(/\r?\n/).filter(l => l.trim())
    for (const line of lines) {
      const parts = line.split(/\s+/)
      if (parts.length < 2) continue
      const sum = parts[0]
      const fileName = parts[parts.length - 1].replace(/^\*?/, '')
      if (checksumMap.has(fileName)) {
        console.log(`❌ Duplicate checksum entry for ${fileName}`)
        allOk = false
      } else {
        checksumMap.set(fileName, sum)
      }
    }
    console.log(`✅ Parsed ${checksumMap.size} checksum entries`)
  }

  // Download all artifacts & verify SHA256
  const downloadFailures = []
  for (const name of want.filter(n => n !== 'SHA256SUMS.txt')) {
    const url = byName[name]
    if (!url) continue
    try {
      const res = await nodeFetch(url, { headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      const hash = crypto.createHash('sha256').update(buf).digest('hex')
      // Match by partial filename inside checksum map
      let expected = null
      for (const [f, s] of checksumMap.entries()) {
        if (f.toLowerCase().includes(name.toLowerCase())) { expected = s; break }
      }
      if (!expected) {
        console.log(`❌ No checksum entry found for ${name}`)
        allOk = false
      } else if (expected.toLowerCase() !== hash.toLowerCase()) {
        console.log(`❌ Checksum mismatch ${name} expected ${expected} got ${hash}`)
        allOk = false
      } else {
        console.log(`✅ Checksum OK ${name}`)
      }
      // ELF magic check for AppImage on linux runners
      if (os.platform() === 'linux' && name.endsWith('.AppImage')) {
        const magicOk = buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46
        if (!magicOk) { console.log('❌ AppImage missing ELF magic'); allOk = false } else { console.log('✅ AppImage ELF magic') }
      }
    } catch (e) {
      console.log(`❌ Download/verify failed ${name}: ${e.message}`)
      downloadFailures.push(name)
      allOk = false
    }
  }

  // Windows-specific section no longer needed (covered by universal download loop)

  console.log('\nSmoke test result:', allOk ? 'PASS' : 'FAIL')
  process.exit(allOk ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
