var fs = require('fs')
var St = require('./lib/stream')

var data = fs.readFileSync('README.md')
var st = new St({ hc: true })
st.push( data )
var buf = st.flush()

fs.writeFileSync('res', buf)

