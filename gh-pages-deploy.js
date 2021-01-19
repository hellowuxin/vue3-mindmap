/* eslint-disable @typescript-eslint/no-var-requires */
const execa = require('execa')
const fs = require('fs')
;(async () => {
  try {
    await execa('git', ['checkout', '--orphan', 'gh-pages'])
    console.log('Building started...')
    await execa('npm', ['run', 'build'])
    // Understand if it's dist or build folder
    const folderName = fs.existsSync('dist') ? 'dist' : 'build'
    await execa('git', ['--work-tree', folderName, 'add', '--all'])
    await execa('git', ['--work-tree', folderName, 'commit', '-m', 'gh-pages'])
    console.log('Pushing to gh-pages...')
    await execa('git', ['push', 'origin', 'HEAD:gh-pages', '--force'])
    await execa('rm', ['-r', folderName])
    await execa('git', ['checkout', '-f', 'main'])
    await execa('git', ['branch', '-D', 'gh-pages'])
    console.log('Successfully deployed, check your settings')
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
})()
