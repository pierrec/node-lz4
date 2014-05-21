function downloadDataFile(name, type, cb) {
  var loaded = false,
    xhr = new XMLHttpRequest()
  xhr.open('GET', '/base/data/' + name, true)
  xhr.responseType = type

  xhr.onload = function(e) {
    cb(this.response)
    loaded = true
  }

  xhr.send()
  waitsFor(function () {
    return loaded
  })
}