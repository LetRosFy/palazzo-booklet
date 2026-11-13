/* Локальная замена прямой загрузки в Vercel Blob */
window.PDABlob = { upload: function (pathname, file, opts) {
  return new Promise(function (ok, bad) {
    var x = new XMLHttpRequest(); x.open('POST', '/dev-upload?pathname=' + encodeURIComponent(pathname));
    x.upload.onprogress = function (e) { if (opts && opts.onUploadProgress) opts.onUploadProgress({ loaded: e.loaded, total: e.total, percentage: e.total ? e.loaded / e.total * 100 : 0 }); };
    x.onload = function () { x.status === 200 ? ok(JSON.parse(x.responseText)) : bad(new Error('upload ' + x.status)); };
    x.onerror = function () { bad(new Error('network')); }; x.send(file);
  });
} };
