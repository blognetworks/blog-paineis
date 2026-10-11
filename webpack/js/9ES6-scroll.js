

// 滚动条高度.  有高度才能有滚动条.
// Altura de cada lista = janela − --topbar-height − cabeçalho real do painel (medido, não fixo).
function scrollbarHeight(){
  var root = document.documentElement;
  var winH = root.clientHeight;

  // --topbar-height é px no desktop; se vier como calc() (mobile), usa a altura real da barra.
  var topbarH = parseFloat(getComputedStyle(root).getPropertyValue('--topbar-height'));
  if (isNaN(topbarH)) {
    var topbar = document.getElementById('topbarDiv');
    topbarH = topbar ? topbar.getBoundingClientRect().height : 0;
  }

  function panelHeaderHeight(panelId){
    var header = document.querySelector('#' + panelId + ' > .panel-header');
    return header ? header.getBoundingClientRect().height : 0;
  }

  function setListHeight(listId, panelId){
    var h = winH - topbarH - panelHeaderHeight(panelId);
    $('#' + listId).css('height', Math.max(h, 0));
  }

  setListHeight('filenameUL', 'filenameDiv');
  setListHeight('catenameUL', 'cateDiv');
  setListHeight('tagnameUL', 'tagDiv');
}


// 网页加载后 浏览器窗口大小改变时候的 滚动条 高度设置 
$(function (){  scrollbarHeight()  });

// 浏览器窗口大小改变时候 再次改变滚动条高度
window.onresize= function(){ scrollbarHeight()  };






// 下面是 es6 功能测试.
	var arrow = x => x*x;
	console.log("ES6 箭头函数测试 "+arrow);              // 这个 直接显示 函数... 
	console.log(arrow(2));           // 输出  4
	console.log(arrow(3));           // 输出  9




