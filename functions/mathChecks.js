module.exports.isOdd = function (x) {
  return { result: x % 2 != 0, data: x };
};

module.exports.isEven = function (x) {
  return { result: x % 2 == 0, data: x };
};
