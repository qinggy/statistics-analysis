$(function () {

  let meterDataList = [];
  esdpec.framework.core.getJsonResult('common/gettree', function (response) {
    if (response.IsSuccess) {
      meterDataList = _.map(response.Content, a => {
        a.icon = esdpec.framework.core.Config.AssertSite + a.icon;
        return a;
      });
      $('#metertree').jstree({
        "core": {
          "multiple": false,
          "themes": {
            "responsive": false
          },
          // so that create works
          "check_callback": true,
          'data': meterDataList
        },
        "types": {
          "default": {
            "icon": "fa fa-folder icon-state-warning icon-lg"
          },
          "file": {
            "icon": "fa fa-file icon-state-warning icon-lg"
          }
        },
        "plugins": ["types", "search", "crrm"]
      }).on('loaded.jstree', function (e, data) {
        let instance = data.instance;
        let target = instance.get_node(e.target.firstChild.firstChild.lastChild);
        instance.open_node(target);
      });

      let searchTimeout = false;
      $('#searchbox').keyup(function () {
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
        searchTimeout = setTimeout(function () {
          let keyword = $('#searchbox').val();
          $('#metertree').jstree(true).search(keyword);
        }, 100);
      });

      console.log($('.tree-container').height());
      setTimeout(() => console.log($('.tree-container').height()), 300);
    }
  });

  $('#onShowMeterInfo').on('click', function (e) {
    e.stopPropagation();
    $('.meter-info-container').toggleClass('close');
    if ($('.meter-info-container').hasClass('close')) {
      $('.meter-info-container').hide(300);
      $('#onShowMeterInfo>span:first-of-type').html('展开表计详情<i class="icon iconfont icon-xiaotuziCduan_"></i>');
    } else {
      $('.meter-info-container').show(300);
      $('#onShowMeterInfo>span:first-of-type').html('收起表计详情<i class="icon iconfont icon-xiaotuziCduan_1"></i>');
    }
  });

  $('.btn-grp .btn').on('click', function (e) {
    e.stopPropagation();
    const currentDom = e.currentTarget;
    $('.btn-grp .btn').removeClass('date-active');
    $(currentDom).addClass('date-active');
    //TODO
    switch ($(currentDom).attr('data-value')) {
      case 'd':
        $('#day').removeClass('hidden');
        $('#month').addClass('hidden');
        $('#year').addClass('hidden');
        break;
      case 'm':
        $('#day').addClass('hidden');
        $('#month').removeClass('hidden');
        $('#year').addClass('hidden');
        break;
      case 'y':
        $('#day').addClass('hidden');
        $('#month').addClass('hidden');
        $('#year').removeClass('hidden');
        break;
    }
  });

  $('.operate-grp i.icon').on('click', function (e) {
    e.stopPropagation();
    const currentDom = e.currentTarget;
    $('.operate-grp i.icon').removeClass('btn-active');
    $(currentDom).addClass('btn-active');
    console.log($(currentDom).attr('data-value'));
    //TODO

  });

  layui.use('laydate', function () {
    let laydate = layui.laydate;
    laydate.render({
      elem: '#daycontainer',
      range: '--',
      format: 'yyyy-MM-dd',
      type: 'date',
      value: new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'),
      done: (value, date) => {
        $('#datevalue').val(value);
      }
    });
    laydate.render({
      elem: '#monthcontainer',
      range: '--',
      format: 'yyyy-MM',
      type: 'month',
      value: new Date().format('yyyy-MM') + ' -- ' + new Date().format('yyyy-MM'),
      done: (value, date) => {
        $('#datevalue').val(value);
      }
    });
    laydate.render({
      elem: '#yearcontainer',
      range: '--',
      format: 'yyyy',
      type: 'year',
      value: new Date().format('yyyy') + ' -- ' + new Date().format('yyyy'),
      done: (value, date) => {
        $('#datevalue').val(value);
      }
    });
  });

});