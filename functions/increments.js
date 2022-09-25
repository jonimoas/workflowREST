module.exports.decrease = function (x) {
  return { result: true, data: x - 1 };
};

module.exports.increase = function (x) {
    return { result: true, data: x + 1 };
};
