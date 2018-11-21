$(function(){
    $('.tab__nav li').on('click',function(){
        $(this).attr("class","tab_active").siblings().removeClass("tab_active");
    })
   /* $('.operate-grp i.icon').mouseover(function (e) {
        e.stopPropagation();
        const currentDom = e.currentTarget;
        let flag = $(currentDom).attr('data-value');
        switch(flag){

        }
    }) */
})