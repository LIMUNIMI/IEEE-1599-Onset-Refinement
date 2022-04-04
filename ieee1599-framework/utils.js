var addEvent = function(object, type, callback) {
      if (object == null || typeof(object) == 'undefined') return;
      if (object.addEventListener) {
        object.addEventListener(type, callback, false);
      } else if (object.attachEvent) {
        object.attachEvent("on" + type, callback);
      } else {
        object["on"+type] = callback;
      }
    };

function loadXMLDoc(filename)
{
  var ajax = new XMLHttpRequest();
  ajax.open("GET", filename, false);
  ajax.send();
  return ajax.responseXML;
}

function loadTextFile(filename)
{
  var ajax = new XMLHttpRequest();
  ajax.open("GET", filename, false);
  ajax.send();
  return ajax.responseText;
}

function readQueryString()
{
  var result = new Array();
  var query = window.location.search.substring(1);
  if (query)
  {
    var strList = query.split("&");
    for (var s in strList)
    {
      var parts = strList[s].split("=");
      result[unescape(parts[0])] = unescape(parts[1]);
    }
  }
  return result;
}

function attributeArray(collection, attribute)
{
  var result = new Array();
  for (var i = 0; i < collection.length; i++)
    result[i] = collection[i].getAttribute(attribute);
  return result;
}

function mouseCoords(e,obj)
{
  function getOffset(obj)
  {
    var result = {x:obj.offsetLeft, y:obj.offsetTop};
    if (obj.offsetParent)
    {
      childOffset = getOffset(obj.offsetParent);
      result.x += childOffset.x;
      result.y += childOffset.y;
    }
    return result;
  }
  
  var coords = {x:0, y:0};
  if (e.pageX || e.pageY)
  { 
    coords.x = e.offsetX;
    coords.y = e.offsetY;
  }
  else
  {
    coords.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
    coords.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
  }
  // var offset = getOffset(obj);
  // coords.x -= offset.x;
  // coords.y -= offset.y;
  return coords;
}

function numericalSort(a,b)
{
  return a - b;
}

String.prototype.startsWith = function(str)
{
  return this.match("^"+str) == str;
};

String.prototype.endsWith = function(str)
{
  return this.match(str+"$") == str;
};

String.prototype.equals = function(str)
{
  if (str == undefined)
    return false;
  return this.match("^"+str+"$") == str;
};

var isIE = window.ActiveXObject ? true : false;

function makePath(filename)
{
  return filename.replace(/\\/g, "/");
}

function splitPath(path)
{
  var dirPart, filePart;
  path.replace(/^(.*\/)?([^/]*)$/, function(_, dir, file) {
    dirPart = dir; filePart = file;
  });
  return { dirPart: dirPart, filePart: filePart };
}

Object.extend = function(destination, source)
{
  for (var property in source)
    if (source.hasOwnProperty(property))
      destination[property] = source[property];
  return destination;
};

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = (function () {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function (obj) {
      if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
};