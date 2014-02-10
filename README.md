mnpm
====

mirrored npm

## why

90% of npm is `npm install` (made up that stat).

Npm is having scaling issues. I love npm, and I wanted to see if the idea of linux package mirroring could be applied to making `npm install` more scalable and reliable.

Plus, in a mirroring scenario, it's easier for contributors to donate bandwidth to make the system faster and more redundant.

## how

Make the npm client smarter. This is the prototype client named `mnpm` that when run does one thing: looks at your package.json file and installs the dependencies.

## api

In order to run the client, the mirrors need to provide directory listings. This could be unified by hosting a registry api endpoint, but I wanted to try and do everything from a mirror.

### get module versions

We only host modules at a specific version on the mirror, but we still need to accomodate modules that have fuzzy dependencies e.g. 'express@latest'.

The mnpm client resolves these semver expressions locally. It does so by gathering a list of ALL versions for a module. The client can then decide which version of a module it should fetch.

### get tarball

The mnpm client's main purpose is to pull tarballs from the mirror and unpackage them to the correct place in the filesystem. Right now,
tarballs are unverified for legitamacy. Ideally, we would host a centralized (trusted) checksum mirror that the client can use to
verify that the tarball received from a mirror has not been altered.

## usage

From that api (get versions, get tarball) we can implement `npm install`.

Here's some pseudocode. From the root node, install each of the dependencies at the version most appropriate to what package.json specifies, then repeate for each newly installed dependency.

```javascript
function install(package) {
  package.dependencies.forEach(function(dependency) {
    var versions = api.versions(dependency)
    var version = resolve(dependency, versions)
    var tarball = api.tarball(dependency, version)
    unpack(tarball)
    if (unpacked.hasPackage) {
      install(unpacked.package)
    }
  })
}
```
