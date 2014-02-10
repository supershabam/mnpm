var fs = require('fs')
var knox = require('knox')
var path = require('path')
var RSVP = require('rsvp')
var semver = require('semver')
var tar = require('tar')
var zlib = require('zlib')

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

function install(file) {
  return read(file).then(function(pkg) {
    return Promise.all(dependencies(pkg).map(function(dependency) {
      return version(dependency.module, dependency.range).then(function(version) {
        if (version === null) {
          throw new Error('unable to satisfy dependency: ' + dependency.module + '@' + dependency.range)
        }
        return version
      })
    }))
  })
}

function read(file) {
  return new Promise(function(resolve, reject) {
    fs.readFile(file, function(err, data) {
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
}

function dependencies(pkg) {
  return Object.keys(pkg.dependencies || {}).map(function(module) {
    return {module: module, range: pkg.dependencies[module]}
  })
}

function version(module, range) {
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

function extract(module, version, dest) {
  return new Promise(function(resolve, reject) {
    s3.get(module + '/' + module + '-v' + version + '.tgz').on('response', function(res) {
      if (res.statusCode !== 200) {
        return reject(new Error('bad status code while getting tarball: ' + res.statusCode))
      }
      res
        .pipe(zlib.createGunzip())
        .pipe(tar.Extract({path: dest}))
        .on('error', reject)
        .on('end', resolve)
    }).end()
  })
}

install(path.resolve('./package.json')).then(console.log, console.error)

