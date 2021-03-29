/* 

Search
    - paste to textarea, split word, find links, update results, copy feature
Update
    - paste to textarea, make links object, merge it to cache and localstorage
*/

var KEY = 'wikiLinks';

var cache = null;
var UNSAVED = {};
var MODE = 'search';

function unregisteredLinks(text) {
  cache = cache || getLinks();
  var lines = text
    .trim()
    .split(/\n/gi)
    .filter((k) => k);
  var toS = {};
  for (var i = 0; i < lines.length - 1; i += 2) {
    var up = lines[i].toUpperCase();

    if (!(up in cache)) {
      toS[up] = lines[i + 1];
    }
  }
  UNSAVED = Object.assign({}, toS);
  console.log('updae', Object.assign({}, toS));
  return toS;
}

function createLinkElement(word, link) {
  var div = document.createElement('li');
  div.className = 'list-group-item';
  div.innerHTML =
    '\
    <div class="link-card">\
      <div class="left">\
        <div class="word">xxx</div>\
        <div class="link">\
          <a href="https://www.youtube.com/watch?v=9AYl10qxc0M"\
            >sdfdsfdf</a\
          >\
        </div>\
      </div>\
      <div>\
        <button class="btn btn-primary btn-sm copy-btn">\
          Copy\
        </button>\
      </div>\
    </div>';
  div.querySelector('.word').textContent = word;
  div.querySelector('.link > a').href = link;
  div.querySelector('.link > a').textContent = link;
  return div;
}

function getLinks() {
  if (!cache) {
    var fromStore = localStorage.getItem(KEY) || '{}';
    cache = JSON.parse(fromStore);
  }

  return cache;
}

function mergeLinks(linksObject) {
  var updated = Object.assign({}, cache, linksObject);
  cache = updated;
  localStorage.setItem(KEY, JSON.stringify(updated));
}

function getMatchingLinks(paragraph) {
  cache = cache || getLinks();

  var replaced = paragraph.replaceAll(/[^a-zA-Z0-9]/gi, '').toUpperCase();

  return Object.entries(cache)
    .filter(([word, link]) => {
      if (
        replaced.indexOf(
          word.replaceAll(/[^a-zA-Z0-9]/gi, '').toUpperCase()
        ) !== -1
      ) {
        return true;
      }
    })
    .map(([word, link]) => ({ word: word, link: cache[word] }))
    .reduce(function (acc, i) {
      var re = Object.assign({}, acc);
      re[i.word] = i.link;
      return re;
    }, {});
}

function updateSearchResultsDOM(linksObj) {
  var listGroupElement = document.getElementById('link-list');
  listGroupElement.innerHTML = '';

  Object.entries(linksObj).forEach(function (entry) {
    var li = createLinkElement(entry[0], entry[1]);
    listGroupElement.appendChild(li);
  });
}

function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(
    function () {
      console.log('Async: Copying to clipboard was successful!');
    },
    function (err) {
      console.error('Async: Could not copy text: ', err);
    }
  );
}

var textArea = document.getElementById('post-content');
var saveLinksBtn = document.getElementById('save-links-btn');

var radios = Array.from(document.getElementsByName('mode')).forEach(function (
  e
) {
  e.addEventListener('change', function (x) {
    MODE = x.target.value;
    if (MODE === 'update') {
      saveLinksBtn.style.visibility = 'visible';
    } else {
      saveLinksBtn.style.visibility = 'hidden';
    }
    textArea.value = '';
  });
});

function doThatThing(content) {
  var linksObj = {};
  if (MODE === 'search') {
    linksObj = getMatchingLinks(content);
    console.log(content, linksObj);
  } else {
    linksObj = unregisteredLinks(content);
  }
  updateSearchResultsDOM(linksObj);
}

textArea.onpaste = function (e) {
  clipboardData = e.clipboardData || window.clipboardData;
  pastedData = clipboardData.getData('Text');
  doThatThing(pastedData);
};

textArea.onkeydown = function (e) {
  doThatThing(e.target.value);
};

document.addEventListener('click', function (e) {
  const isButton = event.target.nodeName === 'BUTTON';
  if (!isButton) {
    return;
  }
  console.log(e.target.tagName);
  var isCopyBtn = e.target.classList.contains('copy-btn');
  e.stopPropagation();
  e.preventDefault();

  if (isCopyBtn) {
    var link = e.target.closest('.link-card').querySelector('.link > a');
    if (link) {
      copyTextToClipboard(link.textContent);
      console.log('COPOEED');
    }
  }
});

saveLinksBtn.addEventListener('click', function (e) {
  console.log('sdf', UNSAVED);
  mergeLinks(UNSAVED);
});
