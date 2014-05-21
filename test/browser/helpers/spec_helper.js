beforeEach(function () {
    this.addMatchers({
        toEqualBuffer: function (expected) {
          if (this.actual.length !== expected.length) return false

          for (var i = 0, n = this.actual.length; i < n; i++) {
            if (this.actual[i] !== expected[i]) return false
          }

          return true
        }
    });
});