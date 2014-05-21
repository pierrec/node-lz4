beforeEach(function () {
    this.addMatchers({
        toEqualBuffer: function (expected) {
          return Buffer.compare(this.actual, expected)
        }
    });
});