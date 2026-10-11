
// 手机端 过滤栏 宽度设置:  cate + tag 固定宽度. filename 剩下宽度.
$(function (){
  // 先判断屏幕宽度 如果 < 1024 (breakpoint único, igual ao Sass max-width: 1023.98px) 那就假设设备是手机 那么!!!  文件栏目的宽度 就是 手机宽度 - cata宽度 - tag宽度 - 三个padding宽度.
  if ( $(window).width() < 1024 ) {
      var screenWidth   = parseFloat($(window).width() );                           
      var CateWidth     = parseFloat($("#cateDiv").css("flex-basis"));
      var TagWidth      = parseFloat($("#tagDiv").css("flex-basis"));
      var FilenameWidth = parseFloat($("#filenameDiv").css("flex-basis"));
      // 原来是200px   加了 parseFloat  就是 200
      var tagMobileWith = screenWidth/2 - CateWidth -12 ;     
      var filenameMobileWith = screenWidth/2 ;
      // alert("手机宽度="+ screenWidth +"大类宽度="+ CateWidth +"标签宽度="+ TagWidth +"原文件宽度="+ FilenameWidth +"后文件宽度="+ filenameMobileWith  );
      // Ex.: em 390px, tag = 390/2 - 88 - 12 = 95px e posts = 195px.
      $("#tagDiv").css("flex-basis", tagMobileWith+"px" );        
      $("#filenameDiv").css("flex-basis", filenameMobileWith+"px" );  
      // alert(  $("#filenameDiv").css("flex-basis")  );
      // 再测试一下看看到底有没有改变
    }
});




// 手机端 滚动条高度设置
// cate&tag 屏幕高度-30. fileneme:屏幕高度-30-顶部栏高度.



