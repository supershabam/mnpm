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
  var hash = pkg.dependencies || {}
  var unresolved = Object.keys(hash).forEach(function(module) {
    return [module, hash[module]]
  })

}

function resolve(module, range) {
  return versions(module).then(function(versions) {
    return semver.maxSatisfying(versions, range)
  })
}

function versions(module) {
  return new Promise(function(resolve, reject) {
    s3.list({prefix: module + '/'}, function(err, response) {
      if (err) {
        return reject(err)
      }
      var exp = /-v(.+\..+\..+)\.tgz/
      var versions = 
        response.Contents.map(function(content) {
          return exp.exec(content.Key)
        }).filter(function(match) {
          return !!match
        }).map(function(match) {
          return match[1]
        })
      resolve(versions)
    })
  })
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

resolve('mnpm', '0.x').then(function(version) {
  console.log(version)
})
