KISSY.use('dom', function(S, D){
  var contentEl = S.one('.content-main');
  var html = contentEl.html();
  html = '<section class="empty">' + html;
  html = html.replace(/<h3/gm, '</section><section class="colum"><h3');
  html += '</section>';
  contentEl.html(html);
});
