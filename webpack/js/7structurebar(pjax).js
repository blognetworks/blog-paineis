

// Títulos do artigo que entram no sumário (todos os níveis escopados em #pageContent).
var TOC_HEADINGS = "#pageContent h2, #pageContent h3, #pageContent h4, #pageContent h5, #pageContent h6";

// 显示文章结构侧边栏
function showSideStructure(){
  var MDh1 = $("#pageContent h1").text();
    // 获取 当前文章内的 h1
    //console.log("MDh1= " +MDh1);
  $("#MDh1 li").each( function(){    $(this).remove();         });
    // 首先点击文件名 删除清空所有现有的 li
  var titleNum = $(TOC_HEADINGS).length;
    // console.log(titleNum );
    // 这里 所有的 title数量就出来了. 下面进行循环. 给每个title 一个 index; 
  $(TOC_HEADINGS).each( function(){
    var MDTagContent = $(this).text(); 
    var htmlTagName = $(this).get(0).tagName ;
    var navbarIndex = $(this).index();
      // console.log( MDTagContent,navbarIndex);
      // 这里的 index 虽然不知道问什么 不是连续的 .... 没关系. 只要把这个index 的值 给文章的标签对应的id就可以了....
      //$(this).attr("name",navbarIndex);
    $(this).append("<a name='" + navbarIndex +"'></a>");
      //<a href="url">Link text</a>
      // if ( htmlTagName == "H1" ) { $("#MDh1").append("<li style='text-align: center'>"+ MDTagContent +"</li>");  }
    // Nível pelo nome da tag (H2 → 2 …); o recuo vem do CSS (.toc-level-N), sem &nbsp;.
    var level = htmlTagName.charAt(1);
    var $link = $("<a>").attr("href", "#" + navbarIndex).text(MDTagContent);
    $("#MDh1").append($("<li>").addClass("toc-level-" + level).append($link));
  });
  $("#lineSide").show();
}







// 文章滚动 高亮对应的标题
$("#contentDiv").scroll(   function() { 
  var PositiveDisc = [];
  $(TOC_HEADINGS).each( function(){
      var MDTagContent = $(this).text(); 
      var MDTagIndex = $(this).index(); 
      var titleToTopDisc = $(this).offset().top;
      // console.log( titleToTopDisc, MDTagContent);
      // 这些值 有正负. 取第所有的输出 
        if ( titleToTopDisc >= 0 ) {
          // console.log( titleToTopDisc, MDTagContent,MDTagIndex);
          // 如果 offset是大于零的.  也就是在屏幕中间以及下面的..  取出来放到数组中. 
          // 然后取整个数组第一个值.这个title肯定是在屏幕中的... 把这个标题设置成高亮就可以了.
          PositiveDisc.push(MDTagIndex);
        }
  });
  // console.log( PositiveDisc );
  // console.log( PositiveDisc[0] );
  // 高亮这个标签. 
  var firstPositive = PositiveDisc[0];
  $(".CSMDh1 li").removeClass('active'); 
  $(".CSMDh1 a").removeAttr('aria-current');
  $(".CSMDh1 [href='#"+firstPositive+"']").attr('aria-current', 'location').parent().addClass('active'); 
});





// 网页刷新的时候 也要重新显示目录结构
// 如果是主页就不显示. 如果是其他页就显示目录结构
$(function (){ 
  var WebURL = window.location.pathname;
  if ( WebURL == "/") {}
  else { showSideStructure();  }
});




// PJAX
// a 是点击元素.  + 内容放到哪里: contnetdiv + 放什么内容进去.
// 顶部左右按钮 模拟contentDiv 上方被隐藏掉的左右按钮.
// 为什么必须模拟contentDiv: 上下篇是pre.ur next.url 这个url是会变的. 
// 使用了 pjax. 只有contentDiv里面的内容是变的.topbarDiv的内容是不变的.
// 所以 topbardiv 里面的 上下篇的url链接也是不变的(也就是只能点击一次下一篇.)


// Sem destino (primeiro/último post, home): botão marcado aria-disabled e o clique não faz nada.
function syncTopbarNav(){
  $("#topbarPre" ).attr("aria-disabled", $("#prePost" ).length ? "false" : "true");
  $("#topbarNext").attr("aria-disabled", $("#nextPost").length ? "false" : "true");
}

$(function(){
  syncTopbarNav();
  $("#topbarPre" ).click(function(){  if ($("#prePost" ).length) { $("#prePost" )[0].click(); }  });
  $("#topbarNext").click(function(){  if ($("#nextPost").length) { $("#nextPost")[0].click(); }  });
});

//  $(document).pjax("#prePost", '#contentDiv', { fragment: '#contentDiv', timeout:18000}	);
// 这个的话 只有 prepost 这个id 会使用pjax



$(document).pjax("a", '#contentDiv', { fragment: '#contentDiv', timeout:18000}	);
$(document).on('pjax:start', function() { NProgress.start(); });
$(document).on('pjax:end',   function() { 
	NProgress.done(); 
	showSideStructure();   
	syncTopbarNav();
	});



// $(document).on('pjax:end',   function() { NProgress.done(); pajx_loadDuodsuo(); });
// 多说评论的Pjax重载 每次点击pjax都要执行 .不然要刷新网页才能出现多说....
// hljs.initHighlightingOnLoad();  highlight 高亮.

