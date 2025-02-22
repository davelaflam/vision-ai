#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('child_process')
const path = require('path')

// Resolve the Vite CLI JS file explicitly using path.join.
const viteCli = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js')
console.log('Using Vite CLI at:', viteCli)

// Spawn Node with an extra flag to help with ESM resolution.
// (Node v20 supports ESM by default, but adding --experimental-specifier-resolution=node
// can sometimes help when running an ES module from a CommonJS wrapper.)
const child = spawn('node', ['--experimental-specifier-resolution=node', viteCli, 'preview', '--port', '5174'], {
  stdio: 'inherit',
})

child.on('close', (code) => {
  process.exit(code)
})
