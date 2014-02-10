var fs = require('fs')
var knox = require('knox')
var RSVP = require('rsvp')
var semver = require('semver')

// mnpm user credentials (only has access to list/read mnpm bucket)
// ideally, use http endpoint, but s3 is too easy to set up and doing dir listings
// isn't standardized on http
var s3 = knox.createClient({
  key: 'AKIAID6QZA2RO7R234QQ',
  secret: '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',
  bucket: 'mnpm',
  region: 'us-west-2'
})

var Promise = RSVP.Promise

function install(pkg) {
  pkg.then(function(pkg) {
    console.log(pkg)
  })
}

function dependencies(pkg) {
  return pkg.dependencies || []
}

function versions(module) {
}

rootPkg = new Promise(function(resolve, reject) {
  fs.readFile('package.json', function(err, data) {
    if (err) {
      return reject(err)
    }
    try {
      resolve(JSON.parse(data))
    } catch (err) {
      reject(err)
    }
  })
})

install(rootPkg)
s3.list(function(err, data) {
  data.Contents.forEach(function(content) {
    console.log(content)
  })
})
