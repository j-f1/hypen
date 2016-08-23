(function () {
  function _getWords(text, minLength) {
    if (text.length < minLength && !(text.toLowerCase() === 'a' || text.toLowerCase() === 'i')) {
      return Promise.resolve([]);
    }
    // -> Promise ([word matching `text`, ...])
    // regex from http://stackoverflow.com/a/3561711/5244995
    return findWords('^' + text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$').then(function(words) {
      return _getWords(text.slice(0, -1), minLength).then(function(moreWords) {
        return words.concat(moreWords);
      }, function(err) {
        console.error(err);
      });
    }, function(err) {
      console.error(err);
    });
  }
  function _getTree(text, minLength) {
    // -> Promise ({
    //   `word`: {
    //       `nextWord`: {
    //          ...
    //            `lastWord`: {}
    //          ...
    //      }
    //    }
    // })
    return _getWords(text, minLength).then(function(words) {
      var proms = [];
      if (text.length && !words.length) {
        return null; // ERR! No match.
      }
      words.forEach(function(word) {
        proms.push(Promise.all([
          word,
          _getTree(text.slice(word.length), minLength)
        ]));
      });
      return Promise.all(proms);
    }).then(function(trees) {
      if (trees === null) {
        return null;
      }
      var tree = {};
      trees.forEach(function(arr) {
        var word = arr[0], subtree = arr[1];
        tree[word] = subtree;
      });
      return tree;
    }).catch(function(err) {
      console.error(err);
    });
  }
  function _toArray(tree) {
    var arr = [];
    if (!tree) {
      return [];
    }
    if (!Object.keys(tree).length) {
      return [[]];
    }
    Object.keys(tree).forEach(function(word) {
      _toArray(tree[word]).forEach(function(item) {
        arr.push([word].concat(item));
      });
    });
    return arr;
  }
  window.match = function match(text, minLength) {
    return _getTree(text, minLength).then(_toArray);
  };
})();
