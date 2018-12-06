$(function () {
  //#region fields 
  let globalCurrentPage = 'analysis';
  let lastclicktime = null;
  let analysisChart = null;
  let areaChart = null;
  let meterDataList = [];
  let searchResult = {};
  let currentSelectedNode = null;
  let currentSelectedNodeBak = null;
  let currentMeterParameters = [];
  let comparsionSelectedMeters = [];
  let areaSubscribeModule = [],
    areaSubscribeModuleClone = [];
  let areaConfigureMeters = [],
    areaConfigureMetersClone = [];
  let areaConfigure = {};
  let now_Sum = 0;
  let tempIndex = null;
  let sortColor = ['#2782e0', '#e8dd23', '#94c629', '#039b46', '#1ebd95', '#1fb6ff', '#5e74f8', '#3949ab', '#7e57c2', '#c753e0', '#f3c325', '#ef6100', '#e82239',
    '#7d4538', '#e89014', '#ec4310', '#ec407a', '#ef5350', '#8d6e63', '#5f96b2', '#778899', '#B0C4DE', '#6495ED', '#4169E1', '#0000FF', '#9370DB', '#9932CC','#756294','#c7aef0','#e5caee'
  ];
  let usageColor = ['#2782e0', '#72a2ac', '#94c629', '#039b46', '#1ebd95','#e8dd23', '#94c629', '#039b46', '#39B0DB', '#00FA9A', '#4B0082', '#3CB371', '#90EE90', '#32CD32', '#008000', '#ADFF2F', '#808000', '	#FFE4C4', '#F5DEB3'];
  let costColor = ['#f3c325', '#e89014', '#ef6100', '#778899', '#B0C4DE', '#6495ED', '#4169E1', '#0000FF', '#9370DB', '#9932CC', '#40E0D0', '#7FFFAA', '#008B8B'];
  //alarm field
  let areaTotalRecord = 0;
  let areaAlarmList = [];
  let meterEventList = [];
  let alarmLevelEnum = {
    0: '超限预警',
    1: '超限报警',
    2: '离线',
    3: '在线',
    4: '全部'
  };
  let alarmTypeEnum = {
    0: '累计值：上限/年',
    1: '累计值：上限/月',
    2: '累计值：上限/日',
    3: '累计值：上限/时',
    4: '累计值：上限',
    5: '累计值：下限',
    6: '瞬时值：上限',
    7: '瞬时值：下限',
    8: '离线',
    9: '在线'
  };
  let alarmTypeValueList = [{
      id: 0,
      val: '上限',
    },
    {
      id: 1,
      val: '上限/时'
    },
    {
      id: 2,
      val: '上限/日'
    },
    {
      id: 3,
      val: '上限/月'
    },
    {
      id: 4,
      val: '上限/年'
    },
    {
      id: 5,
      val: '下限'
    }
  ];
  let weekDayList = [{
      val: 1,
      name: '星期一'
    },
    {
      val: 2,
      name: '星期二'
    },
    {
      val: 3,
      name: '星期三'
    },
    {
      val: 4,
      name: '星期四'
    },
    {
      val: 5,
      name: '星期五'
    },
    {
      val: 6,
      name: '星期六'
    },
    {
      val: 0,
      name: '星期天'
    }
  ];
  let alarmDealStatusEnum = {
    0: '未处理', //刚生成的数据的状态
    1: '已读', // 解除报警后的状态
    2: '屏蔽', //屏蔽报警后的状态
    3: '已关闭' //关闭电闸后的状态
  };
  let alarmDealReasonEnum = {
    // 0: '解除报警', //常规设置报警
    // 1: '解除报警', //设备故障
    // 2: '解除报警', //人为原因
    // 3: '解除报警', //其他原因
    // 4: '屏蔽报警', // 默认就是屏蔽
    // 5: '默认值', //未处理时的状态
    // 6: '关闭电闸'
    0: '常规设置报警', //常规设置报警
    1: '设备故障', //设备故障
    2: '解除报警', //人为原因
    3: '设备离线', //其他原因
    4: '屏蔽', // 默认就是屏蔽，屏蔽报警
    5: '未处理', //未处理时的状态
    6: '关闭电闸'
  };
  let weekDayChn = week => {
    let weekObj = {
      1: '星期一',
      2: '星期二',
      3: '星期三',
      4: '星期四',
      5: '星期五',
      6: '星期六',
      0: '星期天'
    };
    let weekArray = week.split(',');
    let weekStr = '';
    _.each(weekArray, w => {
      if (w === '') return true;
      weekStr += weekObj[w] + '、';
    });
    return weekStr.substring(0, weekStr.length - 1);
  };
  let alarmlay = null;
  let tplTypeList = [];
  let meterFieldTypes = [];
  let historyTime = {
    minTime: '1973-01-01',
    maxTime: '2099-12-31'
  };
  let backSource = '';
  //end alarm field
  //#endregion
  let numberFormat = function (num) {
    let parts = _.toString(num).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };
  let ifShowPieChart = function () {
    let flag = false;
    $('.operate-grp>i.should-uniq.btn-active').each(function (index, dom) {
      flag = $(dom).attr('data-value') === 'pie';
      if (flag) return false;
    });
    return flag;
  };
  let getChartCostLine = function (selector, flag = false) {
    if ($(selector + ' .icon-btn-RMB').hasClass('btn-active')) {
      let costSeries = [];
      if (comparsionSelectedMeters.length > 0) {
        costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap,
          searchResult.chartXaxisData, $(selector + ' .icon-btn-tishi').hasClass('btn-active') ? true : false, flag);
      } else {
        costSeries = getChartSeriesForCost(searchResult.datas, _.map((searchResult.checkedParameters || searchResult.meterAndParaMap), a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, $(selector + ' .icon-btn-tishi').hasClass('btn-active') ? true : false, flag);
      }
      return costSeries;
    }
    return null;
  };
  let getMeterBelongArea = function (meterId) {
    let nodeInfo = _.find(meterDataList, a => a.id === meterId);
    if (!nodeInfo) return '';
    if (nodeInfo.parent === '#') return nodeInfo.text;
    let parent = _.find(meterDataList, a => a.id === nodeInfo.parent);
    return getMeterBelongArea(parent.id) + (nodeInfo.modeltype === 'area' ? " > " + nodeInfo.text : '');
  };
  let getSearchDateType = function () {
    let chooseDom = _.head($('.btn-grp>div.date-active'));
    if (chooseDom) return parseInt($(chooseDom).attr('data-value'));
    return -1;
  };
  let getSearchAreaDateType = function () {
    let chooseDom = _.head($('.area-btn-grp>div.date-active'));
    if (chooseDom) return parseInt($(chooseDom).attr('data-value'));
    return 2;
  };
  let getSelectParameterLen = function () {
    return $('.parameter-right>.para-active').length;
  };
  let getWeek = () => {
    let weekOfday = parseInt(moment().format('E'));
    let last_monday = moment().subtract(weekOfday - 1, 'days').format('YYYY-MM-DD 00:00:00');
    let last_sunday = moment().add(7 - weekOfday, 'days').format('YYYY-MM-DD 23:59:59');
    return {
      monday: last_monday,
      sunday: last_sunday
    };
  };
  let getSortType = () => {
    let dom = $('.comparison-sort .op-grp>input.op-btn-active');
    return dom.attr('data-id');
  };
  let getCostPieType = () => {
    let pieRmb = $('.comparison-proportion .proportion-grp .comparison-rmb.btn-active');
    return pieRmb.length > 0;
  };
  let operateBefore = (defaultInterval = 300) => {
    if (lastclicktime === null)
      lastclicktime = new Date();
    else {
      let currentTime = new Date();
      if (parseInt(currentTime - lastclicktime) <= defaultInterval) {
        console.log('Frequent operation, no response!');
        return false;
      } else {
        lastclicktime = currentTime;
      }
    }
    return true;
  }
  let resetSTimeAndETime = function (type) {
    switch (type) {
      case 2:
        return new Date().format('yyyy-MM-dd') + ' 00:00:00 -- ' + new Date().format('yyyy-MM-dd') + ' 23:59:59';
      case 3:
        return getWeek().monday + ' -- ' + getWeek().sunday;
      case 4:
        let daysInMonth = new moment(new Date()).daysInMonth();
        return new Date().format('yyyy-MM-') + '01 -- ' + new Date().format('yyyy-MM-') + daysInMonth;
      case 5:
        return new Date().format('yyyy-') + '01-01 -- ' + new Date().format('yyyy-') + '12-31';
    }
  };
  let getDefaultSTimeAndETime = function (type) {
    let stimeAndetime = $('div[class="date-component icon iconfont icon-rili"]').val();
    if (stimeAndetime === '') {
      return resetSTimeAndETime(type);
    }
    return stimeAndetime;
  };
  let getExceptionState = () => {
    let exceptionDom = $('.graph-data .exception-manager');
    if (exceptionDom) return $(exceptionDom[0]).attr('data-toggle') === 'open';
    return false;
  };
  let getAreaDefaultSTimeAndETime = function (type) {
    let stimeAndetime = $('#area-datevalue').val();
    if (stimeAndetime === '') {
      return resetSTimeAndETime(type);
    }
    return stimeAndetime;
  };
  let getAreaFgpSTimeAndETime = function (type) {
    switch (type) {
      case 2:
        let dayDate = $('#area-fgp-daycontainer').val();
        let dayArray = dayDate.split(' -- ');
        return dayArray[0] + ' 00:00:00 -- ' + dayArray[1] + ' 23:59:59';
      case 3:
        return getWeek().monday + ' -- ' + getWeek().sunday;
      case 4:
        let monthDate = $('#area-fgp-monthcontainer').val();
        let monthArray = monthDate.split(' -- ');
        let daysInMonth = new moment(new Date(monthArray[1])).daysInMonth();
        return monthArray[0] + '-01 -- ' + monthArray[1] + '-' + daysInMonth;
    }
  };
  let getMeterFgpSTimeAndETime = function (type) {
    switch (type) {
      case 2:
        let dayDate = $('#meter-fgp-daycontainer').val();
        let dayArray = dayDate.split(' -- ');
        return dayArray[0] + ' 00:00:00 -- ' + dayArray[1] + ' 23:59:59';
      case 3:
        return getWeek().monday + ' -- ' + getWeek().sunday;
      case 4:
        let monthDate = $('#meter-fgp-monthcontainer').val();
        let monthArray = monthDate.split(' -- ');
        let daysInMonth = new moment(new Date(monthArray[1])).daysInMonth();
        return monthArray[0] + '-01 -- ' + monthArray[1] + '-' + daysInMonth;
    }
  };
  let getChartType = function () {
    let activeItem = $('.operate-grp>.should-uniq.btn-active')
    if (!activeItem) return 'bar';
    return $(activeItem).attr('data-value');
  };
  let getAreaChartType = function () {
    let activeItem = $('.area-operate-grp>.should-uniq.btn-active')
    if (!activeItem) return 'bar';
    return $(activeItem).attr('data-value');
  };
  let getXAxisData = function (type, sTime, eTime) {
    switch (type) {
      case 2:
        let dayxAxis = [];
        let startTime = new moment(_.trim(sTime));
        let endTime = new moment(_.trim(eTime));
        for (let i = startTime; i <= endTime; i = i.add(1, 'h')) {
          dayxAxis.push(i.format('YYYY-MM-DD HH'));
        }
        return dayxAxis;
      case 3:
      case 4:
        let monthxAxis = [];
        let monthStartTime = new moment(_.trim(sTime));
        let monthEndTime = new moment(_.trim(eTime));
        for (let i = monthStartTime; i <= monthEndTime; i = i.add(1, 'd')) {
          monthxAxis.push(i.format('YYYY-MM-DD'));
        }
        return monthxAxis;
      case 5:
        let yearxAxis = [];
        let ssTime = new moment(sTime);
        let eeTime = new moment(eTime);
        for (let i = ssTime; i <= eeTime; i = i.add(1, 'month')) {
          yearxAxis.push(i.format('YYYY-MM'));
        }
        return yearxAxis;
    }
  };
  let getOriginalXAxisData = function (datas) {
    let xDatas = [];
    _.each(datas, data => {
      _.each(data.now_data_list || data.data_list, now => {
        xDatas.push(now.date);
      });
    });
    return _.sortedUniq(xDatas);
  };
  let getChartSeries = function (datas, mfIdAndNameMap, xAxisData, type = 'bar', exceptionData, showLabel = false) {
    let seriesArray = [];
    let showLabel_1 = false;
    if ($("#area-zone").is(":hidden")) {
      showLabel_1 = $('.show-tip').hasClass('btn-active') ? true : false;
    } else {
      showLabel_1 = $('.show-tip-area').hasClass('btn-active') ? true : false;
    }
    _.each(datas, data => {
      let mfMap = _.find(mfIdAndNameMap, a => a.id === data.mfid);
      let series = {
        name: mfMap ? mfMap.name : '',
        type: type,
      };
      series.itemStyle = {
        normal: {
          label: {
            show: showLabel_1,
          }
        }
      };
      series.markPoint = {
        data: [{
            type: 'max',
            name: '最大值'
          },
          {
            type: 'min',
            name: '最小值'
          }
        ]
      };
      series.markLine = {
        data: [{
          type: 'average',
          name: '平均值',
          label: {
            position: "right"
          },
          tooltip: {
            trigger: 'item',
            formatter: function (params) {
              return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
            }
          }
        }]
      };
      xAxisData = _.uniq(_.orderBy(xAxisData, a => a, "asc"));
      series.data = _.map(xAxisData, a => {
        var valueItem = _.find(data.now_data_list || data.data_list, b => b.date === a);
        if (!!valueItem) return valueItem.val;
      });
      let rule = data.rule;
      if (rule != null) {
        if (rule.LowerLimit != null) {
          series.markLine.data.push({
            name: '下限报警',
            itemStyle: {
              normal: {
                color: '#dc143c'
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: function (params) {
                return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
              }
            },
            yAxis: rule.LowerLimit
          });
          if (rule.LowerWave != null) {
            let waveValue = rule.LowerLimit + rule.LowerWave;
            series.markLine.data.push({
              name: '下限预警',
              itemStyle: {
                normal: {
                  color: '#FF8C00'
                }
              },
              tooltip: {
                trigger: 'item',
                formatter: function (params) {
                  return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
                }
              },
              yAxis: waveValue
            });
          }
        }
        if (rule.UpperLimit != null) {
          series.markLine.data.push({
            name: '上限报警',
            itemStyle: {
              normal: {
                color: '#dc143c',
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: function (params) {
                return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
              }
            },
            yAxis: rule.UpperLimit
          });
          if (rule.UpperWave != null) {
            let waveValue = rule.UpperLimit - rule.UpperWave;
            series.markLine.data.push({
              name: '上限预警',
              itemStyle: {
                normal: {
                  color: '#FF8C00'
                }
              },
              tooltip: {
                trigger: 'item',
                formatter: function (params) {
                  return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
                }
              },
              yAxis: waveValue
            });
          }
        }
      }
      if ($("#button").is(':checked') && exceptionData) {
        let newSeries = [],
          exceptionSeries = [],
          expDate = [],
          startTime = [],
          endTime = [],
          val = [];
        _.each(exceptionData, data => {
          expDate.push(data.date);
          startTime.push(data.original_time.substring(0, xAxisData[0].length));
          endTime.push(data.original_time.substring(20, xAxisData[0].length + 20));
          val.push(data.val);
        })
        series.stack = '堆积',
          exceptionSeries = {
            data: [],
            name: '异常数据',
            type: 'bar',
            stack: "堆积",
            itemStyle: {
              normal: {
                color: '#f6bb43'
              }
            },
            tooltip: {
              formatter: function (params) {
                // return _exceptionData.dataList.length > 0?
                // _exceptionData.dataList[0].val + chartSeries
                // }
                // console.log(params)
                return params.seriesName + ': ' + params.value;
              }
            }
          }
        exceptionSeries.length = xAxisData.length;
        for (let k in endTime) {
          for (let i in xAxisData) {
            if (endTime[k] == xAxisData[i]) {
              for (let j in data.now_data_list) {
                if (endTime[k] == data.now_data_list[j].date) {
                  series.data[i] = Number(data.now_data_list[j].val - val[k]).toFixed(3);
                  exceptionSeries.data[i] = Number(val[k]).toFixed(3);
                }
              }
            } else {
              if (exceptionSeries.data[i]) {
                continue;
              }
              exceptionSeries.data[i] = 0;
            }
          }
        }
        newSeries.push(series)
        newSeries.push(exceptionSeries);
        for (let i = 0; i < newSeries.length; i++) {
          seriesArray.push(newSeries[i])
        }
      } else {
        seriesArray.push(series);
      }
    });
    // console.log(seriesArray)
    return seriesArray;
  };
  let getChartSeriesForCost = function (datas, mfIdAndNameMap, xAxisData, showLabel = false, shouldFilter = false) {
    let seriesArray = [];
    let costDatas = [];
    if (shouldFilter) costDatas = _.filter(datas, a => a.ischecked);
    else costDatas = datas;
    _.each(costDatas, data => {
      let series = {
        name: _.find(mfIdAndNameMap, a => a.id === data.mfid).name + '_费用',
        type: 'line'
      };
      series.data = _.map(xAxisData, a => {
        var valueItem = _.find(data.now_data_list || data.data_list, b => b.date === a);
        if (!!valueItem) return valueItem.cost;
      });
      series.itemStyle = {
        normal: {
          borderWidth: 1,
          lineStyle: {
            type: 'solid',
            color: 'rgb(194,53,49)',
            width: 2,
          },
          label: {
            show: showLabel
          }
        },
      };
      series.markPoint = {
        data: [{
            type: 'max',
            name: '最大值'
          },
          {
            type: 'min',
            name: '最小值'
          }
        ]
      };
      series.markLine = {
        data: [{
          type: 'average',
          name: '平均值',
          label: {
            position: "right"
          },
          tooltip: {
            trigger: 'item',
            formatter: function (params) {
              return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
            }
          }
        }]
      };
      seriesArray.push(series);
    });
    return seriesArray;
  }
  let generateAreaSort = function (datas) {
    let meterAndMfIdMap = [];
    let meterAndMfIdArray = areaConfigure.meterid_mfid_map.split(';');
    _.each(meterAndMfIdArray, mm => {
      if (mm === '') return true;
      let mmArray = mm.split(',');
      meterAndMfIdMap.push({
        mId: mmArray[0],
        mfid: mmArray[1]
      });
    });
    let data = {
      areaMeterList: []
    };
    let totalValue = _.sum(_.map(datas, dd => dd.sum_val || dd.now_sum_val));
    _.each(areaConfigureMeters, m => {
      let mmp = _.find(meterAndMfIdMap, a => a.mId === m.id);
      let item = _.find(datas, d => d.mfid === mmp.mfid);
      data.areaMeterList.push({
        name: m.text,
        unit: areaConfigure.unit,
        value: numberFormat((item.sum_val || item.now_sum_val || 0).toFixed(2)),
        percent: (((item.sum_val || item.now_sum_val) || 0) * 100 / totalValue).toFixed(2)
      });
    });
    data.areaMeterList = _.orderBy(data.areaMeterList, a => parseFloat(_.replace(a.value, ',', '')), ["desc"]);
    for (let i = 0; i < data.areaMeterList.length; i++) {
      data.areaMeterList[i].color = sortColor[i];
    }
    let templateHtml = template('area-sort-list-template', data);
    $('.area-sort-list').html(templateHtml);
  };
  let generateAreaCostSort = function (datas) {
    let meterAndMfIdMap = [];
    let meterAndMfIdArray = areaConfigure.meterid_mfid_map.split(';');
    _.each(meterAndMfIdArray, mm => {
      if (mm === '') return true;
      let mmArray = mm.split(',');
      meterAndMfIdMap.push({
        mId: mmArray[0],
        mfid: mmArray[1]
      });
    });
    let data = {
      areaMeterList: []
    };
    _.each(datas, d => {
      d.sum_cost = _.sum(_.map(d.data_list || d.now_data_list, a => a.cost));
    });
    let totalCost = _.sum(_.map(datas, dd => dd.sum_cost));
    _.each(areaConfigureMeters, m => {
      let mmp = _.find(meterAndMfIdMap, a => a.mId === m.id);
      let item = _.find(datas, d => d.mfid === mmp.mfid);
      data.areaMeterList.push({
        name: m.text,
        unit: '元',
        value: numberFormat((item.sum_cost || 0).toFixed(2)),
        percent: totalCost === 0 ? '0.00' : ((item.sum_cost || 0) * 100 / totalCost).toFixed(2)
      });
    });
    data.areaMeterList = _.orderBy(data.areaMeterList, a => parseFloat(_.replace(a.value, ',', '')), ["desc"]);
    for (let i = 0; i < data.areaMeterList.length; i++) {
      data.areaMeterList[i].color = sortColor[i];
    }
    let templateHtml = template('area-sort-list-template', data);
    $('.area-sort-list').html(templateHtml);
  }
  // 区域饼图
  let generateAreaPie = function (selected) {
    let datas = [];
    let legends = [];
    let meterAndMfIdMap = [];
    let meterAndMfIdArray = areaConfigure.meterid_mfid_map.split(';');
    _.each(meterAndMfIdArray, mm => {
      if (mm === '') return true;
      let mmArray = mm.split(',');
      meterAndMfIdMap.push({
        mId: mmArray[0],
        mfid: mmArray[1]
      });
    });
    _.each(searchResult.datas, data => {
      let mmp = _.find(meterAndMfIdMap, a => a.mfid === data.mfid);
      let meter = _.find(areaConfigureMeters, a => a.id === mmp.mId);
      let sumVal = {
        name: meter.text,
        value: numberFormat((data.sum_val || data.now_sum_val || 0).toFixed(2))
      };
      // let legend = {
      //   isChecked: false
      // };
      // if (data['ischecked']) {
      //   legend.isChecked = true;
      // }
      datas.push(sumVal);
      // legend.name = meter.text;
      legend = meter.text;
      legends.push(legend);
    });
    let newLegends = legends;
    let legendHtml = template('pieLegendDataTemplate', {
      legendData: newLegends
    });
   
    let len = legends.length;
    $('.pie-legend-ul')[0].innerHTML = legendHtml;
    $('.pie-legend-ul')[0].height = Math.ceil(len/3)*26 + 'px';
    for(let i =0;i < len;i++){
      let legendName = $('.pie-legend-ul li')[i].innerText;
      if(selected[0]){
        $('.pie-legend-ul li .legend-color')[i].style.background = sortColor[i];
      }else{
        if(!selected[legendName]){
          $($('.pie-legend-ul li span')[i]).attr('select','selected')
          $($('.pie-legend-ul li span')[i]).addClass('bg-gray');
          $($('.pie-legend-ul li')[i]).addClass('font-gray');
        }else{
          $('.pie-legend-ul li .legend-color')[i].style.background = sortColor[i];
          // option.legend.selected[$('.pie-legend-ul li')[i].innerText] = true;
          $($('.pie-legend-ul li span')[i]).attr('select','')
              $($('.pie-legend-ul li span')[i]).removeClass('bg-gray');
              $($('.pie-legend-ul li')[i]).removeClass('font-gray');
        }
      }
    }
    // 区域分项占比实例化
    let option = generatePieForAggregateData(newLegends,selected,datas, searchResult.unit);
    // console.log(option)
    // $('#proportion-chart-instance div:first').height('calc(100% + '+option.legend.data.length/9*22+'px)')
    let areaChart = echarts.init(document.getElementById('proportion-chart-instance'), e_macarons);
    areaChart.off('legendselectchanged');
    areaChart.setOption(option, true);
    areaChart.resize();
    window.addEventListener('resize', function () {
      areaChart.resize();
    });
    $('.pie-legend-ul li').on('click',function(e){
      // e.stopPropagation();
      let name = $(e.currentTarget).attr('data-name');
      let isSelected = $(this).children('span').attr('select')
      if(isSelected == ''){
        $(this).children('span').attr('select','selected');
        $(this).children('span').addClass('bg-gray');
        $(this).addClass('font-gray');
        console.log(option)
        option.legend.selected[this.innerText] = false;
      }else{
        $(this).children('span').attr('select','');
        $(this).children('span').removeClass('bg-gray');
        $(this).removeClass('font-gray');
        option.legend.selected[this.innerText] = true;
      }
      // let selected = option.legend.selected;
      // generateAreaPie(selected);
      areaChart.setOption(option, true);
    })

    if($(this).children('span').attr('select')){
      option.legend.selected[this.innerText] = true;
    }else{
      option.legend.selected[this.innerText] = false;
    }
    areaChart.setOption(option, true);
  };
  let generateAreaCostPie = function () {
    let datas = [];
    let legends = [];
    let meterAndMfIdMap = [];
    let meterAndMfIdArray = areaConfigure.meterid_mfid_map.split(';');
    _.each(meterAndMfIdArray, mm => {
      if (mm === '') return true;
      let mmArray = mm.split(',');
      meterAndMfIdMap.push({
        mId: mmArray[0],
        mfid: mmArray[1]
      });
    });
    _.each(searchResult.datas, data => {
      let mmp = _.find(meterAndMfIdMap, a => a.mfid === data.mfid);
      let meter = _.find(areaConfigureMeters, a => a.id === mmp.mId);
      let sumVal = {
        name: meter.text,
        value: numberFormat((_.sum(_.map((data.data_list || data.now_data_list), a => a.cost))).toFixed(2))
      };
      let legend = {
        isChecked: false
      };
      if (data['ischecked']) {
        legend.isChecked = true;
      }
      datas.push(sumVal);
      legend.name = meter.text;
      legends.push(legend);
    });
    let none = '';
    let option = generatePieForAggregateData(legends,none, datas, '元', '费用对比');
    let areaChart = echarts.init(document.getElementById('proportion-chart-instance'), e_macarons);
    areaChart.setOption(option, true);
    areaChart.resize();
    window.addEventListener('resize', function () {
      areaChart.resize();
    });
  };
  let searchMeterData = function (exceptionData) {

    if (currentMeterParameters.length <= 0) {
      toastr.warning('请先选择查询仪表');
      return;
    }
    if ($('.btn-grp div.date-active').attr('data-value') != 5) {
      $('.on-off-button').show();
    }
    let currentSelectedParameters = _.filter(currentMeterParameters, a => a.isChecked);
    if (currentSelectedParameters.length <= 0) currentSelectedParameters = currentMeterParameters;
    let parameter = _.head(currentSelectedParameters);
    let dateType = getSearchDateType();
    let searchDateType = dateType === -1 ? 2 : dateType;
    let searchParaType = dateType === -1 ? 1 : parameter.type;
    let defaultTimeStr = getDefaultSTimeAndETime(searchDateType);
    let timeArray = defaultTimeStr.split(' -- ');
    let sTime = timeArray[0];
    let eTime = timeArray[1];
    $(window).resize();
    $('#vmeter-summary').hide();
    if (comparsionSelectedMeters.length > 0) {
      $('.comparison-tab').show();
      $('.func-tab').hide();
      $('.on-off-button').hide();
      $('.parameter-container .bottom-chart').width('142%');
      $('.parameter-container').css('border-right', 'none');
      $('.top-chart').css('border-right', '1px solid #dce3e6');
      $('#summary-container').hide();
      if (searchParaType === 0) {
        $('#pie').show();
      } else {
        $('#pie').hide();
      }
      let mIds = _.map(comparsionSelectedMeters, a => a.id);
      esdpec.framework.core.getJsonResult('dataanalysis/getparasbymeterids?meterIds=' + _.join(mIds, ','), function (response) {
        if (response.IsSuccess) {
          let mfids = [parameter.id];
          let meterAndParaMap = [{
            name: currentSelectedNode.text,
            mfid: parameter.id,
            id: parameter.id
          }];
          _.each(comparsionSelectedMeters, a => {
            let result = _.find(response.Content, rtn => rtn.meterId === a.id);
            a.parameters = result ? result.mfList : [];
            let para = _.find(result.mfList, a => a.name === parameter.name);
            if (para) {
              para.isChecked = true;
              mfids.push(para.id);
              meterAndParaMap.push({
                name: a.text,
                mfid: para.id,
                id: para.id
              });
            }
          });
          let uriparams = `mfids=${_.join(mfids, ',')}&paraType=${searchParaType}&dateType=${searchDateType}&sTime=${sTime}&eTime=${eTime}`;
          esdpec.framework.core.getJsonResult('dataanalysis/getcomparedata?' + uriparams, function (response) {
            if (response.IsSuccess) {
              let chartLegend = [];
              let chartXaxisData = [];
              chartLegend = _.map(meterAndParaMap, a => a.name);
              chartXaxisData = searchParaType === 0 ? getXAxisData(dateType, sTime, eTime) : getOriginalXAxisData(response.Content);
              chartXaxisData = _.uniq(_.orderBy(chartXaxisData, a => a, "asc"));
              searchResult = {
                unit: parameter.unit,
                chartLegend,
                chartXaxisData,
                datas: response.Content,
                checkedParameters: parameter,
                type: searchParaType,
                meterAndParaMap
              };
              generateComparisonData(meterAndParaMap, response.Content, searchParaType);
              if (ifShowPieChart()) {
                generatePieChart(true);
              } else {
                assembleChartComponent(parameter.unit, chartLegend, chartXaxisData, response.Content, meterAndParaMap, 'chart-instance', getChartType());
              }
            }
          });
        }
      });
    } else {
      $('.comparison-tab').hide();
      $('.func-tab').show();
      $('.on-off-button').show();
      $('#summary-container').show();
      $('.parameter-container .bottom-chart').width('96%');
      $('.parameter-container').css('border-right', '1px solid #dce3e6');
      $('.top-chart').css('border-right', 'none');
      checkElementInVisiable();
      let mfids = _.map(currentSelectedParameters, a => a.id);
      let uriparam = `mfids=${_.join(mfids, ',')}&paraType=${searchParaType}&dateType=${searchDateType}&sTime=${sTime}&eTime=${eTime}`;
      esdpec.framework.core.getJsonResult('dataanalysis/getdata?' + uriparam, function (response) {
        if (response.IsSuccess) {
          let chartLegend = [];
          let chartXaxisData = [];
          let checkedParameters = _.filter(currentMeterParameters, p => _.includes(mfids, p.id));
          if (!response.Content.now_sum_val || response.Content.now_sum_val === '') {
            now_Sum = 0;
          } else {
            now_Sum = numberFormat((response.Content.now_sum_val).toFixed(2))
          }
          chartLegend = _.map(checkedParameters, a => a.name);
          chartXaxisData = searchParaType === 0 ? getXAxisData(dateType, sTime, eTime) : getOriginalXAxisData(response.Content.data_list);
          chartXaxisData = _.uniq(_.orderBy(chartXaxisData, a => a, "asc"));
          let datas = searchParaType === 0 ? [response.Content] : response.Content.data_list;
          searchResult = {
            unit: parameter.unit,
            chartLegend,
            chartXaxisData,
            datas,
            checkedParameters,
          };
          assembleChartComponent(parameter.unit, chartLegend, chartXaxisData, datas, checkedParameters, 'chart-instance', getChartType(), exceptionData);
          // 当前数据的值
          if (currentSelectedNode.modeltype === 'meter') {
            $('#summary-container').show();
            $('.func-tab').show();
            if (searchParaType === 0 && dateType !== 3) { // && sTime.substring(0, 10) === eTime.substring(0, 10)
              $('.summary-container').show();
              let firstTitle = '今日',
                lastTitle = '昨日',
                title = '日用量对比昨日同期';
              switch (dateType) {
                case 2:
                  title = '日用量对比昨日同期';
                  firstTitle = '今日';
                  lastTitle = '昨日';
                  break;
                case 4:
                  title = '月用量对比上月同期';
                  firstTitle = '本月';
                  lastTitle = '上月';
                  break;
                case 5:
                  title = '年用量对比去年同期';
                  firstTitle = '今年';
                  lastTitle = '去年';
                  break;
              }
              generateContemporaryComparison(response.Content.avg_per, response.Content.avg_val, response.Content.last_sum_val, response.Content.now_sum_val, response.Content.sum_per, parameter.unit, firstTitle, lastTitle, title);
            } else if (searchParaType !== 0) {
              $('.summary-container').hide();
              $('.func-tab').show();
              $('#vmeter-summary').show();
              let vals = _.map(datas[0].now_data_list, a => a.val);
              let max = _.max(vals);
              let min = _.min(vals);
              let sum = _.sum(vals);
              let average = (datas[0].now_data_list !== null && datas[0].now_data_list.length > 0) ? sum / datas[0].now_data_list.length : 0;
              let summaryData = {
                vMeterFeatureData: [{
                    name: '最大值',
                    val: numberFormat((max || 0).toFixed(3)),
                    bgcolor: '#4b89dc',
                    unit: parameter.unit
                  },
                  {
                    name: '平均值',
                    val: numberFormat((average || 0).toFixed(3)),
                    bgcolor: '#f6bb43',
                    unit: parameter.unit
                  },
                  {
                    name: '最小值',
                    val: numberFormat((min || 0).toFixed(3)),
                    bgcolor: '#38bc9b',
                    unit: parameter.unit
                  }
                ]
              };
              let templateHtml = template('vmeter-data-comparison', summaryData);
              $('#vmeter-content').html(templateHtml);
              now_Sum = (summaryData.vMeterFeatureData[0].val.replace(/,/g, '') - summaryData.vMeterFeatureData[2].val.replace(/,/g, '')).toFixed(2);
            }
            generateGraphData(parameter.unit, searchParaType);
            generateOriginalData();
            generateFgpData();
          } else if (currentSelectedNode.modeltype === 'vmeter') {
            $('#summary-container').hide();
            $('.func-tab').hide();
            $('#vmeter-summary').show();
            let vals = _.map(datas[0].now_data_list, a => a.val);
            let max = _.max(vals);
            let min = _.min(vals);
            let sum = _.sum(vals);
            let average = (datas[0].now_data_list !== null && datas[0].now_data_list.length > 0) ? sum / datas[0].now_data_list.length : 0;
            let summaryData = {
              vMeterFeatureData: [{
                  name: '最大值',
                  val: numberFormat((max || 0).toFixed(3)),
                  bgcolor: '#4b89dc',
                  unit: parameter.unit
                },
                {
                  name: '平均值',
                  val: numberFormat((average || 0).toFixed(3)),
                  bgcolor: '#f6bb43',
                  unit: parameter.unit
                },
                {
                  name: '最小值',
                  val: numberFormat((min || 0).toFixed(3)),
                  bgcolor: '#38bc9b',
                  unit: parameter.unit
                }
              ]
            };
            let templateHtml = template('vmeter-data-comparison', summaryData);
            $('#vmeter-content').html(templateHtml);
          } else {
            $('#summary-container').hide();
            $('.func-tab').hide();
          }
        }
      });
    }
  };
  let searchAreaData = function () {
    if (areaConfigure.mfIds.length <= 0) return;
    let dateType = getSearchAreaDateType();
    let defaultTimeStr = getAreaDefaultSTimeAndETime(dateType);
    let sTime = defaultTimeStr.split('--')[0];
    let eTime = defaultTimeStr.split('--')[1];
    let mfids = areaConfigure.mfIds;
    let meterAndParaMap = [];
    let meterMfidMap = areaConfigure.meterid_mfid_map.split(';');
    let mfidMap = [];
    _.each(meterMfidMap, a => {
      if (a === '') return true;
      let pairs = a.split(',');
      mfidMap.push({
        mId: pairs[0],
        mfid: pairs[1]
      });
    });
    _.each(areaConfigureMeters, a => {
      let mm = _.find(mfidMap, m => m.mId === a.id);
      if (!mm) return true;
      meterAndParaMap.push({
        name: a.text,
        mfid: mm.mfid,
        id: mm.mfid
      });
    });
    if (mfids.length === 1) {
      let uriparam = `mfids=${_.join(mfids, ',')}&paraType=0&dateType=${dateType}&sTime=${sTime}&eTime=${eTime}`;
      esdpec.framework.core.getJsonResult('dataanalysis/getdata?' + uriparam, function (response) {
        if (response.IsSuccess) {
          let chartLegend = [];
          let chartXaxisData = [];
          chartLegend = _.map(meterAndParaMap, a => a.name);
          chartXaxisData = getXAxisData(dateType, sTime, eTime);
          chartXaxisData = _.uniq(_.orderBy(chartXaxisData, a => a, "asc"));
          searchResult = {
            unit: areaConfigure.unit,
            chartLegend,
            chartXaxisData,
            datas: [response.Content],
            type: 0,
            meterAndParaMap
          };
          generateAreaChart(areaConfigure.unit, chartLegend, chartXaxisData, [response.Content], meterAndParaMap, 'area-chart-instance', getAreaChartType());
          if (getSortType() === 'usage') generateAreaSort([response.Content]);
          else generateAreaCostSort([response.Content]);
          if (getCostPieType()) generateAreaCostPie([response.Content]);
          else generateAreaPie([response.Content]);
          generateAreaFgp();
        }
      });
    } else {
      let uriparams = `mfids=${_.join(mfids, ',')}&paraType=0&dateType=${dateType}&sTime=${sTime}&eTime=${eTime}`;
      esdpec.framework.core.getJsonResult('dataanalysis/getcomparedata?' + uriparams, function (response) {
        if (response.IsSuccess) {
          // console.log(response)
          let chartLegend = [];
          let chartXaxisData = [];
          chartLegend = _.map(meterAndParaMap, a => a.name);
          chartXaxisData = getXAxisData(dateType, sTime, eTime);
          chartXaxisData = _.uniq(_.orderBy(chartXaxisData, a => a, "asc"));
          searchResult = {
            unit: areaConfigure.unit,
            chartLegend,
            chartXaxisData,
            datas: response.Content,
            type: 0,
            meterAndParaMap
          };
          generateAreaChart(areaConfigure.unit, chartLegend, chartXaxisData, response.Content, meterAndParaMap, 'area-chart-instance', getAreaChartType());
          if (getSortType() === 'usage') generateAreaSort(response.Content);
          else generateAreaCostSort(response.Content);
          if (getCostPieType()) generateAreaCostPie(response.Content);
          else generateAreaPie(response.Content);
          generateAreaFgp();
        }
      });
    }
  };
  let assembleChartComponent = function (unit, chartLegend, chartXaxisData, datas, checkedParameters, chartDom, chartType = 'bar', exceptionData) {
    let chartSeries = getChartSeries(datas, _.map(checkedParameters, a => {
      return {
        id: a.id,
        name: a.name
      };
    }), chartXaxisData, chartType, exceptionData);
    let costSeries = getChartCostLine('.operate-grp');
    if (costSeries !== null) chartSeries = _.concat(chartSeries, costSeries);
    generateChart(unit, chartLegend, chartXaxisData, chartSeries, chartDom);
  };
  let _exceptionData = {
    dataList: [],
    mfid: ''
  };
  let getExceptionData = function (dataList, mfid) {
    _exceptionData.dataList.length = 0;
    _.each(dataList, a => {
      _exceptionData.dataList.push(a)
    });
    _exceptionData.mfid = mfid;
  }
  //点击后触发改变第一张图表
  let generateChart = function (unit, chartLegend, chartXaxisData, chartSeries, chartDom, selected = undefined) {
    let orderLegend = _.orderBy(chartLegend, a => a, 'asc');
    let option = {
      color: sortColor,
      title: {
        subtext: '单位：' + unit,
        padding: [-6, 0, 0, 0],
        right: 40,
        top: 20
      },
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: 70,
        right: 50,
        bottom: 20,
        top: 100
      },
      legend: {
        show: false,
        orient: 'vertical',
        data: orderLegend,
        padding: [0, 50, 50, 80],
        width: 'auto',
        height: '25%',
        left: -80,
        itemWidth: 15,
        itemHeight: 13,
        formatter: function (name) {
          return (name.length > 8 ? (name.slice(0, 8) + "...") : name);
        },
        tooltip: {
          show: true
        },
        selected: {}
      },
      calculable: true,
      xAxis: [{
        type: 'category',
        data: chartXaxisData
      }],
      yAxis: [{
        type: 'value',
        position: 'left'
      }],
      dataZoom: [{
        type: "inside"
      }],
      series: chartSeries
    };
    // console.log(option)
    if ($('#button')[0].checked) {
      option.tooltip.formatter = function (params) {
        // console.log(params)
        return params.length > 1 ? (params[0].name + '<br/>' +
            "<div class='white space'></div>" + '总用量：' + (Number(params[0].value ? params[0].value : 0) + Number(params[1].value)) + '<br/>' +
            "<div class='yellow space'></div>" + params[1].seriesName + ' : ' + params[1].value + '<br/>' +
            "<div class='blue space'></div>" + params[0].seriesName + ' : ' + (params[0].value ? params[0].value : 0)) :
          params[0].name + '<br/>' + "<div class='blue space'></div>" + params[0].seriesName + ' : ' + (params[0].value ? params[0].value : 0);
      }
    }
    // if (selected) {
    //   option.legend.selected = selected;
    // }
    analysisChart = echarts.init(document.getElementById(chartDom), e_macarons);
    analysisChart.setOption(option, true);
    analysisChart.resize();
    let legendHtml = template('legendDataTemplate', {
      legendData: orderLegend
    });
    let left = 0
    let btn1,btn2;
    let len = orderLegend.length;
    $('.legend-ul-meter')[0].innerHTML = legendHtml;
    $('.legend-ul-meter')[0].style.width =  Math.ceil(len/3)*155 + 'px';
    for(let i =0;i < $('.legend-ul-meter li').length;i++){
      $('.legend-ul-meter li .legend-color')[i].style.background = sortColor[i];
      option.legend.selected[$('.legend-ul-meter li')[i].innerText] = true;
    }
    
    $('.legend-ul-meter li').on('click',function(e){
      // e.stopPropagation();
      let name = $(e.currentTarget).attr('data-name');
      let isSelected = $(this).children('span').attr('select')
      if(isSelected == ''){
        $(this).children('span').attr('select','selected');
        $(this).children('span').addClass('bg-gray');
        $(this).addClass('font-gray');
        option.legend.selected[this.innerText] = false;
      }else{
        $(this).children('span').attr('select','');
        $(this).children('span').removeClass('bg-gray');
        $(this).removeClass('font-gray');
        option.legend.selected[this.innerText] = true;
      }
        areaChart.setOption(option, true);
        // let selected = option.legend.selected;
        // generateAreaPie(selected);
    })
    $('.scroll-right').on('mousedown',function(e){
      btn1 = setInterval(function(e){
      left -= 20;
      if(left < -Math.ceil(len/3)*155 +155){
        left = -Math.ceil(len/3)*155 + 155;
        $('.legend-ul-meter')[0].style.left = left + 'px'
        return;
      }
        $('.legend-ul-meter')[0].style.left = left + 'px'
      },50)
    })
    $('.scroll-left').on('mousedown',function(){
      btn2 = setInterval(function(e){
        left += 20;
        if(left > 0){
          left = 0;
          $('.legend-ul-meter')[0].style.left = left + 'px'
          return;
        }
        $('.legend-ul-meter')[0].style.left = left + 'px'
      },50)
    })
    $('.scroll-right').on('mouseup',function(){
      clearInterval(btn1)
    })
    $('.scroll-left').on('mouseup',function(){
      clearInterval(btn2)
    })
    if ($("#button").is(':checked')) {
      analysisChart.off('click');
      analysisChart.on('click', function (params) {
        if (params.seriesName != '异常数据') {
          return;
        }
        setTimeout(() => {
          layui.use(['layer', 'laydate', 'table'], function () {
            let exceptionVal = Number(params.value).toFixed(2)
            let lay = layui.layer;
            let setTop = function () {
              let expDate = [],
                startTime = [],
                endTime = [],
                val = [],
                dayTotal = 0,
                data = {};
              _.each(_exceptionData.dataList, eData => {
                expDate.push(eData.date);
                startTime.push(eData.original_time.substring(0, 19));
                endTime.push(eData.original_time.substring(20));
                val.push(eData.val);
              })
              $('.abnormal-total').html(exceptionVal);
              $('.apportion').html($('.abnormal-total').html());
              let dayList = [];
              let exceptionItem = {};
              let dateLength = params.name.length;
              for (let i = 0; i < endTime.length; i++) {
                if (endTime[i].substring(0, dateLength) == params.name) {
                  $('.abnormal-start-time').html(startTime[i]);
                  $('.abnormal-end-time').html(endTime[i]);
                  dayTotal = (endTime[i].substring(5, 7) - startTime[i].substring(5, 7)) * 30 +
                    endTime[i].substring(8, 10) - startTime[i].substring(8, 10) + 1;
                  for (let j = 0; j < dayTotal; j++) {
                    let num = parseInt(startTime[i].substring(8, 10)) + j
                    dayList.push(startTime[i].substring(0, 8) + (num < 10 ? ('0' + num) : num))
                  }
                  data = {
                    dayList,
                    startTm: startTime[i].substring(0, 13),
                    endTm: endTime[i].substring(0, 13)
                  }
                  exceptionItem.mfid = _exceptionData.mfid;
                  exceptionItem.data_list = []
                }
              }
              if (dayTotal > 30) {
                layer.open({
                  title: 0,
                  content: '异常数据区间不可超过30天，请确认!',
                  skin: 'warning-class',
                  time: 2500,
                  shadeClose: true,
                  success: (params) => {
                    params[0].style.zIndex = $('.layui-layer')[0].style.zIndex - 0 + 1;
                    document.onkeydown = function (e) {
                      e = e || window.event;
                      if ((e.keyCode || e.which) == 13) {
                        layer.close(layer.index) //关闭最新弹出框          
                      }
                    }
                  }
                });
                return;
              }
              let templateHtmlAbnormal = template('abnormal-data-template', data);
              $('.abnormal-data').html(templateHtmlAbnormal);
              let createInput = document.createElement('input');
              createInput.type = 'number';
              createInput.name = 'apportionNum';
              //可分摊数据
              let apportionValue = Number($('.apportion').html());
              // 每日分配数量
              let dayInputs = $('.apportion-num');
              let remaining = 0; //分配天后剩余数
              let dayTotalValue = 0;
              let remainingHour = 0; //分配小时后剩余数
              $('.share-datas td.hour-data').append('<input type="number" class="every-hour" name="" id="" onmousewheel="return false;">');
              lay.open({
                type: 1,
                area: ['90%', '80%'],
                shade: 0.6,
                id: 'abnormal-data-out',
                content: $('#abnormal-data-model'),
                zIndex: lay.zIndex,
                shadeClose: true,
                btn: ['保存', '取消'],
                success: function (layero) {
                  $('.layui-layer-title').remove();
                  for (let i = 0; i < $('td.hour').length - 1; i++) {
                    let sStr = $('td.hour')[i].innerText.replace(/\s+/g, "");
                    $('.share-datas td.hour-data')[i].innerHTML = '<i class="icon iconfont icon-Ankerwebicon-"></i>'
                    if (data.startTm.substring(11) - 1 == sStr.substring(0, sStr.length - 1)) {
                      break;
                    }
                  }
                  for (let j = $('td.hour').length - 1; j > 0; j--) {
                    let eStr = $('td.hour')[j].innerText.replace(/\s+/g, "");
                    $('.share-datas td.hour-data')[j].innerHTML = '<i class="icon iconfont icon-Ankerwebicon-"></i>'
                    if (data.endTm.substring(11) - 0 == eStr.substring(0, eStr.length - 1) - 1) {
                      break;
                    }
                  }
                  let getDayTotalValue = function () {
                    dayTotalValue = 0;
                    for (let i = 0; i < dayTotal; i++) {
                      dayTotalValue += Number((dayInputs)[i].value);
                    }
                    return dayTotalValue;
                  }
                  remaining = apportionValue - dayTotalValue;
                  let hourInputs = $('.share-datas td input');
                  let thisDayValue = [];
                  let hourTotalValue = [];
                  let hourInputsValue = 0;
                  let getThisDayValue = () => {
                    hourTotalValue.length = 0;
                    thisDayValue.length = 0;
                    for (let i = 0; i < dayTotal; i++) {
                      thisDayValue.push(Number($('.apportion-num')[i].value));
                      $('.remaining>span')[i].innerHTML = (dayInputs[i].value - thisDayValue[i]).toFixed(2);
                      hourTotalValue.push(0);
                    }
                  }
                  let getHourTotalValue = () => {
                    // hourTotalValue.length = 0;
                    for (let i = 0; i < dayTotal; i++) {
                      if (i == 0) {
                        for (let j = 0; j < firstDayHours; j++) {
                          hourInputsValue = hourInputs[j].value == '' ? 0 : hourInputs[j].value
                          hourTotalValue[i] += Number(hourInputsValue);
                        }
                      } else if (i == dayTotal - 1) {
                        for (let k = hourInputs.length - 1; k > hourInputs.length - lastDayHours - 1; k--) {
                          hourInputsValue = hourInputs[k].value == '' ? 0 : hourInputs[k].value
                          hourTotalValue[i] += Number(hourInputsValue);
                        }
                      } else {
                        for (let l = (i - 1) * 24 + firstDayHours; l < 24 + (i - 1) * 24 + firstDayHours; l++) {
                          hourInputsValue = hourInputs[l].value == '' ? 0 : hourInputs[l].value
                          hourTotalValue[i] += Number(hourInputsValue);
                        }
                      }
                    }
                  }
                  $('.abnormal-total-data .to-everyday').off('click').on('click', function (e) {
                    e.stopPropagation();
                    getDayTotalValue();
                    if (apportionValue - dayTotalValue <= 0) {
                      layer.style(layer.msg("<div class='abnormal-msg'>无可分配数据</div>", {
                        time: 1500,
                        id: 'layui-msg'
                      }), {
                        width: '300px',
                        height: '50px',
                        bgcolor: '#adb3bb',
                        color: '#ffffff'
                      });
                      return;
                    }
                    let tempDay = 0;
                    for (let i = 0; i < dayTotal; i++) {
                      if (dayInputs[i].value) {
                        tempDay++;
                      }
                      hourTotalValue[i] = 0;
                    }
                    getHourTotalValue();
                    // console.log(hourTotalValue)
                    for (let j = 0; j < dayTotal; j++) {
                      if (dayInputs[j].value) {
                        $('.remaining>span')[j].innerHTML = Math.abs(dayInputs[j].value - (hourTotalValue[j] ? hourTotalValue[j] : 0)).toFixed(2) < 0.06 ? 0 :
                          (dayInputs[j].value - (hourTotalValue[j] ? hourTotalValue[j] : 0)).toFixed(2);
                        continue;
                      } else {
                        dayInputs[j].value = ((apportionValue - dayTotalValue) / (dayTotal - tempDay)).toFixed(2);
                        $('.remaining>span')[j].innerHTML = Math.abs(dayInputs[j].value - (hourTotalValue[j] ? hourTotalValue[j] : 0)).toFixed(2) < 0.06 ? 0 :
                          (dayInputs[j].value - (hourTotalValue[j] ? hourTotalValue[j] : 0)).toFixed(2);
                      }
                    }
                    getDayTotalValue();
                    remaining = apportionValue - dayTotalValue;
                    if (Math.abs(remaining) <= 0.3) {
                      $('.apportion').html(0);
                    }
                  });


                  let firstDayHours = 0,
                    lastDayHours = 0,
                    onlyOneDayHours = 0;

                  if (dayTotal > 1) {
                    firstDayHours = 24 - (data.startTm.substring(11) - 1);
                    lastDayHours = data.endTm.substring(11) - 0;
                  } else {
                    onlyOneDayHours = 24 - (data.startTm.substring(11) - 0) - (data.endTm.substring(11) - 0);
                  }
                  $('.form-reset').on('click', function () {
                    $('.expForm')[0].reset();
                    for (let i = 0; i < dayTotal; i++) {
                      $('.remaining>span')[i].innerHTML = 0;
                    }
                    $('.apportion').html($('.abnormal-total').html());
                  })
                  $('.abnormal-total-data .to-everyhour').off('click').on('click', function (e) {
                    e.stopPropagation();
                    // getDayTotalValue();
                    exceptionItem.data_list.length = 0;
                    if ($('.apportion').html() != 0) {
                      layer.open({
                        title: 0,
                        content: '操作无效! ',
                        skin: 'warning-class',
                        time: 2500,
                        shadeClose: true,
                        success: (params) => {
                          params[0].style.zIndex = $('.layui-layer')[0].style.zIndex - 0 + 1;
                          document.onkeydown = function (e) {
                            e = e || window.event;
                            if ((e.keyCode || e.which) == 13) {
                              layer.close(layer.index)
                            }
                          }
                        }
                      });
                      return;
                    }
                    let hasVal = 0;
                    for (let i = 0; i < hourInputs.length; i++) {
                      if (hourInputs[i].value) {
                        hasVal++;
                      }
                    }
                    for (let j = 0; j < dayTotal; j++) {
                      if (hasVal == hourInputs.length && $('.remaining>span')[j].innerHTML) {
                        layer.open({
                          title: 0,
                          content: '无法分配! ',
                          skin: 'warning-class',
                          time: 2500,
                          shadeClose: true,
                          success: (params) => {
                            params[0].style.zIndex = $('.layui-layer')[0].style.zIndex - 0 + 1;
                            document.onkeydown = function (e) {
                              e = e || window.event;
                              if ((e.keyCode || e.which) == 13) {
                                layer.close(layer.index)
                              }
                            }
                          }
                        });
                        return;
                      }
                    }
                    getThisDayValue();
                    getHourTotalValue();
                    for (let i = 0; i < hourInputs.length; i++) {
                      let day = 0,
                        hour = 0;
                      hour = data.startTm.substring(11) - 0 + i;
                      day = data.startTm.substring(9, 10) - 0
                      if (i >= firstDayHours) {
                        day = day + parseInt((i - firstDayHours + 24) / 24);
                      }
                      hour = hour % 24;
                      if (hour == 0) {
                        day = day + 1;
                      }
                      exceptionItem.data_list.push({
                        val: 0,
                        cost: 0,
                        date: data.startTm.substring(0, 8) + (day < 10 ? '0' + day : day) + ' ' + (hour < 10 ? '0' + hour : hour) + ':00:00',
                        datetype: 1,
                        original_time: '',
                        deal_time: ''
                      })

                    }
                    let tempHour = 0;
                    for (let i = 0; i < dayTotal; i++) {
                      if (i == 0) {
                        tempHour = 0;
                        for (let j = 0; j < firstDayHours; j++) {
                          if (hourInputs[j].value) {
                            tempHour++;
                          }
                        }
                        for (let j = 0; j < firstDayHours; j++) {
                          if (hourInputs[j].value) {
                            exceptionItem.data_list[j].val = Number(hourInputs[j].value).toFixed(5);
                            continue;
                          }
                          hourInputs[j].value = ((thisDayValue[i] - hourTotalValue[i]) / (firstDayHours - tempHour)).toFixed(2);
                          // exceptionItem.data_list[j].val = hourInputs[j].value;
                          exceptionItem.data_list[j].val = ((thisDayValue[i] - hourTotalValue[i]) / (firstDayHours - tempHour)).toFixed(5);
                        }
                      } else if (i == dayTotal - 1) {
                        tempHour = 0;
                        for (let k = hourInputs.length - 1; k > hourInputs.length - lastDayHours - 1; k--) {
                          if (hourInputs[k].value) {
                            tempHour++;
                          }
                        }
                        for (let k = hourInputs.length - 1; k > hourInputs.length - lastDayHours - 1; k--) {
                          if (hourInputs[k].value) {
                            exceptionItem.data_list[k].val = Number(hourInputs[k].value).toFixed(5);
                            continue;
                          }
                          hourInputs[k].value = ((thisDayValue[i] - hourTotalValue[i]) / (lastDayHours - tempHour)).toFixed(2);
                          // exceptionItem.data_list[k].val = hourInputs[k].value;
                          exceptionItem.data_list[k].val = ((thisDayValue[i] - hourTotalValue[i]) / (lastDayHours - tempHour)).toFixed(5);
                        }
                      } else {
                        tempHour = 0;
                        for (let l = (i - 1) * 24 + firstDayHours; l < 24 + (i - 1) * 24 + firstDayHours; l++) {
                          if (hourInputs[l].value) {
                            tempHour++;
                          }
                        }
                        for (let l = (i - 1) * 24 + firstDayHours; l < 24 + (i - 1) * 24 + firstDayHours; l++) {
                          if (hourInputs[l].value) {
                            exceptionItem.data_list[l].val = Number(hourInputs[l].value).toFixed(5);
                            continue;
                          }
                          hourInputs[l].value = ((thisDayValue[i] - hourTotalValue[i]) / (24 - tempHour)).toFixed(2);
                          // exceptionItem.data_list[l].val = hourInputs[l].value;
                          exceptionItem.data_list[l].val = ((thisDayValue[i] - hourTotalValue[i]) / (24 - tempHour)).toFixed(5);
                        }
                      }
                    }


                  });
                  $('.apportion-num:input').on('input propertychange', function () {
                    dayTotalValue = 0;
                    for (let i = 0; i < hourInputs.length; i++) {
                      hourInputs[i].value = '';
                    }
                    for (let i = 0; i < dayInputs.length; i++) {
                      dayTotalValue += Number(dayInputs[i].value);
                    }
                    $('.apportion').html((apportionValue - dayTotalValue).toFixed(2));
                  })
                  $('.every-hour:input').on('input propertychange', function () {
                    getThisDayValue();
                    getHourTotalValue();
                    for (let i = 0; i < dayInputs.length; i++) {
                      $('.remaining>span')[i].innerHTML = (Math.abs(dayInputs[i].value - (hourTotalValue[i] ? hourTotalValue[i] : 0)).toFixed(2)) < 0.06 ? 0 :
                        ((dayInputs[i].value - (hourTotalValue[i] ? hourTotalValue[i] : 0)).toFixed(2));
                    }
                  })
                },
                yes: function (index, layero) {
                  let apportionData = parseInt($('.apportion').html());
                  if (apportionData) {
                    layer.open({
                      title: 0,
                      content: '分摊方案不合理，无法保存！',
                      skin: 'warning-class',
                      time: 2500,
                      shadeClose: true,
                      success: (params) => {
                        params[0].style.zIndex = $('.layui-layer')[0].style.zIndex - 0 + 1;
                        document.onkeydown = function (e) {
                          e = e || window.event;
                          if ((e.keyCode || e.which) == 13) {
                            layer.close(layer.index) //关闭最新弹出框          
                          }
                        }
                      }
                    });
                    return;
                  } else {
                    let hourInputs = $('.share-datas td input');
                    let sumDay = 0,
                      sumHour = 0;
                    hourTotalValue = [];
                    for (let i = 0; i < dayTotal; i++) {
                      sumDay += Number(dayInputs[i].value);
                    }
                    for (let i = 0; i < hourInputs.length; i++) {
                      sumHour += Number(exceptionItem.data_list[i].val = hourInputs[i].value);
                    }
                    // console.log(sumDay)
                    // console.log(sumHour)
                    if (Math.abs(sumDay - sumHour) > 0.5) {
                      layer.open({
                        title: 0,
                        content: "分摊不合理，请检查",
                        skin: 'warning-class',
                        time: 2500,
                        shadeClose: true,
                        success: (params) => {
                          params[0].style.zIndex = $('.layui-layer')[0].style.zIndex - 0 + 1;
                          document.onkeydown = function (e) {
                            e = e || window.event;
                            if ((e.keyCode || e.which) == 13) {
                              layer.close(layer.index) //关闭最新弹出框          
                            }
                          }
                        }
                      });
                      return;
                    }
                  }
                  esdpec.framework.core.doPostOperation('exceptionData/savedata', exceptionItem, function (response) {
                    if (response.IsSuccess) {
                      setTimeout(function () {
                        reloadMeterChartData();
                      }, 300);
                      // window.location.reload();//修改成功后刷新页面
                      $("#button")[0].checked = false;
                      layer.close(index);
                      setTimeout(function () {
                        toastr.info('保存成功!');
                      }, 3000);
                      return false;
                    }
                  });
                },
                end: (index, layero) => {
                  // toastr.info('关闭触发');
                }
              });
            };
            setTop();
            $('.layui-layer-btn1').on('click', function (param) {
              if ($('.abnormal-total').html() - 0) {
                $('#abnormal-data-model form')[0].reset();
              }
            })
          });
        }, 300);
      })
    }
    window.addEventListener('resize', function () {
      analysisChart.resize();
    });
  };
  let getException = (sTime, eTime, level, pageIndex, dayTotal) => {
    let selectedItem = _.filter(currentMeterParameters, a => a.isChecked);
    let mIds = _.map(selectedItem, a => a.id);
    let expObj = `mfid=${_.join(mIds, ',')}&dateType=${searchDateType}&sTime=${sTime}&eTime=${eTime}`;
    reloadMeterChartData();
    esdpec.framework.core.getJsonResult('exceptionData/getexceptiondata?' + expObj, function (response) {
      if (response.IsSuccess) {
        let templateHtml = template('abnormal-data-template', data);
        $('.abnormal-data').html(templateHtml);
        layui.use('laypage', function () {
          let laypage = layui.laypage;
          laypage.render({
            elem: 'exception-paging',
            count: dayTotal,
            curr: pageIndex,
            layout: ['count', 'prev', 'page', 'next', 'skip'],
            jump: function (page, first) {
              if (!first) getException(sTime, eTime, level, page.curr, page.count);
            }
          });
        });
      }
    });
  }
  //创建区域echart表格,第一张
  let generateAreaChart = function (unit, chartLegend, chartXaxisData, datas, checkedParameters, chartDom, chartType = 'bar') {
    // let orderLegend = _.orderBy(chartLegend, a => a, 'asc');
    let orderLegend = chartLegend;
    let chartSeries = getChartSeries(datas, _.map(checkedParameters, a => {
      return {
        id: a.id,
        name: a.name,
      };
    }), chartXaxisData, chartType);
    let costSeries = getChartCostLine('.area-operate-grp', true);
    if (costSeries !== null) chartSeries = _.concat(chartSeries, costSeries);
    let option = {
      color: sortColor,
      title: {
        subtext: '单位：' + unit,
        padding: [-6, 0, 0, 0],
        right: 40,
        top: 20
      },
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: 70,
        right: 50,
        bottom: 20,
        top: 100
      },
      legend: {
        show: false,
        orient: 'horizontal',
        data: orderLegend,
        padding: [0, 20, 80, 80],
        width: '80%',
        height: 85,
        left: -80,
        itemWidth: 15,
        itemHeight: 13,
        formatter: function (name) {
          // '{a|这段文本采用样式a}',
          let arr = []
          let nameStr = name.length > 14 ? (name.substring(0, 10) + "..." + name.substring(name.length-4)) : name
          for (var i = 0; i < orderLegend.length; i++) {
            arr.push( '{a|'+nameStr + '}')
            return arr.join('\n');
          }
        },
        textStyle: {
          rich: {
            a: {
              width: 120,
            }
          }
        },
        tooltip: {
          show: true,
        },
        selected: {}
      },
      calculable: true,
      xAxis: [{
        type: 'category',
        data: chartXaxisData
      }],
      yAxis: [{
        type: 'value',
        position: 'left'
      }],
      dataZoom: [{
        type: "inside"
      }],
      series: chartSeries,
    };
    areaChart = echarts.init(document.getElementById(chartDom), e_macarons);
    areaChart.off('legendselectchanged');
    areaChart.setOption(option, true);
    areaChart.resize();
    window.addEventListener('resize', function () {
      areaChart.resize();
    });
    let legendHtml = template('legendDataTemplate', {
      legendData: orderLegend
    });
    let left = 0
    let btn1,btn2;
    let len = orderLegend.length;
    console.log(orderLegend)
    $('.chart-legend ul')[0].innerHTML = legendHtml;
    $('.chart-legend ul')[0].style.width = Math.ceil(len/3)*155 + 'px';
    for(let i =0;i < $('.legend-ul li').length;i++){
      $('.legend-ul li .legend-color')[i].style.background = sortColor[i];
      option.legend.selected[$('.legend-ul li')[i].innerText] = true;
    }
    
    $('.legend-ul li').on('click',function(e){
      // e.stopPropagation();
      let name = $(e.currentTarget).attr('data-name');
      let isSelected = $(this).children('span').attr('select')
      if(isSelected == ''){
        $(this).children('span').attr('select','selected');
        $(this).children('span').addClass('bg-gray');
        $(this).addClass('font-gray');
        option.legend.selected[this.innerText] = false;
      }else{
        $(this).children('span').attr('select','');
        $(this).children('span').removeClass('bg-gray');
        $(this).removeClass('font-gray');
        option.legend.selected[this.innerText] = true;
      }
        areaChart.setOption(option, true);
        let selected = option.legend.selected;
        // console.log(selected)
        let nameArr = [];
        for(let name in selected){
          if(!selected[name]){
            nameArr.push(name)
          }
        }
        // for(let i = 0;i < len;i++){
        //   let legendName = $('.pie-legend-ul li')[i].innerText;
        //   if(!selected[legendName]){
        //     $($('.pie-legend-ul li span')[i]).attr('select','selected')
        //     $($('.pie-legend-ul li span')[i]).addClass('bg-gray');
        //     $($('.pie-legend-ul li')[i]).addClass('font-gray');
        //   }else{
        //     $($('.pie-legend-ul li span')[i]).attr('select','')
        //     $($('.pie-legend-ul li span')[i]).removeClass('bg-gray');
        //     $($('.pie-legend-ul li')[i]).removeClass('font-gray');
        //   }
        // }
        generateAreaPie(selected);
    })

    $('.scroll-right').on('mousedown',function(e){
      btn1 = setInterval(function(e){
      left -= 20;
      if(left < -Math.ceil(len/3)*155 +155){
        left = -Math.ceil(len/3)*155 + 155;
        $('.legend-ul')[0].style.left = left + 'px'
        return;
      }
        $('.legend-ul')[0].style.left = left + 'px'
      },50)
    })
    $('.scroll-left').on('mousedown',function(){
      btn2 = setInterval(function(e){
        left += 20;
        if(left > 0){
          left = 0;
          $('.legend-ul')[0].style.left = left + 'px'
          return;
        }
        $('.legend-ul')[0].style.left = left + 'px'
      },50)
    })
    $('.scroll-right').on('mouseup',function(){
      clearInterval(btn1)
    })
    $('.scroll-left').on('mouseup',function(){
      clearInterval(btn2)
    })
       /* var x,timer;
        var start = $('.legend-ul').offset().left+16;
        $('.chart-legend').bind('mousemove', function(e) {//追踪鼠标位置  
          x= e.pageX;
          x-=start;
          // console.log(x)
        });
        $('.legend-ul').bind('mousedown', function() {//点击创建定时器
            timer = setInterval(function(){
            $('.legend-ul').css('left', -x);
            if(left < -(orderLegend.length/9-1)*456){
              $('#start').css('left', -orderLegend.length/9*456+405);
              clearInterval(timer);
              timer=null;x=null;
              //location.href='Mike Smith.html';
            }else if(x>=0){
              $('.legend-ul').css('left', 0);
              clearInterval(timer);
            }
          }, 50)
        });
        $('.chart-legend').on('mouseup',function() {//松开鼠标清除定时器
          clearInterval(timer);
          if(x<204){
            $('.legend-ul').css('left', 0);
          }
        });*/
    _.each(datas, a => a.ischecked = true);
    areaChart.on('legendselectchanged', function (params) {
      let entity = _.find(searchResult.meterAndParaMap, a => a.name === params.name);
      let data = _.find(datas, b => b.mfid === entity.mfid);
      data.ischecked = params.selected[params.name];
      // console.log(datas)
      if ($('.proportion-grp i.comparison-rmb').hasClass('btn-active')) {
        generateAreaCostPie();
      } else {
        generateAreaPie(datas);
      }
      if ($('.area-operate-grp i.icon-btn-RMB').hasClass('btn-active')) {
        let series = getChartSeries(searchResult.datas, _.map(searchResult.meterAndParaMap, a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, getAreaChartType(), $('.show-tip-area').hasClass('btn-active') ? true : false);
        let cSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.meterAndParaMap, a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, $('.show-tip-area').hasClass('btn-active') ? true : false, true);
        series = _.concat(chartSeries, cSeries);
        let selectedLegend = {};
        _.each(searchResult.datas, data => {
          if (!data.ischecked) {
            let meter = _.find(searchResult.meterAndParaMap, a => a.mfid === data.mfid);
            if (meter) selectedLegend[meter.name] = false;
          }
        });
        generateChart(searchResult.unit, searchResult.chartLegend, searchResult.chartXaxisData, series, 'area-chart-instance', selectedLegend);
      }
    });
  };
  let generateContemporaryComparison = function (avg_per, avg_val, last_sum_val, now_sum_val, sum_per, unit, firstTitle, lastTitle, title) {
    let maxVal = _.max([last_sum_val, now_sum_val, avg_val]);
    let data = {
      data: {
        unit,
        title,
        firstTitle,
        lastTitle,
        avg_per: (!avg_per || avg_per === '') ? 0 : numberFormat(parseFloat(avg_per).toFixed(2)),
        sum_per: (!sum_per || sum_per === '') ? 0 : numberFormat(parseFloat(sum_per).toFixed(2)),
        avg_val: (!avg_val || avg_val === '') ? 0 : numberFormat(parseFloat(avg_val).toFixed(2)),
        last_sum_val: (!last_sum_val || last_sum_val === '') ? 0 : numberFormat(last_sum_val.toFixed(2)),
        now_sum_val: (!now_sum_val || now_sum_val === '') ? 0 : numberFormat(now_sum_val.toFixed(2)),
        last_sum_width: maxVal === 0 ? '0%' : maxVal === last_sum_val ? '98%' : ((last_sum_val / maxVal) * 100) + '%',
        now_sum_width: maxVal === 0 ? '0%' : maxVal === now_sum_val ? '98%' : ((now_sum_val / maxVal) * 100) + '%',
        avg_val_width: maxVal === 0 ? '0%' : maxVal === avg_val ? '98%' : ((avg_val / maxVal) * 100) + '%'
      }
    };
    let templateHtml = template('contemporary-Comparison-template', data);
    $('#summary-container').html(templateHtml);
    setTimeout(() => {
      if ($('#now_sum_val').parent().parent().width() <= 130) {
        $('#now_sum_val').css('left', '0');
      } else {
        $('#now_sum_val').css('transform', 'translateX(-100%)');
      }
      if ($('#last_sum_val').parent().parent().width() <= 130) {
        $('#last_sum_val').css('left', '0');
      } else {
        $('#last_sum_val').css('transform', 'translateX(-100%)');
      }
      if ($('#avg_val').parent().parent().width() <= 130) {
        $('#avg_val').css('left', '0');
      } else {
        $('#avg_val').css('transform', 'translateX(-100%)');
      }
    }, 100);
  };
  let assembleExceptionTable = (originalList, mfid, unit, type) => {
    originalList = _.uniqBy(_.orderBy(originalList, a => a.date, 'asc'), a => a.date);
    _.each(originalList, a => {
      a.val = numberFormat(a.val)
    });
    let originalDatas = {
      data: {
        mfid,
        unit,
        type,
        graphDataList: originalList
      }
    };
    let originalDataHtml = template('graph-table-template', originalDatas);
    $('#graph-table').html(originalDataHtml);
    setTimeout(() => {
      $('.switch-box input.exception-switch').on('click', function (e) {
        e.stopPropagation();
        let currentDom = e.currentTarget;
        let id = $(currentDom).attr('data-id');
        let date = $(currentDom).attr('data-date');
        let exceptionItem = {
          mfid: id,
          time: date,
          val: 0
        }
        if ($(currentDom).is(':checked')) {
          $(currentDom).parent().parent().parent().parent().removeClass('shouldremove');
          esdpec.framework.core.doPostOperation('abnormaldata/cancelsingledata', exceptionItem, function (response) {
            if (response.IsSuccess) {
              reloadMeterChartData();
            }
          });
        } else {
          $(currentDom).parent().parent().parent().parent().addClass('shouldremove');
          esdpec.framework.core.doPostOperation('abnormaldata/savesingledata', exceptionItem, function (response) {
            if (response.IsSuccess) {
              reloadMeterChartData();
            }
          });
        }
      });
      let exception = $('.graph-data .exception-manager');
      if (exception.attr('data-toggle') === 'open') {
        $('.inException').show();
        $('.valtd').removeClass('lasttd');
      } else {
        $('.inException').hide();
        $('.valtd').addClass('lasttd');
      }
    }, 300);
  }
  let generateGraphData = function (unit, type) {
    let currentSelectedParameters = _.filter(currentMeterParameters, a => a.isChecked);
    if (currentSelectedParameters.length <= 0) return;
    let data = {
      selectedParameterList: currentSelectedParameters
    };
    let head = _.find(data.selectedParameterList, a => a.isDefault);
    if (!head) {
      head = _.head(data.selectedParameterList);
      head.isDefault = true;
    }
    let templateHtml = template('list-body-template', data);
    $('.list-body').html(templateHtml);
    $('span.now_Sum').text(now_Sum);
    setTimeout(() => {
      $('.list-body>div.choose-param-item').on('click', function (e) {
        e.stopPropagation();
        let currentDom = e.currentTarget;
        $('.list-body>div.choose-param-item').removeClass('param-item-active');
        $(currentDom).addClass('param-item-active');
        let mfid = $(currentDom).attr('data-id');
        if ($(currentDom).parent().parent().hasClass('param-position')) {
          $('.choose-param-list>.list-body>div.choose-param-item').removeClass('param-item-active');
          $('.choose-param-list>.list-body>div[data-id=' + mfid + ']').addClass('param-item-active');
        } else {
          $('.param-position>.list-body>div.choose-param-item').removeClass('param-item-active');
          $('.param-position>.list-body>div[data-id=' + mfid + ']').addClass('param-item-active');
        }
        let originalList = _.find(searchResult.datas, item => item.mfid === mfid);
        let graphData = originalList ? originalList.now_data_list || [] : [];
        _.each(graphData, a => a.isChecked = true);
        assembleExceptionTable(graphData, mfid, unit, type);
        if (getExceptionState()) {
          let dateType = getSearchDateType();
          let searchDateType = dateType === -1 ? 2 : dateType;
          let defaultTimeStr = getDefaultSTimeAndETime(searchDateType);
          let dateArray = defaultTimeStr.split(' -- ');
          let uriparam = `mfid=${mfid}&sTime=${dateArray[0]}&eTime=${dateArray[1]}`;
          esdpec.framework.core.getJsonResult('abnormaldata/getdata?' + uriparam, function (response) {
            if (response.IsSuccess) {
              if (response.Content.length > 0) {
                let exceptionDatas = [];
                _.each(response.Content, a => {
                  exceptionDatas.push({
                    val: a.val,
                    cost: 0,
                    date: a.time,
                    isChecked: false
                  });
                });
                let graphList = _.concat(graphData, exceptionDatas);
                assembleExceptionTable(graphList, mfid, unit, type);
                return;
              }
            }
          });
        }
      });
    }, 100);
    let originalDatas = {
      data: {
        mfid: head.id,
        unit,
        type
      }
    };
    if (getExceptionState()) {
      let dateType = getSearchDateType();
      let searchDateType = dateType === -1 ? 2 : dateType;
      let defaultTimeStr = getDefaultSTimeAndETime(searchDateType);
      let dateArray = defaultTimeStr.split(' -- ');
      let uriparam = `mfid=${head.id}&sTime=${dateArray[0]}&eTime=${dateArray[1]}`;
      esdpec.framework.core.getJsonResult('abnormaldata/getdata?' + uriparam, function (response) {
        if (response.IsSuccess) {
          if (response.Content.length > 0) {
            let exceptionDatas = [];
            _.each(response.Content, a => {
              exceptionDatas.push({
                val: a.val,
                cost: 0,
                date: a.time,
                isChecked: false
              });
            });
            let originalList = _.find(searchResult.datas, item => item.mfid === head.id);
            let graphData = originalList ? originalList.now_data_list || [] : [];
            _.each(graphData, a => a.isChecked = true);
            let graphList = _.concat(graphData, exceptionDatas);
            assembleExceptionTable(graphList, head.id, unit, type);
          }
        }
      });
    } else {
      let originalList = _.find(searchResult.datas, item => item.mfid === head.id);
      originalDatas.data.graphDataList = originalList ? originalList.now_data_list || [] : []
      _.each(originalDatas.data.graphDataList, a => {
        a.isChecked = true;
        a.val = numberFormat(a.val);
      });
      originalDatas.data.graphDataList = _.uniqBy(originalDatas.data.graphDataList, a => a.date);
      let originalDataHtml = template('graph-table-template', originalDatas);
      $('#graph-table').html(originalDataHtml);
      setTimeout(() => {
        $('.switch-box input.exception-switch').on('click', function (e) {
          e.stopPropagation();
          let currentDom = e.currentTarget;
          let id = $(currentDom).attr('data-id');
          let date = $(currentDom).attr('data-date');
          let exceptionItem = {
            mfid: id,
            time: date,
            val: 0
          }
          if ($(currentDom).is(':checked')) {
            $(currentDom).parent().parent().parent().parent().removeClass('shouldremove');
            esdpec.framework.core.doPostOperation('abnormaldata/cancelsingledata', exceptionItem, function (response) {
              if (response.IsSuccess) {
                reloadMeterChartData();
              }
            });
          } else {
            $(currentDom).parent().parent().parent().parent().addClass('shouldremove');
            esdpec.framework.core.doPostOperation('abnormaldata/savesingledata', exceptionItem, function (response) {
              if (response.IsSuccess) {
                reloadMeterChartData();
              }
            });
          }
        });
        let exception = $('.graph-data .exception-manager');
        if (exception.attr('data-toggle') === 'open') {
          $('.inException').show();
          $('.valtd').removeClass('lasttd');
        } else {
          $('.inException').hide();
          $('.valtd').addClass('lasttd');
        }
      }, 300);
    }
  };
  let generateOriginalData = function () {
    let nodeId = currentSelectedNode.id;
    esdpec.framework.core.getJsonResult('dataanalysis/getlastcollectdata?meterId=' + nodeId, function (response) {
      if (response.IsSuccess) {
        let data = {
          parameterList: response.Content
        };
        _.each(data.parameterList, a => {
          let last = _.head(a.last_datas);
          a.lastDate = last ? _.replace(last.Mt, 'T', ' ').substring(0, 19) : '--';
          a.lastVal = last ? numberFormat(last.Mv) : '--';
        });
        let templateHtml = template('original-table-body-template', data);
        $('#original-table-body').html(templateHtml);
        $('#original-table-body tr').on('click', function (e) {
          e.stopPropagation();
          let currentDom = e.currentTarget;
          let id = $(currentDom).attr('data-id');
          let para = _.find(data.parameterList, a => a.mfid === id);
          let lastDatas = para ? para.last_datas : [];
          let historyData = {
            historyList: lastDatas
          };
          _.each(historyData.historyList, a => {
            a.Mt = _.replace(a.Mt, 'T', ' ').substring(0, 19);
            a.ST = _.replace(a.ST, 'T', ' ').substring(0, 19);
            a.Mv = numberFormat(a.Mv);
          });
          let templateHtml = template('history-data-list-body-template', historyData);
          $('.history-data-list-body').html(templateHtml);
          $('#original-history-data').dialogModal({
            onLoad: () => {
              setTimeout(() => {
                $('.open #lastUnit').text('读数(' + para.unit + ')');
                $('.open #history-header').text(para.name + '历史读数');
              }, 150);
            }
          });
        });
      }
    });
  };
  let generateFgpData = function () {
    let parameters = _.filter(currentMeterParameters, a => a.type === 0);
    if (!parameters || parameters.length <= 0) return;
    let mfids = _.head(parameters).id;
    let dateType = $('.peak-data .btn-group .btn.date-active').attr('data-value');
    let dateStr = getMeterFgpSTimeAndETime(parseInt(dateType));
    let dateArray = dateStr.split(' -- ');
    let queryType = 0;
    let piefirstTitle = '';
    let pielastTitle = '';
    switch (dateType) {
      case '2':
        queryType = (dateArray[0].substring(0, 10) === dateArray[1].substring(0, 10) && dateArray[1].substring(0, 10) === new Date().format('yyyy-MM-dd')) ? 0 : 1;
        piefirstTitle = '今天';
        pielastTitle = '昨天';
        break;
      case '3':
        queryType = 0;
        piefirstTitle = '本周';
        pielastTitle = '上周';
        break;
      case '4':
        queryType = (dateArray[0].substring(0, 7) === dateArray[1].substring(0, 7) && dateArray[1].substring(0, 7) === new Date().format('yyyy-MM')) ? 0 : 1;
        piefirstTitle = '本月';
        pielastTitle = '上月';
        break;
    }
    let uriparam = `mfids=${mfids}&queryType=${queryType}&dateType=${dateType}&sTime=${dateArray[0]}&eTime=${dateArray[1]}`;
    esdpec.framework.core.getJsonResult('dataanalysis/getfgpdata?' + uriparam, function (response) {
      if (response.IsSuccess) {
        let fgpDatas = response.Content;
        generateMeterStackChart('meter-fgp-usage-chart', fgpDatas, dateArray, dateType, 0);
        generateMeterStackChart('meter-fgp-cost-chart', fgpDatas, dateArray, dateType, 1);

        if (!fgpDatas.last_data_list || fgpDatas.last_data_list.length <= 0) {
          $('#meter-fgp-cost-piechart-yes').hide();
          $('#meter-fgp-usage-piechart-yes').hide();
          generateMeterFgpPieChart('meter-fgp-usage-piechart-now', fgpDatas.now_data_list, dateArray, dateType, 0, '总用量分布');
          generateMeterFgpPieChart('meter-fgp-cost-piechart-now', fgpDatas.now_data_list, dateArray, dateType, 1, '总费用分布');
        } else {
          $('#meter-fgp-cost-piechart-yes').show();
          $('#meter-fgp-usage-piechart-yes').show();
          generateMeterFgpPieChart('meter-fgp-usage-piechart-now', fgpDatas.now_data_list, dateArray, dateType, 0, piefirstTitle + '用量分布');
          generateMeterFgpPieChart('meter-fgp-cost-piechart-now', fgpDatas.now_data_list, dateArray, dateType, 1, piefirstTitle + '费用分布');
          generateMeterFgpPieChart('meter-fgp-usage-piechart-yes', fgpDatas.last_data_list, dateArray, dateType, 0, pielastTitle + '用量分布');
          generateMeterFgpPieChart('meter-fgp-cost-piechart-yes', fgpDatas.last_data_list, dateArray, dateType, 1, pielastTitle + '费用分布');
        }
        setTimeout(() => {
          let id = $($('.func-tab .layui-tab-title>li.layui-this')[0]).attr('data-id');
          if (id !== 'peak-data') {
            $('#peak-data').hide();
          }
        }, 300);
      }
    });
  };
  let generateAreaFgp = function () {
    let mfids = _.map(searchResult.meterAndParaMap, a => a.mfid);
    let dateType = $('.area-fgp-data .btn.date-active').attr('data-value');
    let dateStr = getAreaFgpSTimeAndETime(parseInt(dateType));
    let dateArray = dateStr.split(' -- ');
    let queryType = 0;
    let piefirstTitle = '';
    let pielastTitle = '';
    switch (dateType) {
      case '2':
        queryType = (dateArray[0].substring(0, 10) === dateArray[1].substring(0, 10) && dateArray[1].substring(0, 10) === new Date().format('yyyy-MM-dd')) ? 0 : 1;
        piefirstTitle = '今天';
        pielastTitle = '昨天';
        break;
      case '3':
        queryType = 0;
        piefirstTitle = '本周';
        pielastTitle = '上周';
        break;
      case '4':
        queryType = (dateArray[0].substring(0, 7) === dateArray[1].substring(0, 7) && dateArray[1].substring(0, 7) === new Date().format('yyyy-MM')) ? 0 : 1;
        piefirstTitle = '本月';
        pielastTitle = '上月';
        break;
    }
    let uriparam = `mfids=${_.join(mfids, ',')}&queryType=${queryType}&dateType=${dateType}&sTime=${dateArray[0]}&eTime=${dateArray[1]}`;
    esdpec.framework.core.getJsonResult('dataanalysis/getfgpdata?' + uriparam, function (response) {
      if (response.IsSuccess) {
        let fgpDatas = response.Content;
        generateStackChart('fgp-usage-chart-instance', fgpDatas, dateArray, dateType, 0);
        generateStackChart('fgp-cost-chart-instance', fgpDatas, dateArray, dateType, 1);

        if (!fgpDatas.last_data_list || fgpDatas.last_data_list.length <= 0) {
          $('#fgp-cost-piechart-yes-instance').hide();
          $('#fgp-usage-piechart-yes-instance').hide();
          generateFgpPieChart('fgp-usage-piechart-now-instance', fgpDatas.now_data_list, dateArray, dateType, 0, '总用量分布');
          generateFgpPieChart('fgp-cost-piechart-now-instance', fgpDatas.now_data_list, dateArray, dateType, 1, '总费用分布');
        } else {
          $('#fgp-cost-piechart-yes-instance').show();
          $('#fgp-usage-piechart-yes-instance').show();
          generateFgpPieChart('fgp-usage-piechart-now-instance', fgpDatas.now_data_list, dateArray, dateType, 0, piefirstTitle + '用量分布');
          generateFgpPieChart('fgp-cost-piechart-now-instance', fgpDatas.now_data_list, dateArray, dateType, 1, piefirstTitle + '费用分布');
          generateFgpPieChart('fgp-usage-piechart-yes-instance', fgpDatas.last_data_list, dateArray, dateType, 0, pielastTitle + '用量分布');
          generateFgpPieChart('fgp-cost-piechart-yes-instance', fgpDatas.last_data_list, dateArray, dateType, 1, pielastTitle + '费用分布');
        }
      }
    });
  };
  let getToolTipTitle = data => data.axisValueLabel;
  let getStackSeriesData = (list, key, chartType, type = 's') => {
    let data = _.find(list, a => a.name === key);
    if (data && data.list && data.list.length > 0) {
      if (type === 's') {
        return _.sum(_.map(data.list, a => chartType === 0 ? a.data : a.cost));
      } else {
        return _.map(data.list, a => chartType === 0 ? a.data : a.cost);
      }
    }
    return 0.0;
  };
  // 获取堆叠图数据 峰谷平
  let getStackSeries = (branchs, datas, flag, chartType) => {
    let usageSeries = [];
    // console.log(datas)
    if (flag === 0) {
      _.each(branchs, (b, index) => {
        usageSeries.push({
          name: b,
          type: 'bar',
          stack: '堆积',
          barMaxWidth: 30,
          data: [getStackSeriesData(datas.last_data_list, b, chartType), getStackSeriesData(datas.now_data_list, b, chartType)],
          itemStyle: {
            normal: {
              color: chartType === 0 ? usageColor[index] : costColor[index]
            },
          }
        });
      });
      // console.log(usageSeries)
    } else {
      _.each(branchs, (b, index) => {
        usageSeries.push({
          name: b,
          type: 'bar',
          stack: '堆积',
          barMaxWidth: 30,
          data: getStackSeriesData(datas.now_data_list, b, chartType, 'm'),
          itemStyle: {
            normal: {
              color: chartType === 0 ? usageColor[index] : costColor[index]
            },
          }
        });
      });
    }
    return usageSeries;
  };
  let generateStackChart = function (chartDom, datas, dateArray, dateType, chartType) {
    let xAxisData = [];
    let series = [];
    let nowbranchs = _.map(datas.now_data_list, a => a.name);
    let lastbranchs = _.map(datas.last_data_list, a => a.name);
    let branchs = _.orderBy(_.merge(nowbranchs, lastbranchs), a => a, 'asc');
    switch (dateType) {
      case '2':
        let flag = 0;
        if (dateArray[0].substring(0, 10) === dateArray[1].substring(0, 10) && dateArray[1].substring(0, 10) === new Date().format('yyyy-MM-dd')) {
          xAxisData = [new Date(dateArray[1]).addDays(-1).format('yyyy-MM-dd'), new Date(dateArray[0]).format('yyyy-MM-dd')];
          flag = 0;
          $('#usage-title').hide();
          $('#cost-title').hide();
          let nowUsageSum = 0,
            lastUsageSum = 0,
            nowCostSum = 0,
            lastCostSum = 0;
          _.each(datas.now_data_list, a => {
            nowUsageSum = _.sum([nowUsageSum, _.sum(_.map(a.list, b => b.data))]);
            nowCostSum = _.sum([nowCostSum, _.sum(_.map(a.list, b => b.cost))]);
          });
          _.each(datas.last_data_list, a => {
            lastUsageSum = _.sum([lastUsageSum, _.sum(_.map(a.list, b => b.data))]);
            lastCostSum = _.sum([lastCostSum, _.sum(_.map(a.list, b => b.cost))]);
          });
          $('.usage-title-container').show().html("<span>昨日用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span><span>今日用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span>");
          $('.cost-title-container').show().html("<span>昨日费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span><span>今日费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span>");
        } else {
          $('.cost-title-container').hide();
          $('.usage-title-container').hide();
          let startTime = new Date(dateArray[0]);
          let endTime = new Date(dateArray[1]);
          for (let i = startTime; i <= endTime; i = i.addDays(1)) {
            xAxisData.push(i.format('yyyy-MM-dd'));
          }
          let usageSum = 0;
          let costSum = 0;
          _.each(datas.now_data_list, a => {
            usageSum = _.sum([usageSum, _.sum(_.map(a.list, b => b.data))]);
            costSum = _.sum([costSum, _.sum(_.map(a.list, a => a.cost))]);
          });
          if (chartType === 0) {
            $('#usage-title').show().text('总用量：' + numberFormat(usageSum.toFixed(3)) + searchResult.unit);
          } else {
            $('#cost-title').show().text('总费用：' + numberFormat(costSum.toFixed(3)) + '元');
          }
          flag = 1;
        }
        series = getStackSeries(branchs, datas, flag, chartType);
        break;
      case '3':
        $('#usage-title').hide();
        $('#cost-title').hide();
        let nowUsageSum = 0,
          lastUsageSum = 0,
          nowCostSum = 0,
          lastCostSum = 0;
        _.each(datas.now_data_list, a => {
          nowUsageSum = _.sum([nowUsageSum, _.sum(_.map(a.list, b => b.data))]);
          nowCostSum = _.sum([nowCostSum, _.sum(_.map(a.list, b => b.cost))]);
        });
        _.each(datas.last_data_list, a => {
          lastUsageSum = _.sum([lastUsageSum, _.sum(_.map(a.list, b => b.data))]);
          lastCostSum = _.sum([lastCostSum, _.sum(_.map(a.list, b => b.cost))]);
        });
        xAxisData = [new Date(getWeek().monday).addDays(-7).format('yyyy-MM-dd') + ' 至 ' + new Date(getWeek().sunday).addDays(-7).format('yyyy-MM-dd'), getWeek().monday.substring(0, 10) + ' 至 ' + getWeek().sunday.substring(0, 10)];
        $('.usage-title-container').show().html("<span>上周用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span><span>本周用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span>");
        $('.cost-title-container').show().html("<span>上周费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span><span>本周费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span>");
        series = getStackSeries(branchs, datas, 0, chartType);
        break;
      case '4':
        let flaga = 0;
        if (dateArray[0].substring(0, 7) === dateArray[1].substring(0, 7) && dateArray[1].substring(0, 7) === new Date().format('yyyy-MM')) {
          xAxisData = [new moment(dateArray[1]).subtract(1, 'months').format('YYYY-MM'), new moment(dateArray[0]).format('YYYY-MM')];
          $('#usage-title').hide();
          $('#cost-title').hide();
          let nowUsageSum = 0,
            lastUsageSum = 0,
            nowCostSum = 0,
            lastCostSum = 0;
          _.each(datas.now_data_list, a => {
            nowUsageSum = _.sum([nowUsageSum, _.sum(_.map(a.list, b => b.data))]);
            nowCostSum = _.sum([nowCostSum, _.sum(_.map(a.list, b => b.cost))]);
          });
          _.each(datas.last_data_list, a => {
            lastUsageSum = _.sum([lastUsageSum, _.sum(_.map(a.list, b => b.data))]);
            lastCostSum = _.sum([lastCostSum, _.sum(_.map(a.list, b => b.cost))]);
          });
          $('.usage-title-container').show().html("<span>上月用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span><span>本月用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span>");
          $('.cost-title-container').show().html("<span>上月费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span><span>本月费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span>");
        } else {
          $('.cost-title-container').hide();
          $('.usage-title-container').hide();
          let startTime = new moment(dateArray[0]);
          let endTime = new moment(dateArray[1]);
          for (let i = startTime; i <= endTime; i = i.add(1, 'months')) {
            xAxisData.push(i.format('YYYY-MM'));
          }
          let usageSum = 0;
          let costSum = 0;
          _.each(datas.now_data_list, a => {
            usageSum = _.sum([usageSum, _.sum(_.map(a.list, b => b.data))]);
            costSum = _.sum([costSum, _.sum(_.map(a.list, a => a.cost))]);
          });
          if (chartType === 0) {
            $('#usage-title').show().text('总用量：' + numberFormat(usageSum.toFixed(3)) + searchResult.unit);
          } else {
            $('#cost-title').show().text('总费用：' + numberFormat(costSum.toFixed(3)) + '元');
          }
          flaga = 1;
        }
        series = getStackSeries(branchs, datas, flaga, chartType);
        break;
    }
    let option = {
      tooltip: {
        trigger: "axis",
        formatter: function (datas) {
          let tooltip = getToolTipTitle(datas[0]) + '<br/>';
          let totalSum = _.sum(_.map(datas, a => a.value));
          _.each(datas, (data, index) => {
            tooltip += "<div style='width: 12px;height:12px;background-color: " + (chartType === 0 ? usageColor[index] : costColor[index]) + "; display: inline-block;margin-right: 10px'></div>" + data.seriesName + (chartType === 0 ? '用量：' : '费用：') +
              numberFormat(data.value.toFixed(3)) + (chartType === 0 ? searchResult.unit : '元') + '， 比例：' + ((data.value / totalSum) * 100).toFixed(3) + '%' + '<br/>';
          });
          tooltip += (chartType === 0 ? '用量' : '费用') + '总计：' + numberFormat(totalSum.toFixed(3)) + (chartType === 0 ? searchResult.unit : '元');
          return tooltip;
        },
        padding: [5, 5, 5, 10]
      },
      legend: {
        itemHeight: 13,
        itemWidth: 15,
        data: [],
      },
      grid: {
        left: 0,
        bottom: 20
      },
      xAxis: {
        data: xAxisData,
        show: true,
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        splitLine: {
          show: false,
        },
        position: 'left'
      },
      series: series
    };
    let areaFgpChart = echarts.init(document.getElementById(chartDom), e_macarons);
    areaFgpChart.setOption(option, true);
    areaFgpChart.resize();
    window.addEventListener('resize', function () {
      areaFgpChart.resize();
    });
  };
  let generateFgpPieChart = function (chartDom, fgpDatas, dateArray, dateType, chartType, title) {
    let datas = [];
    let seriesColor = [];
    let branchs = _.orderBy(_.map(fgpDatas, a => a.name), a => a, 'asc');
    let legend = [];
    let totalSum = 0;
    _.each(fgpDatas, fgp => totalSum = _.sum([totalSum, _.sum(_.map(fgp.list, a => chartType === 0 ? a.data : a.cost))]));
    _.each(branchs, (key, index) => {
      let fgp = _.find(fgpDatas, a => a.name === key);
      if (fgp && fgp.list) {
        let itemValue = (_.sum(_.map(fgp.list, a => chartType === 0 ? a.data : a.cost))).toFixed(3);
        data = {
          name: `${key}：${((parseFloat(itemValue) / totalSum) * 100).toFixed(2)}%`,
          value: itemValue
        };
        datas.push(data);
        legend.push(data.name);
        seriesColor.push(chartType === 0 ? usageColor[index] : costColor[index]);
      }
    });
    let option = {
      title: {
        subtext: title,
        x: 'left',
        left: '20%'
      },
      tooltip: {
        trigger: 'item',
        formatter: function (data) {
          return `${data.seriesName} <br/>${data.name} (${numberFormat(data.value)}` + (chartType === 0 ? searchResult.unit : '元') + ")";
        },
        padding: [5, 5, 5, 10]
      },
      legend: {
        // orient: 'vertical',
        left: '5%',
        top: '65%',
        width: '90%',
        data: legend,
        itemHeight: 13,
        itemWidth: 15
      },
      calculable: true,
      series: [{
        name: title,
        type: 'pie',
        radius: '50%',
        center: ['40%', '40%'],
        label: {
          normal: {
            position: 'inner'
          }
        },
        itemStyle: {
          normal: {
            label: {
              show: false
            }
          }
        },
        data: datas,
        color: seriesColor
      }]
    };
    let pieChart = echarts.init(document.getElementById(chartDom), e_macarons);
    pieChart.setOption(option, true);
    pieChart.resize();
    window.addEventListener('resize', function () {
      pieChart.resize();
    });
  };
  // 仪表详情  峰谷平 用量对比柱状图
  let generateMeterStackChart = function (chartDom, datas, dateArray, dateType, chartType) {
    let xAxisData = [];
    let series = [];
    let nowbranchs = _.map(datas.now_data_list, a => a.name);
    let lastbranchs = _.map(datas.last_data_list, a => a.name);
    let branchs = _.orderBy(_.merge(nowbranchs, lastbranchs), a => a, 'asc');
    switch (dateType) {
      case '2':
        let flag = 0;
        if (dateArray[0].substring(0, 10) === dateArray[1].substring(0, 10) && dateArray[1].substring(0, 10) === new Date().format('yyyy-MM-dd')) {
          xAxisData = [new Date(dateArray[1]).addDays(-1).format('yyyy-MM-dd'), new Date(dateArray[0]).format('yyyy-MM-dd')];
          flag = 0;
          $('#meter-usage-title').hide();
          $('#meter-cost-title').hide();
          let nowUsageSum = 0,
            lastUsageSum = 0,
            nowCostSum = 0,
            lastCostSum = 0;
          _.each(datas.now_data_list, a => {
            nowUsageSum = _.sum([nowUsageSum, _.sum(_.map(a.list, b => b.data))]);
            nowCostSum = _.sum([nowCostSum, _.sum(_.map(a.list, b => b.cost))]);
          });
          _.each(datas.last_data_list, a => {
            lastUsageSum = _.sum([lastUsageSum, _.sum(_.map(a.list, b => b.data))]);
            lastCostSum = _.sum([lastCostSum, _.sum(_.map(a.list, b => b.cost))]);
          });
          $('.meter-usage-title-container').show().html("<span>昨日用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span><span>今日用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span>");
          $('.meter-cost-title-container').show().html("<span>昨日费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span><span>今日费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span>");
        } else {
          $('.meter-cost-title-container').hide();
          $('.meter-usage-title-container').hide();
          let startTime = new Date(dateArray[0]);
          let endTime = new Date(dateArray[1]);
          for (let i = startTime; i <= endTime; i = i.addDays(1)) {
            xAxisData.push(i.format('yyyy-MM-dd'));
          }
          let usageSum = 0;
          let costSum = 0;
          _.each(datas.now_data_list, a => {
            usageSum = _.sum([usageSum, _.sum(_.map(a.list, b => b.data))]);
            costSum = _.sum([costSum, _.sum(_.map(a.list, a => a.cost))]);
          });
          if (chartType === 0) {
            $('#meter-usage-title').show().text('总用量：' + numberFormat(usageSum.toFixed(3)) + searchResult.unit);
          } else {
            $('#meter-cost-title').show().text('总费用：' + numberFormat(costSum.toFixed(3)) + '元');
          }
          flag = 1;
        }
        series = getStackSeries(branchs, datas, flag, chartType);
        break;
      case '3':
        $('#meter-usage-title').hide();
        $('#meter-cost-title').hide();
        let nowUsageSum = 0,
          lastUsageSum = 0,
          nowCostSum = 0,
          lastCostSum = 0;
        _.each(datas.now_data_list, a => {
          nowUsageSum = _.sum([nowUsageSum, _.sum(_.map(a.list, b => b.data))]);
          nowCostSum = _.sum([nowCostSum, _.sum(_.map(a.list, b => b.cost))]);
        });
        _.each(datas.last_data_list, a => {
          lastUsageSum = _.sum([lastUsageSum, _.sum(_.map(a.list, b => b.data))]);
          lastCostSum = _.sum([lastCostSum, _.sum(_.map(a.list, b => b.cost))]);
        });
        xAxisData = [new Date(getWeek().monday).addDays(-7).format('yyyy-MM-dd') + ' 至 ' + new Date(getWeek().sunday).addDays(-7).format('yyyy-MM-dd'), getWeek().monday.substring(0, 10) + ' 至 ' + getWeek().sunday.substring(0, 10)];
        $('.meter-usage-title-container').show().html("<span>上周用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span><span>本周用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span>");
        $('.meter-cost-title-container').show().html("<span>上周费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span><span>本周费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span>");
        series = getStackSeries(branchs, datas, 0, chartType);
        break;
      case '4':
        let flaga = 0;
        if (dateArray[0].substring(0, 7) === dateArray[1].substring(0, 7) && dateArray[1].substring(0, 7) === new Date().format('yyyy-MM')) {
          xAxisData = [new moment(dateArray[1]).subtract(1, 'months').format('YYYY-MM'), new moment(dateArray[0]).format('YYYY-MM')];
          $('#meter-usage-title').hide();
          $('#meter-cost-title').hide();
          let nowUsageSum = 0,
            lastUsageSum = 0,
            nowCostSum = 0,
            lastCostSum = 0;
          _.each(datas.now_data_list, a => {
            nowUsageSum = _.sum([nowUsageSum, _.sum(_.map(a.list, b => b.data))]);
            nowCostSum = _.sum([nowCostSum, _.sum(_.map(a.list, b => b.cost))]);
          });
          _.each(datas.last_data_list, a => {
            lastUsageSum = _.sum([lastUsageSum, _.sum(_.map(a.list, b => b.data))]);
            lastCostSum = _.sum([lastCostSum, _.sum(_.map(a.list, b => b.cost))]);
          });
          $('.meter-usage-title-container').show().html("<span>上月用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span><span>本月用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span>");
          $('.meter-cost-title-container').show().html("<span>上月费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span><span>本月费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span>");
        } else {
          $('.meter-cost-title-container').hide();
          $('.meter-usage-title-container').hide();
          let startTime = new moment(dateArray[0]);
          let endTime = new moment(dateArray[1]);
          for (let i = startTime; i <= endTime; i = i.add(1, 'months')) {
            xAxisData.push(i.format('YYYY-MM'));
          }
          let usageSum = 0;
          let costSum = 0;
          _.each(datas.now_data_list, a => {
            usageSum = _.sum([usageSum, _.sum(_.map(a.list, b => b.data))]);
            costSum = _.sum([costSum, _.sum(_.map(a.list, a => a.cost))]);
          });
          if (chartType === 0) {
            $('#meter-usage-title').show().text('总用量：' + numberFormat(usageSum.toFixed(3)) + searchResult.unit);
          } else {
            $('#meter-cost-title').show().text('总费用：' + numberFormat(costSum.toFixed(3)) + '元');
          }
          flaga = 1;
        }
        series = getStackSeries(branchs, datas, flaga, chartType);
        break;
    }
    // 峰谷平柱状图
    let option = {
      tooltip: {
        trigger: "axis",
        formatter: function (datas) {
          let tooltip = getToolTipTitle(datas[0]) + '<br/>';
          let totalSum = _.sum(_.map(datas, a => a.value));
          _.each(datas, (data, index) => {
            tooltip += "<div style='width: 12px;height:12px;background-color: " + (chartType === 0 ? usageColor[index] : costColor[index]) + "; display: inline-block;margin-right: 10px'></div>" + data.seriesName + (chartType === 0 ? '用量：' : '费用：') +
              numberFormat(data.value.toFixed(3)) + (chartType === 0 ? searchResult.unit : '元') + '， 比例：' + ((data.value / totalSum) * 100).toFixed(3) + '%' + '<br/>';
          });
          tooltip += (chartType === 0 ? '用量' : '费用') + '总计：' + numberFormat(totalSum.toFixed(3)) + (chartType === 0 ? searchResult.unit : '元');
          return tooltip;
        },
        padding: [5, 5, 5, 10]
      },
      legend: {
        itemHeight: 15,
        data: [],
      },
      grid: {
        left: 0,
        bottom: 20
      },
      xAxis: {
        data: xAxisData,
        show: true,
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        splitLine: {
          show: false,
        },
        position: 'left'
      },
      series: series
    };
    let meterFgpChart = echarts.init(document.getElementById(chartDom), e_macarons);
    meterFgpChart.setOption(option, true);
    meterFgpChart.resize();
    window.addEventListener('resize', function () {
      meterFgpChart.resize();
    });
    $('#fgp-tab').on('click', function () {
      meterFgpChart.resize();
    });
  };
  let generateMeterFgpPieChart = function (chartDom, fgpDatas, dateArray, dateType, chartType, title) {
    let datas = [];
    let seriesColor = [];
    let branchs = _.orderBy(_.map(fgpDatas, a => a.name), a => a, 'asc');
    let legend = [];
    let totalSum = 0;
    _.each(fgpDatas, fgp => totalSum = _.sum([totalSum, _.sum(_.map(fgp.list, a => chartType === 0 ? a.data : a.cost))]));
    _.each(branchs, (key, index) => {
      let fgp = _.find(fgpDatas, a => a.name === key);
      if (fgp && fgp.list) {
        let itemValue = (_.sum(_.map(fgp.list, a => chartType === 0 ? a.data : a.cost))).toFixed(3);
        data = {
          name: `${key}：${((parseFloat(itemValue) / totalSum) * 100).toFixed(2)}%`,
          value: itemValue
        };
        datas.push(data);
        legend.push(data.name);
        seriesColor.push(chartType === 0 ? usageColor[index] : costColor[index]);
      }
    });

    //详情最下面两个饼图
    let option = {
      title: {
        subtext: title,
        x: 'left',
        left: '20%'
      },
      tooltip: {
        trigger: 'item',
        formatter: function (data) {
          return `${data.seriesName} <br/>${data.name} (${numberFormat(data.value)}` + (chartType === 0 ? searchResult.unit : '元') + ")";
        },
        padding: [5, 5, 5, 10]
      },
      legend: {
        // orient: 'vertical',
        left: '5%',
        top: '65%',
        width: '90%',
        data: legend,
        itemHeight: 13,
        itemWidth: 15
      },
      calculable: true,
      series: [{
        name: title,
        type: 'pie',
        radius: '50%',
        center: ['40%', '40%'],
        label: {
          normal: {
            position: 'inner'
          }
        },
        itemStyle: {
          normal: {
            label: {
              show: false
            }
          }
        },
        data: datas,
        color: seriesColor
      }]
    };
    let meterPieChart = echarts.init(document.getElementById(chartDom), e_macarons);
    meterPieChart.setOption(option, true);
    meterPieChart.resize();
    window.addEventListener('resize', function () {
      meterPieChart.resize();
    });
  };
  let generatePieChart = function (showColor = false) {
    let datas = [];
    let legends = [];
    _.each(searchResult.datas, (data, index) => {
      let sumVal = {
        name: data.meter_name,
        value: data.sum_val ? data.sum_val : 0,
      };
      if (showColor) {
        sumVal.pieColor = sortColor[index];
      }
      datas.push(sumVal);
      legends.push({
        name: data.meter_name,
        isChecked: true
      });
    });
    let none = '';
   let option = generatePieForAggregateData(legends ,none, datas, searchResult.unit, '能耗对比', showColor);
    if (analysisChart) analysisChart.clear();
    // 仪表详情 增加对比表饼图 实例化
    analysisChart = echarts.init(document.getElementById('chart-instance'), e_macarons);
    analysisChart.setOption(option, true);
    analysisChart.resize();
    window.addEventListener('resize', function () {
      analysisChart.resize();
    });
  };
  let generateComparisonData = function (meterAndParaMap, resultData, type) {
    let data = {
      comparisonList: resultData,
      type
    };
    _.each(data.comparisonList, a => {
      let map = _.find(meterAndParaMap, m => m.mfid === a.mfid);
      a.meter_name = map ? map.name : '--';
      a.sum_val = _.isString(a.sum_val) ? a.sum_val : (_.isNumber(a.sum_val) && _.toLower(a.sum_val) !== 'infinity') ? numberFormat(a.sum_val.toFixed(2)) : '--';
      a.sum_per = _.isString(a.sum_per) ? a.sum_per : (_.isNumber(a.sum_per) && _.toLower(a.sum_per) !== 'infinity') ? numberFormat(a.sum_per.toFixed(2)) : '--';
      a.all_avg_val = _.isString(a.all_avg_val) ? a.all_avg_val : (_.isNumber(a.all_avg_val) && _.toLower(a.all_avg_val) !== 'infinity') ? numberFormat(a.all_avg_val.toFixed(2)) : '--';
      a.avg_val = _.isString(a.avg_val) ? a.avg_val : (_.isNumber(a.avg_val) && _.toLower(a.avg_val) !== 'infinity') ? numberFormat(a.avg_val.toFixed(2)) : '--';
      a.max_val = _.isString(a.max_val) ? a.max_val : (_.isNumber(a.max_val) && _.toLower(a.max_val) !== 'infinity') ? numberFormat(a.max_val.toFixed(2)) : '--';
      a.min_val = _.isString(a.min_val) ? a.min_val : (_.isNumber(a.min_val) && _.toLower(a.min_val) !== 'infinity') ? numberFormat(a.min_val.toFixed(2)) : '--';
      a.upper_limit = a.rule ? (a.rule.UpperLimit ? ((_.isNumber(a.rule.UpperLimit) && _.toLower(a.rule.UpperLimit) !== 'infinity') ? numberFormat(a.rule.UpperLimit.toFixed(2)) : '--') : '--') : '--';
      a.lower_limit = a.rule ? (a.rule.LowerLimit ? ((_.isNumber(a.rule.LowerLimit) && _.toLower(a.rule.LowerLimit) !== 'infinity') ? numberFormat(a.rule.LowerLimit.toFixed(2)) : '--') : '--') : '--';
    });
    if (type === 0) $('.no-show-in').show();
    else $('.no-show-in').hide();
    let templateHtml = template('comparison-table-body-template', data);
    $('#comparison-table-body').html(templateHtml);
  };
  let areaWindowInteractive = function () {
    $('#area-zone').show();
    $('#meter-zone').hide();
    $('.func-tab').hide();
    $('#onshowmeterinfo').hide();
    $('.content-footer').hide();
    $('.module-container').show();
    $('.comparison-tab').hide();
  };
  let meterWindowInteractive = function () {
    $('#area-zone').hide();
    $('#meter-zone').show();
    $('.func-tab').show();
    $('#onshowmeterinfo').show();
    $('.content-footer').show();
    $('.module-container').hide();
    $('.area-fgp').hide();
    if (ifShowPieChart()) $('.comparison-tab').show();
  };
  let bindingMeterTree = function (selector) {
    $(selector).jstree({
      "core": {
        "multiple": false,
        "themes": {
          "responsive": false
        },
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
      "plugins": ["types", "crrm"]
    }).on('loaded.jstree', function (e, data) {
      let instance = data.instance;
      let target = instance.get_node(e.target.firstChild.firstChild.lastChild);
      instance.open_node(target);
    }).on("select_node.jstree", function (e, data) {
      let node = data.node.original;
      if (node.modeltype !== 'area') {
        if (areaConfigureMeters.length === 0) {
          areaConfigureMeters.push(node);
        } else {
          let head = _.head(areaConfigureMeters);
          let energyType = head.EnergyCode;
          if (energyType !== node.EnergyCode) {
            toastr.warning('只能配置同一种能源类型的仪表，请重新选择');
            return;
          }
          let exist = _.find(areaConfigureMeters, a => a.id === node.id);
          if (exist) {
            toastr.warning('同一个仪表只能选择一次');
            return;
          }
          areaConfigureMeters.push(node);
        }
        bindSelectedMeterList();
      }
    });
  };
  let bindSelectedMeterList = function () {
    let data = {
      selectedMeterList: areaConfigureMeters
    };
    let templateHtml = template('selected-meter-list-template', data);
    $('.open .meter-list').html(templateHtml);
    setTimeout(() => {
      $('.open .meter-list .select-meter-item>input').on('click', function (e) {
        e.stopPropagation();
        let currentDom = e.currentTarget;
        $(currentDom).parent().remove();
        let id = $(currentDom).attr('data-id');
        _.remove(areaConfigureMeters, a => a.id === id);
      });
    }, 100);
  }
  let loadAreaDetailPage = function () {
    if (areaSubscribeModule.length <= 0) {
      $('.area-no-data').show();
      $('.area-detail-container').hide();
      $('.area-fgp').hide();
      $('.content-footer').hide();
      return;
    }
    $('.area-no-data').hide();
    $(window).resize();
    let fgp = _.find(areaSubscribeModule, a => a.key === '_AreaFgpStatistics');
    if (fgp) {
      $('.area-fgp').show();
      if ($('.content-right').prop('scrollHeight') > $('.content-right').prop('clientHeight'))
        $('.content-footer').show();
      else $('.content-footer').hide();
    } else {
      $('.area-fgp').hide();
      $('.content-footer').hide();
    }
    let moduleData = _.find(areaSubscribeModule, a => a.key === '_AreaStatistics');
    if (moduleData) {
      $('.area-detail-container').show();
      $('.content-footer').show();
    } else {
      $('.area-detail-container').hide();
      if ($('.content-right').prop('scrollHeight') > $('.content-right').prop('clientHeight'))
        $('.content-footer').show();
      else $('.content-footer').hide();
    }
    searchAreaData();
  };
  let showModuleConfigureModal = function () {
    $('.configure-header>.binding-data').removeClass('layui-this');
    $('.binding-data>span').removeClass('finish');
    $('.page-binding-data').hide();
    $('.page-configure-func').show();
    $('#dialog_content').dialogModal({
      onOkBut: function () {
        if (areaSubscribeModule.length <= 0 && areaConfigure.id) {
          esdpec.framework.core.doDeleteOperation('dataanalysis/delareafun', {
            id: areaConfigure.id
          }, function (response) {
            if (response.IsSuccess) {
              areaSubscribeModuleClone = [];
              areaConfigureMeters = [];
              areaConfigureMetersClone = [];
              esdpec.framework.core.getJsonResult('dataanalysis/getareafun?areaId=' + currentSelectedNode.id, function (response) {
                if (response.IsSuccess) {
                  areaSubscribeModule = response.Content.fun_code ? JSON.parse(response.Content.fun_code) : [];
                  areaSubscribeModuleClone = _.cloneDeep(areaSubscribeModule);
                  let meterAndMfidMapStr = response.Content.meterid_mfid_map || '';
                  let meterAndMfidMap = meterAndMfidMapStr.split(';');
                  let meterIds = [];
                  let mfIds = [];
                  _.each(meterAndMfidMap, m => {
                    if (m === '') return true;
                    let meterMfid = m.split(',');
                    meterIds.push(meterMfid[0]);
                    mfIds.push(meterMfid[1]);
                  });
                  areaConfigureMeters = meterIds.length > 0 ? _.filter(meterDataList, a => _.includes(meterIds, a.id)) : [];
                  areaConfigureMetersClone = _.cloneDeep(areaConfigureMeters);
                  areaConfigure = response.Content;
                  areaConfigure.mfIds = mfIds;
                  areaConfigure.meterIds = meterIds;
                  loadAreaDetailPage();
                }
              });
            }
          });
          return;
        }
        if (areaConfigureMeters.length <= 0) {
          toastr.warning('请绑定仪表数据');
          return false;
        }
        let areaInfo = {
          id: areaConfigure.id,
          area_id: currentSelectedNode.id,
          is_all_area: $('.open #select-usage').val() === '1' ? true : false,
          meter_ids: _.join(_.map(areaConfigureMeters, a => a.id), ','),
          fun_code: JSON.stringify(areaSubscribeModule)
        };
        esdpec.framework.core.doPostOperation('dataanalysis/saveareafun', areaInfo, function (response) {
          if (response.IsSuccess) {
            esdpec.framework.core.getJsonResult('dataanalysis/getareafun?areaId=' + currentSelectedNode.id, function (response) {
              if (response.IsSuccess) {
                areaSubscribeModule = response.Content.fun_code ? JSON.parse(response.Content.fun_code) : [];
                areaSubscribeModuleClone = _.cloneDeep(areaSubscribeModule);
                let meterAndMfidMapStr = response.Content.meterid_mfid_map || '';
                let meterAndMfidMap = meterAndMfidMapStr.split(';');
                let meterIds = [];
                let mfIds = [];
                _.each(meterAndMfidMap, m => {
                  if (m === '') return true;
                  let meterMfid = m.split(',');
                  meterIds.push(meterMfid[0]);
                  mfIds.push(meterMfid[1]);
                });
                areaConfigureMeters = meterIds.length > 0 ? _.filter(meterDataList, a => _.includes(meterIds, a.id)) : [];
                areaConfigureMetersClone = _.cloneDeep(areaConfigureMeters);
                areaConfigure = response.Content;
                areaConfigure.mfIds = mfIds;
                areaConfigure.meterIds = meterIds;
                loadAreaDetailPage();
              }
            });
          }
        });
      },
      onCancelBut: function () {
        areaSubscribeModule = _.cloneDeep(areaSubscribeModuleClone);
        areaConfigureMeters = _.cloneDeep(areaConfigureMetersClone);
      },
      onLoad: function () {
        setTimeout(() => {
          $('.open .dialogModal_content ul.layui-tab-title>li').on('click', function (e) {
            e.stopPropagation();
            let currentDom = e.currentTarget;
            let id = $(currentDom).attr('data-id');
            if (id === 'configure-func') {
              $('.binding-data').removeClass('layui-this');
              $('.binding-data>span').removeClass('finish');
              $('.page-configure-func').show();
              $('.page-binding-data').hide();
              $('.layui-tab-content').removeClass('tab-content');
            } else if (id === 'binding-data') {
              $('.binding-data').addClass('layui-this');
              $('.binding-data>span').addClass('finish');
              $('.page-configure-func').hide();
              $('.page-binding-data').show();
              if ($('.open .meter-tree').html() === '')
                bindingMeterTree('.open .meter-tree');
              bindSelectedMeterList();
              $('.layui-tab-content').addClass('tab-content');
            }
          });
          $('.open .func-list>div').on('click', function (e) {
            e.stopPropagation();
            let currentDom = e.currentTarget;
            let currentModule = $(currentDom).children().first().children().first();
            let key = $(currentDom).attr('data-key');
            let name = $(currentDom).attr('data-value');
            if (currentModule.prop('checked') || currentModule.prop('checked') === 'checked') {
              currentModule.prop('checked', false);
              currentModule.removeAttr('checked');
              _.remove(areaSubscribeModule, a => a.key === key);
            } else {
              currentModule.prop('checked', 'checked');
              areaSubscribeModule.push({
                key,
                name
              });
            }
          });
          if (areaSubscribeModule.length > 0) {
            let isData = _.find(areaSubscribeModule, a => a.key === '_AreaStatistics');
            if (isData) {
              $('.open #module-data').prop('checked', 'checked');
            } else {
              $('.open #module-data').removeAttr('checked');
            }
            let isFgp = _.find(areaSubscribeModule, a => a.key === '_AreaFgpStatistics');
            if (isFgp) {
              $('.open #peak-summary').prop('checked', 'checked');
            } else {
              $('.open #peak-summary').removeAttr('checked');
            }
          }
          let option = areaConfigure.is_all_area ? 1 : 0;
          $(".open #select-usage option[value='" + option + "']").attr("selected", true);
        }, 150);
      },
      onClose: function () {
        areaSubscribeModule = _.cloneDeep(areaSubscribeModuleClone);
        areaConfigureMeters = _.cloneDeep(areaConfigureMetersClone);
      },
    });
  };
  //分项占比&能耗对比 option数据
  let generatePieForAggregateData = (xAxisData,selected, seriesData, unit, tooltip = '能耗对比', showLegend = false) => {
    let orderLegend = _.orderBy(xAxisData, a => a.name, 'asc');
    let _selected = {};
      _selected = selected
      let option = {
      color: sortColor,
      title: {
        show: true,
        subtext: '单位：' + unit,
        padding: [-6, 0, 0, 0],
        left: 20,
        top:10
      },
      tooltip: {
        trigger: 'item',
        formatter: function (data) {
          return `${data.seriesName} <br/>${data.name} : ${numberFormat(data.value)} (${data.percent}%)`;
        }
      },
      legend: {
        show: $('.comparsion-right')[0].children.length > 0? true: false,
        // type: 'scroll',
        orient: 'vertical',
        right: '5%',
        bottom: '10%',
        height: '80%',
        width: '20%',
        itemHeight: 13,
        itemWidth:15,
        data: orderLegend,
        selected: _selected
      },
      series: [{
        name: tooltip,
        type: 'pie',
        center: ['50%', '50%'],
        radius: '80%',
        padding: [10, 10, 100, 10],
        label: {
          normal: {
            show: false,
            position: 'inner'
          }
        },
        data: _.each(seriesData, a => a.value = _.replace(a.value, ',', '')),
        itemStyle: {
          normal: {
            label: {
              show: true,
              formatter: function (data) {
                return `${numberFormat(data.value)} (${data.percent}%)`;
              }
            }
          },
          emphasis: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
    // console.log(getChartType())
    if(getChartType() == 'pie'){
      $('.chart-legend').hide();
    }else{
      $('.chart-legend').show();
    }
    if(getChartType() != 'bar'){
      $('.on-off-button').hide();
    }else{
      $('.on-off-button').show();
    }
    return option;
  };
  let reloadMeterChartData = function () {
    let currentSelectedParameters = _.filter(currentMeterParameters, a => a.isChecked);
    let parameter = _.head(currentSelectedParameters);
    let dateType = getSearchDateType();
    let searchDateType = dateType === -1 ? 2 : dateType;
    let searchParaType = dateType === -1 ? 1 : parameter.type;
    let defaultTimeStr = getDefaultSTimeAndETime(searchDateType);
    let timeArray = defaultTimeStr.split(' -- ');
    let sTime = timeArray[0];
    let eTime = timeArray[1];
    let mfids = _.map(currentSelectedParameters, a => a.id);
    let uriparam = `mfids=${_.join(mfids, ',')}&paraType=${searchParaType}&dateType=${searchDateType}&sTime=${sTime}&eTime=${eTime}`;
    esdpec.framework.core.getJsonResult('dataanalysis/getdata?' + uriparam, function (response) {
      if (response.IsSuccess) {
        let chartLegend = [];
        let chartXaxisData = [];
        let checkedParameters = _.filter(currentMeterParameters, p => _.includes(mfids, p.id));
        chartLegend = _.map(checkedParameters, a => a.name);
        chartXaxisData = searchParaType === 0 ? getXAxisData(dateType, sTime, eTime) : getOriginalXAxisData(response.Content.data_list);
        let datas = searchParaType === 0 ? [response.Content] : response.Content.data_list;
        searchResult = {
          unit: parameter.unit,
          chartLegend,
          chartXaxisData,
          datas,
          checkedParameters
        };
        assembleChartComponent(parameter.unit, chartLegend, chartXaxisData, datas, checkedParameters, 'chart-instance', getChartType());
      }
    });
  };
  let reloadExceptionGraphData = function () {
    let dateType = getSearchDateType();
    let searchDateType = dateType === -1 ? 2 : dateType;
    let defaultTimeStr = getDefaultSTimeAndETime(searchDateType);
    let dateArray = defaultTimeStr.split(' -- ');
    let parameters = _.filter(currentMeterParameters, a => a.isChecked);
    let mfids = _.head(parameters);
    let uriparam = `mfid=${mfids.id}&sTime=${dateArray[0]}&eTime=${dateArray[1]}`;
    esdpec.framework.core.getJsonResult('abnormaldata/getdata?' + uriparam, function (response) {
      if (response.IsSuccess) {
        if (response.Content.length > 0) {
          let exceptionDatas = [];
          _.each(response.Content, a => {
            exceptionDatas.push({
              val: a.val,
              cost: 0,
              date: a.time,
              isChecked: false
            });
          });
          loadExceptionDataIntoGraphData(exceptionDatas);
        }
      }
    });
  };
  let loadExceptionDataIntoGraphData = function (datas) {
    let currentSelectedParameters = _.filter(currentMeterParameters, a => a.isChecked);
    if (currentSelectedParameters.length <= 0) return;
    let data = {
      selectedParameterList: currentSelectedParameters
    };
    let head = _.head(data.selectedParameterList);
    let originalList = _.find(searchResult.datas, item => item.mfid === head.id);
    let graphData = originalList ? originalList.now_data_list || [] : [];
    _.each(graphData, a => a.isChecked = true);
    let graphList = _.uniqBy(_.concat(graphData, datas), a => a.date); // _.merge(graphData, datas);
    _.each(graphList, a => {
      a.val = numberFormat(a.val)
    });
    let originalDatas = {
      data: {
        mfid: head.id,
        unit: head.unit,
        type: head.type,
        graphDataList: _.orderBy(graphList, a => a.date, 'asc')
      }
    }
    let originalDataHtml = template('graph-table-template', originalDatas);
    $('#graph-table').html(originalDataHtml);
    setTimeout(() => {
      $('.switch-box input.exception-switch').on('click', function (e) {
        e.stopPropagation();
        let currentDom = e.currentTarget;
        let id = $(currentDom).attr('data-id');
        let date = $(currentDom).attr('data-date');
        let exceptionItem = {
          mfid: id,
          time: date,
          val: 0
        }
        if ($(currentDom).is(':checked')) {
          $(currentDom).parent().parent().parent().parent().removeClass('shouldremove');
          esdpec.framework.core.doPostOperation('abnormaldata/cancelsingledata', exceptionItem, function (response) {
            if (response.IsSuccess) {
              reloadMeterChartData();
            }
          });
        } else {
          $(currentDom).parent().parent().parent().parent().addClass('shouldremove');
          esdpec.framework.core.doPostOperation('abnormaldata/savesingledata', exceptionItem, function (response) {
            if (response.IsSuccess) {
              reloadMeterChartData();
            }
          });
        }
      });
      let exception = $('.graph-data .exception-manager');
      if (exception.attr('data-toggle') === 'open') $('.inException').show();
      else $('.inException').hide();
    }, 300);
  };
  let generateExceptionHistory = function (historyList, mfid) {
    let totalSize = historyList.total_size || 0;
    let historyDatas = historyList.list;
    let data = {
      historyDatas
    };
    let templateHtml = template('exception-data-list-body-template', data);
    $('.open .exception-data-list-body').html(templateHtml);
    setTimeout(() => {
      let totalPage = Math.ceil(totalSize / 15);
      let currentPage = parseInt($('.open .currentPage').text());
      if (currentPage === 1) {
        $('.open #pre-btn').addClass('disable-btn');
      } else {
        $('.open #pre-btn').removeClass('disable-btn');
      }
      if (currentPage === totalPage) {
        $('.open #next-btn').addClass('disable-btn');
      } else {
        $('.open #next-btn').removeClass('disable-btn');
      }
      $('.open #totalSize').text(totalSize);
      $('.open .totalPage').text(totalPage);
      $('.open #pre-btn').on('click', function (e) {
        e.stopPropagation();
        if (!operateBefore() || currentPage === 1) return;
        currentPage -= 1;
        $('.open .currentPage').text(currentPage);
        esdpec.framework.core.getJsonResult('abnormaldata/getdatabypage?mfid=' + mfid + '&pagenum=' + currentPage, function (response) {
          if (response.IsSuccess) {
            generateExceptionHistory(response.Content, mfid);
          }
        });
      });
      $('.open #next-btn').on('click', function (e) {
        e.stopPropagation();
        if (!operateBefore() || currentPage === totalPage) return;
        currentPage += 1;
        $('.open .currentPage').text(currentPage);
        esdpec.framework.core.getJsonResult('abnormaldata/getdatabypage?mfid=' + mfid + '&pagenum=' + currentPage, function (response) {
          if (response.IsSuccess) {
            generateExceptionHistory(response.Content, mfid);
          }
        });
      });
    }, 300);
  };
  let isParentNode = (parentId, nodeId) => {
    let node = _.find(meterDataList, a => a.id === nodeId);
    let parent = node.parent;
    if (parentId === parent) return true;
    if (parent === '#') return false;
    isParentNode(parentId, parent);
  };
  let checkElementInVisiable = () => {
    if ($(window).scrollTop() > ($('#list-body').offset().top + $('#list-body').outerHeight() - 50)) {
      $('.param-position>.list-body').removeClass('hidden');
      $('.param-position').addClass('mTop');
    } else {
      $('.param-position').removeClass('mTop');
      $('.param-position>.list-body').addClass('hidden');
    }
  };
  let loadAreaAlarmTable = (pageNo, level) => {
    esdpec.framework.core.getJsonResult(`alarmcenter/getareameterdata?pageIndex=${pageNo}&areaId=${currentSelectedNode.id}&warnLevel=${level}`, function (response) {
      if (response.IsSuccess) {
        areaTotalRecord = response.Remark;
        $('.alarm-device-count').text(areaTotalRecord);
        let data = {
          deviceAlarmList: response.Content || []
        };
        if (areaTotalRecord === '0') {
          $('#area-alarm').addClass('disabled').attr('disabled', 'disabled');
        } else {
          $('#area-alarm').removeClass('disabled').removeAttr('disabled');
        }
        _.each(data.deviceAlarmList, a => {
          a.LastAlarmTime = _.replace(a.LastAlarmTime.substring(0, 19), 'T', ' ');
          a.alarmType = alarmTypeEnum[a.AlarmTypeEnum];
          a.isChecked = false;
          a.CollectValue = a.Value === '' ? '--' : numberFormat(parseFloat(a.Value).toFixed(3));
          a.percent = (a.OnWarnValue === '' || a.OnWarnValue === "0") ? '--' : numberFormat((a.Value * 100 / a.OnWarnValue).toFixed(3)) + '%'; //fixed bugs
          if (a.AlarmTypeEnum === 8) {
            a.Value = '--';
            a.PreWarnValue = '--';
            a.OnWarnValue = '--';
            a.percent = '--';
          }
        });
        areaAlarmList = data;
        let templateHtml = template('device-alarm-list-template', data);
        $('#device-alarm-list').html(templateHtml);
        layui.use('laypage', function () {
          let laypage = layui.laypage;
          laypage.render({
            elem: 'paging-device',
            count: areaTotalRecord,
            curr: pageNo,
            layout: ['count', 'prev', 'page', 'next', 'skip'],
            jump: function (page, first) {
              if (!first) loadAreaAlarmTable(page.curr, level);
            }
          });
        });
        setTimeout(() => {
          //查看详情
          $("#device-alarm-list .link").off('click').on('click', function (e) {
            e.stopPropagation(e);
            let meterId = $(e.currentTarget).attr('data-id');
            currentSelectedNodeBak = _.cloneDeep(currentSelectedNode);
            let treeInstance = $('#metertree').jstree(true);
            treeInstance.deselect_node(treeInstance.get_selected(true));
            treeInstance.select_node(treeInstance.get_node(meterId));
            backSource = 'alarm-detail';
          });
          $('#device-alarm-list .device-chk').on('click', function (e) {
            e.stopPropagation();
            let mId = $(e.currentTarget).attr('data-id');
            let node = _.find(areaAlarmList.deviceAlarmList, a => a.MeterId === mId);
            if (node.isChecked) {
              $(e.currentTarget).children().first().prop('checked', false);
              node.isChecked = false;
              let exists = _.find(areaAlarmList.deviceAlarmList, a => a.isChecked);
              if (!exists) $('#select-all').prop('checked', false);
            } else {
              $(e.currentTarget).children().first().prop('checked', true);
              node.isChecked = true;
            }
          });
        }, 300);
      }
    });
  };
  //加载区域报警
  let loadAreaAlarmPage = () => {
    $('#alarm-all').prop('checked', true);
    $('#select-all').prop('checked', false);
    $('.area__meter').html(' - 区域报警中心');
    $('.detail').html(' - 区域数据详情');
    esdpec.framework.core.getJsonResult('alarmcenter/getareametercount?areaId=' + currentSelectedNode.id, function (response) {
      if (response.IsSuccess) {
        let responseObj = JSON.parse(response.Content);
        let areaAlarmData = {
          data: responseObj
        };
        let templateHtml = template('area-exception-info-template', areaAlarmData);
        $('.area-alarm-info').html(templateHtml);
      }
    });
    loadAreaAlarmTable(1, 4);
    $('.alarm-device-filter .chk').on('click', function (e) {
      e.stopPropagation();
      let id = $(e.currentTarget).attr('data-id');
      $('.alarm-device-filter .chk input').prop('checked', false);
      let input = $(e.currentTarget).children().first();
      input.prop('checked', true);
      $('#select-all').prop('checked', false);
      switch (id) {
        case 'sa':
          loadAreaAlarmTable(1, 4);
          break;
        case 'ofl':
          loadAreaAlarmTable(1, 2);
          break;
        case 'yj':
          loadAreaAlarmTable(1, 0);
          break;
        case 'bj':
          loadAreaAlarmTable(1, 1);
          break;
      }
    });
    $('.exception-operate-box>input.btn').off('click').on('click', function (e) {
      e.stopPropagation();
      if (!operateBefore()) return;
      let id = $(e.currentTarget).attr('id');
      let mIds = _.map(_.filter(areaAlarmList.deviceAlarmList, a => a.isChecked), b => b.MeterId);
      let type = $('.alarm-device-filter .chk>input:checked').val();
      if (mIds.length <= 0) {
        toastr.warning('请先选择要操作的仪表设备');
        return;
      }
      switch (id) {
        case 'area-alarm':
          $('#area-alarm-modal').dialogModal({
            onOkBut: function () {
              let dealReason = $('.open .radio-grp .opt input:checked').val();
              let dealObj = {
                MeterIds: mIds,
                AlarmDealStatus: 1,
                AlarmDealReason: !dealReason ? $('.open #other-reason').val() : dealReason,
                AlarmDealReasonDetail: $('.open .area-alarm-modal-textarea').val()
              };
              esdpec.framework.core.doPutOperation('alarmcenter/updatealarmdatarelease', dealObj, function (response) {
                if (response.IsSuccess) {
                  loadAreaAlarmTable(1, parseInt(type));
                }
              });
            },
            onCancelBut: function () {},
            onLoad: function () {
              setTimeout(() => {
                $('.open #r1').prop('checked', true);
                $('.open .radio-grp .opt').on('click', function (e) {
                  e.stopPropagation();
                  let currentDom = e.currentTarget;
                  $('.open .radio-grp .opt input').prop('checked', false);
                  $(currentDom).children().first().prop('checked', true);
                  $('.open #other-reason').prop('checked', false);
                  $('.open .area-alarm-modal-textarea').val('').prop('readonly', true);
                });
                $('.open .area-alarm-modal-textarea').on('input', function (e) {
                  e.stopPropagation();
                  if (e.currentTarget.value.length > 30) {
                    e.currentTarget.value = e.currentTarget.value.substring(0, 30);
                    return;
                  }
                  $('.open .len-limit').text(e.currentTarget.value.length + '/30');
                });
                $('.open .other-reason').on('click', function (e) {
                  e.stopPropagation();
                  $('.open .radio-grp .opt input').prop('checked', false);
                  let currentDom = e.currentTarget;
                  $(currentDom).children().first().prop('checked', true);
                  $('.open .area-alarm-modal-textarea').prop('readonly', false).focus();
                });
              }, 300);
            },
            onClose: function () {},
          });
          break;
        case 'shield-device':
          $('#shield').prop('checked', true);
          $('#shield-time').prop('checked', false);
          layui.use(['layer', 'laydate'], function () {
            alarmlay = layui.layer;
            let laydate = layui.laydate;
            let setTop = function () {
              let that = this;
              alarmlay.open({
                type: 1,
                title: '屏蔽设置',
                area: ['560px', '260px'],
                shade: 0.6,
                content: $('#set-shield-modal'),
                btn: ['确定', '取消'],
                yes: function () {
                  $(that).click();
                  let time = $('#sheild-time-container').val();
                  let status = $('#shield').is(':checked') ? 1 : 2;
                  let sheildObj = {
                    MeterIds: mIds,
                    AlarmDealStatus: 2,
                    AlarmDealReason: 4,
                    AlarmDealReasonDetail: '',
                    MeterDealStatus: status,
                    StartTime: $('#shield').prop('checked') ? '1973-01-01 00:00:01' : time.split(' -- ')[0],
                    EndTime: $('#shield').prop('checked') ? "2099-12-31 23:59:59" : time.split(' -- ')[1]
                  };
                  esdpec.framework.core.doPutOperation('alarmcenter/updatealarmdatashield', sheildObj, function (response) {
                    if (response.IsSuccess) {
                      loadAreaAlarmTable(1, parseInt(type));
                      alarmlay.closeAll();
                    }
                  });
                },
                btn2: function () {
                  alarmlay.closeAll();
                },
                zIndex: alarmlay.zIndex,
                success: function (layero) {
                  laydate.render({
                    elem: '#sheild-time-container',
                    btns: ['confirm'],
                    range: '--',
                    format: 'yyyy-MM-dd HH:mm',
                    type: 'datetime',
                    trigger: 'click',
                    value: new Date().format('yyyy-MM-dd hh:mm') + ' -- ' + new Date().format('yyyy-MM-dd hh:mm'),
                    done: (value, date) => {},
                    end: function () {
                      $(".layui-layer-shade").remove();
                    }
                  });
                }
              });
            };
            setTop();
          });
          $('.device-shield-content .opt').on('click', function (e) {
            e.stopPropagation();
            $('.device-shield-content .opt input').prop('checked', false);
            $(e.currentTarget).children().first().prop('checked', true);
          });
          break;
      }
    });
    $('.device-list thead .opt').on('click', function (e) {
      e.stopPropagation();
      if ($('#select-all').prop('checked')) {
        $('#select-all').prop('checked', false);
        $('#device-alarm-list .device-chk input').prop('checked', false);
        _.each(areaAlarmList.deviceAlarmList, a => a.isChecked = false);
      } else {
        $('#select-all').prop('checked', true);
        $('#device-alarm-list .device-chk input').prop('checked', true);
        _.each(areaAlarmList.deviceAlarmList, a => a.isChecked = true);
      }
    });
  };
  let getWeekDateStr = repeatDate => {
    let repeatArray = repeatDate.split(',');
    let dateStr = '';
    _.each(repeatArray, a => {
      switch (a) {
        case '1':
          dateStr += '星期一、';
          break;
        case '2':
          dateStr += '星期二、';
          break;
        case '3':
          dateStr += '星期三、';
          break;
        case '4':
          dateStr += '星期四、';
          break;
        case '5':
          dateStr += '星期五、';
          break;
        case '6':
          dateStr += '星期六、';
          break;
        case '0':
          dateStr += '星期天、';
          break;
      }
    });
    return dateStr.substring(0, dateStr.length - 1);
  };
  //加载  报警条件设置
  let loadAlarmCondition = pageIndex => {
    esdpec.framework.core.getJsonResult('alarmcenter/getalarmruledata?meterId=' + currentSelectedNode.id + '&pageIndex=' + pageIndex, function (response) {
      if (response.IsSuccess) {
        // 报警条件总数
        let totalSize = parseInt(response.Remark);
        let data = {
          // 报警条件列表
          alarmConditionList: response.Content
        };
        _.each(data.alarmConditionList, a => {
          a.AlarmType = alarmTypeEnum[a.AlarmTypeEnum].substring(4);
          a.Validate = a.ValidStartTime.substring(11, 16) + ' -- ' + a.ValidEndTime.substring(11, 16);
          a.RepeatWeek = getWeekDateStr(a.RepeatDate);
        });
        let tempConditionList = data.alarmConditionList;
        let templateHtml = template('alarm-condition-template', data);
        $('.alarm-condition').html(templateHtml);
        for (var i = 0; i < tempConditionList.length; i++) {
          if (!tempConditionList[i].IsAlarmTemplate) {
            $("span.tempIcon_" + i).css('display', 'none');
          }
        }
        setTimeout(() => {
          $('.alarm-condition .con-oper-grp .con_enable').off('click').on('click', function (e) {
            e.stopPropagation();
            let id = $(e.currentTarget).attr('data-id');
            esdpec.framework.core.doPutOperation('alarmcenter/updatealarmruleenable', {
              Id: id,
              IsEnabled: !$('#c_' + id).is(':checked')
            }, function (response) {
              if (response.IsSuccess && response.Content) {
                if ($('#c_' + id).is(':checked')) $('#c_' + id).prop('checked', false);
                else $('#c_' + id).prop('checked', true);
                toastr.info('当前规则状态修改成功');
              }
            });
          });
          //编辑
          $('.alarm-condition .con-oper-grp .con_edit').off('click').on('click', function (e) {
            e.stopPropagation();
            let ruleId = _.replace(Math.random(), '.', '');
            let id = $(e.currentTarget).attr('data-id');
            let alarmName = $('#myAlarmName_' + id).text();
            let preWarnValue = $('#myPreValue_' + id).text();
            let onWarnValue = $('#myOnValue_' + id).text();

            function getItem(element) {
              return element.Id == id
            }
            let currItem = tempConditionList.find(getItem);
            let tempAlarmType = currItem.AlarmType;
            let data = {
              ruleId: ruleId,
              id: id,
              AlarmName: alarmName,
              meterFieldTypes,
              alarmTypeValueList,
              PreWarnValue: preWarnValue,
              OnWarnValue: onWarnValue,
              weekList: weekDayList
            };
            let newRow = template('new-rule-template', data);
            $(e.currentTarget).parents('tr').before(newRow).hide();
            // -------------------------------------
            setTimeout(() => {
              let tempInput = $('#' + ruleId + ' .fieldTd>.opt>input');
              let alarmTypeText = $('#' + ruleId + ' .alarmTypetd>.opt>input');
              let isTemplate = $('.tempIcon_' + id);
              for (var i = 0; i < tempInput.length; i++) {
                if ($(tempInput[i]).val() == currItem.BaseMeterFieldTypeId) {
                  $(tempInput[i]).prop('checked', 'checked');
                }
              }
              for (var i = 0; i < alarmTypeText.length; i++) {
                if ($(alarmTypeText[i]).next('label').text() == tempAlarmType) {
                  $(alarmTypeText[i]).prop('checked', 'checked');
                }
              }
              // $('.fieldTd>.opt').off('click').on('click', function (e) {
              //   e.stopPropagation();
              //   $('.fieldTd>.opt>input').prop('checked', false);
              //   let inputDom = $(e.currentTarget).children().first();
              //   let type = inputDom.attr('data-type');
              //   inputDom.prop('checked', true);
              //   if (type === '0') {
              //     $('#' + ruleId + '_1').removeAttr('disabled');
              //     $('#' + ruleId + '_2').removeAttr('disabled');
              //     $('#' + ruleId + '_3').removeAttr('disabled');
              //     $('#' + ruleId + '_4').removeAttr('disabled');
              //   } else {
              //     $('#' + ruleId + '_1').attr('disabled', 'disabled');
              //     $('#' + ruleId + '_2').attr('disabled', 'disabled');
              //     $('#' + ruleId + '_3').attr('disabled', 'disabled');
              //     $('#' + ruleId + '_4').attr('disabled', 'disabled');
              //     let alarmInput = $('.alarmTypetd>.opt>input:checked').val();
              //     if (alarmInput === '1' || alarmInput === '2' || alarmInput === '3' || alarmInput === '4')
              //       $('.alarmTypetd>.opt>input').prop('checked', false);
              //   }
              // });

              // $('.alarmTypetd>.opt').off('click').on('click', function (e) {
              //   e.stopPropagation();
              //   let alarmInput = $(e.currentTarget).children().first();
              //   let alarmVal = alarmInput.val();
              //   if (alarmVal == '0' || alarmVal == '5') {
              //     //可选
              //     $(this).parent('td').parent('tr').find('.validate-container').removeAttr('disabled');
              //     $(this).parent('td').parent('tr').find('.magic-checkbox').removeAttr('disabled');
              //   } else {
              //     $(this).parent('td').parent('tr').find('.validate-container').attr('disabled', 'disabled').val('');
              //     $(this).parent('td').parent('tr').find('.magic-checkbox').attr('disabled', 'disabled').prop('checked', false);
              //   }
              //   if (alarmInput.is(':disabled')) return;
              //   $('.alarmTypetd>.opt>input').prop('checked', false);
              //   alarmInput.prop('checked', true);
              // });

              // $('.weektd>.opt').off('click').on('click', function (e) {
              //   e.stopPropagation();
              //   let currentDom = e.currentTarget;
              //   let currentInput = $(currentDom).children().first();
              //   if ($(e.currentTarget).parent('td').parent('tr').find('.alarmTypetd>.opt>input:checked').val() == '0' || $(e.currentTarget).parent('td').parent('tr').find('.alarmTypetd>.opt>input:checked').val() == '5') {
              //     currentInput.prop('checked', !currentInput.is(':checked'));
              //   } else {
              //     currentInput.prop('checked', false);
              //   }
              // });

              $('.fieldTd>.opt').off('click').on('click', function (e) {
                e.stopPropagation();
                $('.fieldTd>.opt>input').prop('checked', false);
                let inputDom = $(e.currentTarget).children().first();
                let type = inputDom.attr('data-type');
                inputDom.prop('checked', true);
                $('.alarmTypetd>.opt').find('input').prop('checked',false);

                
            if (type === '0') {
              $('#' + ruleId + '_1').removeAttr('disabled');
              $('#' + ruleId + '_2').removeAttr('disabled');
              $('#' + ruleId + '_3').removeAttr('disabled');
              $('#' + ruleId + '_4').removeAttr('disabled');
              flag = true;
            } else {
              $('#' + ruleId + '_1').attr('disabled', 'disabled');
              $('#' + ruleId + '_2').attr('disabled', 'disabled');
              $('#' + ruleId + '_3').attr('disabled', 'disabled');
              $('#' + ruleId + '_4').attr('disabled', 'disabled');
              let alarmInput = $('.alarmTypetd>.opt>input:checked').val();
              if (alarmInput === '1' || alarmInput === '2' || alarmInput === '3' || alarmInput === '4'){
                $('.alarmTypetd>.opt>input').prop('checked', false);
              }
            }
              });
              $('.alarmTypetd>.opt').off('click').on('click', function (e) {
                e.stopPropagation();
                let alarmInput = $(e.currentTarget).children().first();
                let alarmVal = alarmInput.val();
                if (alarmVal == '0' || alarmVal == '5') {
                  //可选
                  $(this).parent('td').parent('tr').find('.validate-container').removeAttr('disabled');
                  $(this).parent('td').parent('tr').find('.magic-checkbox').removeAttr('disabled');
                  $('.validate-container').show();
                  $('.weektd .magic-checkbox').prop('checked', 'checked');
                  $('.validate-container').val('00:00 -- 23:59')
                  if (!$('div.enable_box').hasClass('hidden')) {
                    $('.enable_box').addClass('hidden');
                  }
                } else {
                  $(this).parent('td').parent('tr').find('.validate-container').attr('disabled', 'disabled').val('');
                  $(this).parent('td').parent('tr').find('.magic-checkbox').attr('disabled', 'disabled').prop('checked', false);
                  $('.validate-container').hide();
                  $('.enable_box').removeClass('hidden').attr('disabled', true)
                }
                if (alarmInput.is(':disabled')) return;
                $('.alarmTypetd>.opt>input').prop('checked', false);
                alarmInput.prop('checked', true);
              });
              $('.weektd>.opt').off('click').on('click', function (e) {
                e.stopPropagation();
                let currentDom = e.currentTarget;
                let currentInput = $(currentDom).children().first();

                currentInput.prop('checked', !$(currentInput)[0].checked);
                if (currentInput.prop('disabled')) {
                  currentInput.prop('checked', false);
                }
              });

              layui.use('laydate', function () {
                let laydate = layui.laydate;
                laydate.render({
                  elem: '.validate-container',
                  btns: ['confirm'],
                  range: '--',
                  format: 'HH:mm',
                  type: 'time',
                  value: currItem.Validate,
                });
              });

              function getRepeatWeek(j) {
                let repeatArray = j.split(',');
                return repeatArray;
              }
              let tempArr = getRepeatWeek(currItem.RepeatDate);
              let myTempInput = $('tr#' + ruleId + '>td.weektd>.opt>input');
              for (var j = 0; j < myTempInput.length; j++) {
                for (var i = 0; i < tempArr.length; i++) {
                  if ($(myTempInput[j]).val() == tempArr[i]) {
                    $(myTempInput[j]).prop('checked', 'checked');
                  }
                };
              }




              $('#ok_' + ruleId).off('click').on('click', function (e) {
                e.stopPropagation();
                let alarmName = $('#name_' + ruleId).val();
                if (alarmName === '') {
                  toastr.warning('请输入报警名称');
                  return;
                }
                let bmfId = $('#' + ruleId + ' .fieldTd>.opt>input:checked').val();
                let bmfType = $('#' + ruleId + ' .fieldTd>.opt>input:checked').attr('data-type');
                if (!bmfId) {
                  toastr.warning('请选择参数类型');
                  return;
                }
                let alarmType = $('#' + ruleId + ' .alarmTypetd>.opt>input:checked').val();
                if (!alarmType) {
                  toastr.warning('请选择报警类型');
                  return;
                }
                let rule = {
                  Id: currItem.Id,
                  BaseMeterFieldTypeId: bmfId,
                  AlarmName: alarmName,
                  AlarmTypeEnum: getAlarmType(bmfType, alarmType),
                  PreWarnValue: $('#prewarn_' + ruleId).val(),
                  OnWarnValue: $('#warn_' + ruleId).val(),
                  ValidStartTime: getValidate(ruleId).startTime,
                  ValidEndTime: getValidate(ruleId).endTime,
                  RepeatDate: getRepeatDateStr(ruleId),
                  IsEnabled: $('#enable_' + ruleId + '>input').is(':checked'),
                  IsAlarmTemplate: $('#tpl_' + ruleId + '>input').is(':checked'),
                }
                esdpec.framework.core.doPostOperation('alarmcenter/addalarmrule', rule, function (response) {
                  if (response.IsSuccess) {
                    loadAlarmCondition(1);
                  }
                })
              });
              if (currItem.IsAlarmTemplate) {
                $('#tpl_' + ruleId + '>input').prop('checked', 'checked');
              }
              if (currItem.IsEnabled) {
                $('#enable_' + ruleId + '>input').prop('checked', 'checked');
              }
              $('#tpl_' + ruleId).off('click').on('click', function (e) {
                e.stopPropagation();
                $('#tpl_' + ruleId + '>input').prop('checked', !$('#tpl_' + ruleId + '>input').is(':checked'));
              });
              $('#enable_' + ruleId).off('click').on('click', function (e) {
                e.stopPropagation();
                $('#enable_' + ruleId + '>input').prop('checked', !$('#enable_' + ruleId + '>input').is(':checked'));
              });
            }, 300);
            $('#cancel_' + ruleId).off('click').on('click', function (e) {
              e.stopPropagation();
              $('#' + ruleId).next().show();
              $(e.currentTarget).parents('tr').remove();
              if ($('.alarm-condition>tr').length <= 0)

                $('.alarm-condition').append('<tr class="alaram-condition-norecord"><td colspan="8" class="norecord-cell">未设置报警条件，点击右上方按钮添加</td></tr>');
            });
          });
          $('.alarm-condition .con-oper-grp .con_del').off('click').on('click', function (e) {
            e.stopPropagation();
            let currentDom = e.currentTarget;
            let id = $(currentDom).attr('data-id');
            $('#delete-confirm-modal').dialogModal({
              onOkBut: function () {
                esdpec.framework.core.doDeleteOperation('alarmcenter/deletealarmrule?alarmRuleId=' + id, {
                  alarmRuleId: id
                }, function (response) {
                  if (response.IsSuccess && response.Content) {
                    $('tr#' + id).remove();
                    esdpec.framework.core.getJsonResult('alarmcenter/getalarmruledata?meterId=' + currentSelectedNode.id + '&pageIndex=' + pageIndex, function (response) {
                      if (response.IsSuccess) {
                        totalSize = parseInt(response.Remark);
                        data.alarmConditionList = response.Content;
                        layui.use('laypage', function () {
                          let laypage = layui.laypage;
                          laypage.render({
                            elem: 'paging-alarm-condition',
                            count: totalSize,
                            curr: pageIndex,
                            layout: ['count', 'prev', 'page', 'next', 'skip'],
                            jump: function (page, first) {
                              loadAlarmCondition(page.curr);
                            }
                          });
                        });
                      }
                    })
                  }
                });
              },
              onCancelBut: function () {},
            });
          });
        }, 300);
        layui.use('laypage', function () {
          let laypage = layui.laypage;
          laypage.render({
            elem: 'paging-alarm-condition',
            count: totalSize,
            curr: pageIndex,
            layout: ['count', 'prev', 'page', 'next', 'skip'],
            jump: function (page, first) {
              if (!first) loadAlarmCondition(page.curr);
            }
          });
        });
      }
    });
  };
  //加载报警条件模板
  let loadAlarmTpl = (filterId, pageIndex) => {
    esdpec.framework.core.getJsonResult('alarmcenter/getalarmtemplatedata?energyId=' + filterId + '&pageIndex=' + pageIndex, function (response) {
      if (response.IsSuccess) {
        // 报警条件模板总数
        let totalSize = parseInt(response.Remark);
        // 报警模板详情
        let data = {
          alarmTplList: response.Content
        };
        _.each(data.alarmTplList, a => {
          a.alarmType = alarmTypeEnum[a.AlarmTypeEnum];
          a.validate = a.ValidEndTime.substring(11, 16) + ' -- ' + a.ValidStartTime.substring(11, 16);
          a.repeatChn = weekDayChn(a.RepeatDate);
        });
        var alarmTempList = data.alarmTplList;
        let templateHtml = template('alarm-tpl-template', data);
        $('.alarm-tpl').html(templateHtml);
        setTimeout(() => {
          $('.alarm-tpl div.enable_').off('click').on('click', function (e) {
            e.stopPropagation();
            let id = $(e.currentTarget).attr('data-id');
            esdpec.framework.core.doPutOperation('alarmcenter/updatealarmtemplateenable', {
              Id: id,
              IsEnabled: !$('#c_' + id).is(':checked')
            }, function (response) {
              if (response.IsSuccess && response.Content) {
                if ($('#c_' + id).is(':checked')) $('#c_' + id).prop('checked', false);
                else $('#c_' + id).prop('checked', true);
                toastr.info('当前规则状态修改成功');
              }
            });
          });
          $('.alarm-tpl div.edit_').off('click').on('click', function (e) {
            e.stopPropagation();
            let id = $(e.currentTarget).attr('data-id');
            let ruleId = _.replace(Math.random(), '.', '');
            let alarmName = $('#myAlarmName_' + id).text();
            let preWarnValue = $('#myPreValue_' + id).text();
            let onWarnValue = $('#myOnValue_' + id).text();

            function getItem(element) {
              return element.Id == id
            }
            var currItem = alarmTempList.find(getItem);
            let tempAlarmType = currItem.alarmType.split('：')[1];
            let data = {
              ruleId,
              id,
              AlarmName: alarmName,
              meterFieldTypes,
              alarmTypeValueList,
              PreWarnValue: preWarnValue,
              OnWarnValue: onWarnValue,
              weekList: weekDayList,
            };
            let newRow = template('new-rule-template', data);
            $(e.currentTarget).parents('tr').before(newRow).hide();
            // -------------------------------------
            setTimeout(() => {
              $('.alarm-tpl-operate>.opt:first-child').css('display', 'none')
              let tempInput = $('#' + ruleId + ' .fieldTd>.opt>input');
              let alarmTypeText = $('#' + ruleId + ' .alarmTypetd>.opt>input');
              for (var i = 0; i < tempInput.length; i++) {
                if ($(tempInput[i]).next('label').text() == currItem.Name) {
                  $(tempInput[i]).prop('checked', 'checked');
                }
              }
              for (var i = 0; i < alarmTypeText.length; i++) {
                if ($(alarmTypeText[i]).next('label').text() == tempAlarmType) {
                  $(alarmTypeText[i]).prop('checked', 'checked');
                }
              }
              $('.fieldTd>.opt').off('click').on('click', function (e) {
                e.stopPropagation();
                $('.fieldTd>.opt>input').prop('checked', false);
                let inputDom = $(e.currentTarget).children().first();
                let type = inputDom.attr('data-type');
                inputDom.prop('checked', true);
                if (type === '0') {
                  $('#' + ruleId + '_1').removeAttr('disabled');
                  $('#' + ruleId + '_2').removeAttr('disabled');
                  $('#' + ruleId + '_3').removeAttr('disabled');
                  $('#' + ruleId + '_4').removeAttr('disabled');
                } else {
                  $('#' + ruleId + '_1').attr('disabled', 'disabled');
                  $('#' + ruleId + '_2').attr('disabled', 'disabled');
                  $('#' + ruleId + '_3').attr('disabled', 'disabled');
                  $('#' + ruleId + '_4').attr('disabled', 'disabled');
                  let alarmInput = $('.alarmTypetd>.opt>input:checked').val();
                  if (alarmInput === '1' || alarmInput === '2' || alarmInput === '3' || alarmInput === '4')
                    $('.alarmTypetd>.opt>input').prop('checked', false);
                }
              });
              $('.alarmTypetd>.opt').off('click').on('click', function (e) {
                e.stopPropagation();
                let alarmInput = $(e.currentTarget).children().first();
                if (alarmInput.is(':disabled')) return;
                $('.alarmTypetd>.opt>input').prop('checked', false);
                alarmInput.prop('checked', true);
              });
              layui.use('laydate', function () {
                let laydate = layui.laydate;
                laydate.render({
                  elem: '.validate-container',
                  btns: ['confirm'],
                  range: '--',
                  format: 'HH:mm',
                  type: 'time',
                  value: currItem.validate,
                });
              });

              function getRepeatWeek(j) {
                let repeatArray = j.split(',');
                return repeatArray;
              }
              let tempArr = getRepeatWeek(currItem.RepeatDate);
              let myTempInput = $('tr#' + ruleId + '>td.weektd>.opt>input');
              for (var j = 0; j < myTempInput.length; j++) {
                for (var i = 0; i < tempArr.length; i++) {
                  if ($(myTempInput[j]).val() == tempArr[i]) {
                    $(myTempInput[j]).prop('checked', 'checked');
                  }
                };
              }

              $('.weektd>.opt').off('click').on('click', function (e) {
                e.stopPropagation();
                let currentDom = e.currentTarget;
                let currentInput = $(currentDom).children().first();
                if ($(e.currentTarget).parent('td').parent('tr').find('.alarmTypetd>.opt>input:checked').val() == '0' || $(e.currentTarget).parent('td').parent('tr').find('.alarmTypetd>.opt>input:checked').val() == '5') {
                  currentInput.prop('checked', !currentInput.is(':checked'));
                } else {
                  currentInput.prop('checked', false);
                }
              });

              $('#ok_' + ruleId).off('click').on('click', function (e) {
                e.stopPropagation();
                let alarmName = $('#name_' + ruleId).val();
                if (alarmName === '') {
                  toastr.warning('请输入报警名称');
                  return;
                }
                let bmfId = $('#' + ruleId + ' .fieldTd>.opt>input:checked').val();
                let bmfType = $('#' + ruleId + ' .fieldTd>.opt>input:checked').attr('data-type');
                if (!bmfId) {
                  toastr.warning('请选择参数类型');
                  return;
                }
                let alarmType = $('#' + ruleId + ' .alarmTypetd>.opt>input:checked').val();
                if (!alarmType) {
                  toastr.warning('请选择报警类型');
                  return;
                }
                let rule = {
                  Id: currItem.Id,
                  FieldTypeId: bmfId,
                  AlarmName: alarmName,
                  AlarmTypeEnum: getAlarmType(bmfType, alarmType),
                  PreWarnValue: $('#prewarn_' + ruleId).val(),
                  OnWarnValue: $('#warn_' + ruleId).val(),
                  ValidStartTime: getValidate(ruleId).startTime,
                  ValidEndTime: getValidate(ruleId).endTime,
                  RepeatDate: getRepeatDateStr(ruleId),
                  IsEnabled: $('#enable_' + ruleId + '>input').is(':checked')
                }
                esdpec.framework.core.doPostOperation('alarmcenter/addalarmtemplate', rule, function (response) {
                  if (response.IsSuccess) {
                    loadAlarmTpl(filterId, 1);
                  }
                })
              });

              if (currItem.IsAlarmTemplate) {
                $('#tpl_' + ruleId + '>input').prop('checked', 'checked');
              }
              if (currItem.IsEnabled) {
                $('#enable_' + ruleId + '>input').prop('checked', 'checked');
              }
              $('#tpl_' + ruleId).off('click').on('click', function (e) {
                e.stopPropagation();
                $('#tpl_' + ruleId + '>input').prop('checked', !$('#tpl_' + ruleId + '>input').is(':checked'));
              });
              $('#enable_' + ruleId).off('click').on('click', function (e) {
                e.stopPropagation();
                $('#enable_' + ruleId + '>input').prop('checked', !$('#enable_' + ruleId + '>input').is(':checked'));
              });
            }, 1);
            $('#cancel_' + ruleId).off('click').on('click', function (e) {
              e.stopPropagation();
              $('#' + ruleId).next().show();
              $(e.currentTarget).parents('tr').remove();
              if ($('.alarm-condition>tr').length <= 0)
                $('.alarm-condition').append('<tr class="alaram-condition-norecord"><td colspan="8" class="norecord-cell">未设置报警条件，点击右上方按钮添加</td></tr>');
            });
          });
          $('.alarm-tpl div.del_').off('click').on('click', function (e) {
            e.stopPropagation();
            let currentDom = e.currentTarget;
            let id = $(currentDom).attr('data-id');
            $('#delete-confirm-modal').dialogModal({
              onOkBut: function () {
                esdpec.framework.core.doDeleteOperation('alarmcenter/deletealarmtemplate?alarmTemplateId=' + id, {
                  alarmTemplateId: id
                }, function (response) {
                  if (response.IsSuccess && response.Content) {
                    $('tr#' + id).remove();
                  }
                });
              },
              onLoad: function () {
                $('.open .modal_header').text('删除确认');
                $('.open .device-shield-content').text('确认是否删除这个报警模板？');
              },
              onCancelBut: function () {},
            });
          });
          $('.alarm-tpl div.rel_').off('click').on('click', function (e) {
            e.stopPropagation();
            let tplId = $(e.currentTarget).attr('data-id');
            $('#choose-meter-for-comparison').dialogModal({
              onOkBut: function () {
                let nodeIds = $(".open .choose-meter-list").jstree("get_checked");
                let nodes = _.filter(meterDataList, a => _.includes(nodeIds, a.id) && a.modeltype !== 'area');
                let ids = _.map(nodes, a => a.id);
                let associalObj = {
                  MeterIds: ids,
                  AlartTemplateId: tplId
                }
                esdpec.framework.core.doPostOperation('alarmcenter/alarmtemplateassociatemeters', associalObj, function (response) {
                  if (response.IsSuccess && response.Content) {
                    toastr.info('模板关联仪表成功');
                    return;
                  }
                });
              },
              onCancelBut: function () {},
              onLoad: function () {
                setTimeout(() => {
                  $('.open .modal_header').text('选择关联仪表');
                  if ($('.open .choose-meter-list').html() === '') {
                    $('.open .choose-meter-list').jstree({
                      "core": {
                        "multiple": true,
                        "themes": {
                          "responsive": false
                        },
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
                      "plugins": ["types", "search", "crrm", "checkbox"],
                      "checkbox": {
                        "keep_selected_style": false
                      },
                    }).on('loaded.jstree', function (e, data) {
                      let instance = data.instance;
                      let target = instance.get_node(e.target.firstChild.firstChild.lastChild);
                      instance.open_node(target);
                      esdpec.framework.core.getJsonResult('alarmcenter/getassociatemeters?alarmTemplateId=' + tplId, function (response) {
                        if (response.IsSuccess) {
                          let meters = response.Content;
                          //如果关联仪表成功
                          if (meters && meters.length > 0)
                            _.each(meters, meter => {
                              instance.select_node(instance.get_node(meter).id);
                            });
                        }
                      });
                    });
                  }
                }, 150);
              },
              onClose: function () {},
            });
          });
        }, 300);
        layui.use('laypage', function () {
          let laypage = layui.laypage;
          laypage.render({
            elem: 'paging-alarm-tpl',
            count: totalSize,
            curr: pageIndex,
            layout: ['count', 'prev', 'page', 'next', 'skip'],
            jump: function (page, first) {
              if (!first) loadAlarmTpl(filterId, page.curr);
            }
          });
        });
      }
    });
  };
  // 获取历史报警记录
  let getMeterHistory = (sTime, eTime, level, pageIndex) => {
    let uriparam = `meterId=${currentSelectedNode.id}&stime=${sTime}&etime=${eTime}&isHistory=true&pageIndex=${pageIndex}&warnLevel=${level}`;
    esdpec.framework.core.getJsonResult('alarmcenter/getmeterdata?' + uriparam, function (response) {
      if (response.IsSuccess) {
        let totalSize = response.Remark;
        let meterHistroyList = response.Content;
        let data = {
          meterHistroyList
        };
        _.each(data.meterHistroyList, a => {
          a.AlarmTime = _.replace(a.LastAlarmTime.substring(0, 19), 'T', ' ');
          a.AlarmType = alarmTypeEnum[a.AlarmTypeEnum];
          // 处理方式
          a.DealType = alarmDealStatusEnum[a.AlarmDealStatusEnum];
          // 处理记录
          a.AlarmDealReasonDetail = alarmDealReasonEnum[a.AlarmDealReasonEnum];
          // 采集值
          a.CollectValue = a.Value === '' ? '---' : numberFormat(parseFloat(a.Value).toFixed(3));
          // 超限量
          a.percent = (a.Value === '' || a.Value === '0') ? '--' : numberFormat((a.Value * 100 / a.OnWarnValue).toFixed(3));
        });
        let templateHtml = template('meter-history-modal-template', data);
        $('.meter-history-modal').html(templateHtml);
        $('#meterHistory').text(totalSize);
        layui.use('laypage', function () {
          let laypage = layui.laypage;
          laypage.render({
            elem: 'history-paging',
            count: totalSize,
            curr: pageIndex,
            layout: ['count', 'prev', 'page', 'next', 'skip'],
            jump: function (page, first) {
              if (!first) getMeterHistory(sTime, eTime, level, page.curr);
            }
          });
        });
      }
    });
  };
  //加载仪表报警数据
  let loadMeterAlarmData = (sTime, eTime, level, isHistory, pageIndex) => {
    $('.area__meter').html(' - 仪表报警中心');
    $('.detail').html(' - 仪表数据详情');
    let uriparam = `meterId=${currentSelectedNode.id}&stime=${sTime}&etime=${eTime}&isHistory=${isHistory}&pageIndex=${pageIndex}&warnLevel=${level}`;
    esdpec.framework.core.getJsonResult('alarmcenter/getalarmruledata?meterId=' + currentSelectedNode.id + '&pageIndex=' + pageIndex, function (response) {
      if (response.IsSuccess) {
        // 报警条件总数
        // $('.content__header--title span').html(node.original.text + ' - 仪表数据详情');
        let totalSize = parseInt(response.Remark);
        if (totalSize) {
          $('#alarm-setting').attr("class", "header-title icon iconfont meter-alarm-collapse");
          $('.setter-content').addClass("setter-content-collapse");
        } else {
          $('#alarm-setting').attr("class", "header-title icon iconfont");
          $('.setter-content').removeClass("setter-content-collapse");
        }
      }
    });

    esdpec.framework.core.getJsonResult('alarmcenter/getmeterdata?' + uriparam, function (response) {
      if (response.IsSuccess) {
        // 当前报警事件总数
        let totalSize = response.Remark;
        if (!totalSize) {
          $('#meter-alarm').addClass('change-gray')
        } else(
          $('#meter-alarm').removeClass('change-gray')
        )
        if (totalSize === '0') {
          $('#meter-alarm').addClass('disabled').attr('disabled', 'disabled');
        } else {
          $('#meter-alarm').removeClass('disabled').removeAttr('disabled');
        }
        let meterAlarmList = response.Content;
        // 当前页面报警事件详情
        let data = {
          meterAlarmList
        };
        _.each(data.meterAlarmList, a => {
          a.AlarmType = alarmTypeEnum[a.AlarmTypeEnum];
          a.AlarmTime = _.replace(a.LastAlarmTime.substring(0, 19), 'T', ' ');
          a.CollectValue = a.Value === '' ? '--' : numberFormat(parseFloat(a.Value).toFixed(3));
          a.percent = (a.Value === '0' || a.Value === '') ? '--' : numberFormat((a.Value * 100 / a.OnWarnValue).toFixed(3));
          a.isChecked = false;
        });
        meterEventList = data.meterAlarmList;
        let templateHtml = template('meter-alarm-list-template', data);
        $('#meter-alarm-list').html(templateHtml);
        $('#meter-alarm-count').text(totalSize);
        setTimeout(() => {
          $('.meter-alarm-history>input.btn-history').off('click').on('click', function (e) {
            e.stopPropagation();
            layui.use(['layer', 'laydate'], function () {
              let lay = layui.layer;
              let laydate = layui.laydate;
              let setTop = function () {
                lay.open({
                  type: 1,
                  area: ['90%', '480px'],
                  shade: 0.6,
                  content: $('#meter-alarm-history-modal'),
                  zIndex: lay.zIndex,
                  success: function (layero) {
                    $('.layui-layer-title').remove();
                    laydate.render({
                      elem: '#meter-history-daycontainer',
                      btns: ['confirm'],
                      range: '--',
                      format: 'yyyy-MM-dd',
                      type: 'date',
                      value: new Date(historyTime.minTime).format('yyyy-MM-dd') + ' -- ' + new Date(historyTime.maxTime).format('yyyy-MM-dd'),
                      done: value => {
                        let truthValue = value.split('--');
                        let level = $('#meter-alarm-history-modal .history-filter>.chk>input:checked').val();
                        getMeterHistory(truthValue[0], truthValue[1], level || 4, 1);
                      }
                    });
                    setTimeout(() => {
                      $('.layui-layer-content').removeAttr('style');
                      $('#history-all').prop('checked', true);
                      getMeterHistory(historyTime.minTime, historyTime.maxTime, 4, 1);
                      $('#meter-alarm-history-modal .history-filter>.chk').off('click').on('click', function (e) {
                        e.stopPropagation();
                        $('#meter-alarm-history-modal .history-filter>.chk>input').prop('checked', false);
                        $(e.currentTarget).children().first().prop('checked', true);
                        let level = $(e.currentTarget).children().first().val();
                        let currentdate = $('#meter-history-daycontainer').val();
                        let curDateArray = currentdate.split(' -- ');
                        getMeterHistory(curDateArray[0], curDateArray[1], level, 1);
                      });
                    }, 300);
                  }
                });
              };
              setTop();
            });
          });
        }, 300);
        layui.use('laypage', function () {
          let laypage = layui.laypage;
          laypage.render({
            elem: 'paging-meter',
            count: totalSize,
            curr: pageIndex,
            layout: ['count', 'prev', 'page', 'next', 'skip'],
            jump: function (page, first) {
              if (!first) loadMeterAlarmData(sTime, eTime, level, isHistory, page.curr);
            }
          });
        });
      }
    });
  };
  let loadMeterAlarmPage = () => {
    esdpec.framework.core.getJsonResult('alarmcenter/getmetermessage?meterId=' + currentSelectedNode.id, function (response) {
      if (response.IsSuccess) {
        let rtn = response.Content;
        rtn.areaName = getMeterBelongArea(currentSelectedNode.id);
        let data = {
          data: rtn
        };
        let templateHtml = template('meter-alarm-info-template', data)
        $('.meter-alarm-info').html(templateHtml);
      }
    });
    esdpec.framework.core.getJsonResult('alarmcenter/getmeterparadata?meterId=' + currentSelectedNode.id, function (response) {
      if (response.IsSuccess) {
        meterFieldTypes = response.Content;
      }
    });
    let id = $('.setter-content ul>li.layui-this').attr('data-id');
    switch (id) {
      case 'alarm-condition-tpl':
        let id = $('.tpl-list .opt>input:checked').val();
        loadAlarmTpl(id, 1);
        break;
      case 'alarm-condition-list':
        loadAlarmCondition(1);
        break;
    }
    $('#meter-alarm-all').prop('checked', true);
    $('.meter-alarm-filter .chk').on('click', function (e) {
      e.stopPropagation();
      let id = $(e.currentTarget).attr('data-id');
      $('.meter-alarm-filter .chk input').prop('checked', false);
      let input = $(e.currentTarget).children().first();
      input.prop('checked', true);
      $('#meter-select-all').prop('checked', false);
      switch (id) {
        case 'sa':
          loadMeterAlarmData(historyTime.minTime, historyTime.maxTime, 4, false, 1);
          break;
        case 'ofl':
          loadMeterAlarmData(historyTime.minTime, historyTime.maxTime, 2, false, 1);
          break;
        case 'yj':
          loadMeterAlarmData(historyTime.minTime, historyTime.maxTime, 0, false, 1);
          break;
        case 'bj':
          loadMeterAlarmData(historyTime.minTime, historyTime.maxTime, 1, false, 1);
          break;
      }
    });
    loadMeterAlarmData(historyTime.minTime, historyTime.maxTime, 4, false, 1);
  };
  let getAlarmType = (type, alarm) => {
    if (type === '0') {
      switch (alarm) {
        case '0':
          return 4;
        case '1':
          return 3;
        case '2':
          return 2;
        case '3':
          return 1;
        case '4':
          return 0;
        case '5':
          return 5;
      }
    }
    switch (alarm) {
      case '0':
        return 6;
      case '5':
        return 7;
    }
  };
  let getRepeatDateStr = ruleId => {
    let checkedDates = $('tr#' + ruleId + '>td.weektd>.opt>input:checked');
    return _.join(_.map(checkedDates, a => a.value), ',');
  };
  let getValidate = ruleId => {
    let timeRange = $('#validate_' + ruleId).val();
    let timeRangeArray = timeRange.split(' -- ');
    let startTime = historyTime.minTime + ' ' + timeRangeArray[0];
    let endTime = historyTime.maxTime + ' ' + timeRangeArray[1];
    return {
      startTime,
      endTime
    }
  };
  let alarmPageChange = () => {
    if (currentSelectedNode.modeltype === 'area') {
      $('.area-alarm-info').removeClass('hidden');
      $('.meter-alarm-info').addClass('hidden');
      $('.exception-operate-box').show();
      $('.meter-operate-box').hide();
      $('.alarm-setter').hide();
      $('.meter-alarm-event').hide();
      $('.area-alarm-device-list').show();
      $('.alarm-setter').hide();
      loadAreaAlarmPage();
    } else {
      $('.area-alarm-info').addClass('hidden');
      $('.meter-alarm-info').removeClass('hidden');
      $('.exception-operate-box').hide();
      $('.meter-operate-box').show();
      $('.alarm-setter').show();
      $('.meter-alarm-event').show();
      $('.area-alarm-device-list').hide();
      $('.alarm-setter').show();
      $('.alarm-setter .setter-header').off('click').on('click', function (e) {
        e.stopPropagation();
        $('.alarm-setter .setter-header>span').toggleClass('meter-alarm-collapse');
        $('.setter-content').toggleClass('setter-content-collapse');
      });
      $('.setter-content ul>li').off('click').on('click', function (e) {
        e.stopPropagation();
        let currentDom = e.currentTarget;
        let preId = $('.setter-content ul>li.layui-this').attr('data-id');
        $('.setter-content ul>li').removeClass('layui-this');
        $(currentDom).addClass('layui-this');
        let id = $(currentDom).attr('data-id');
        $('#' + preId).hide();
        $('#' + id).show();
        switch (id) {
          case 'alarm-condition-list':
            $('.alarm-btn-grp').show();
            loadAlarmCondition(1);
            break;
          case 'alarm-condition-tpl':
            $('.alarm-btn-grp').hide();
            esdpec.framework.core.getJsonResult('alarmcenter/getenergys', function (response) {
              if (response.IsSuccess) {
                tplTypeList = response.Content;
                let data = {
                  tplTypeList
                };
                let templateHtml = template('tpl-list-template', data);
                $('.tpl-list').html(templateHtml);
                setTimeout(() => {
                  $('.tpl-list .opt').off('click').on('click', function (e) {
                    e.stopPropagation();
                    $('.tpl-list .opt input').prop('checked', false);
                    let currentDom = e.currentTarget;
                    $(currentDom).children().first().prop('checked', true);
                    let id = $(currentDom).children().first().val();
                    loadAlarmTpl(id, 1);
                  });
                  $('.tpl-list .opt').first().click();
                }, 300);
              }
            })
            break;
        }
      });
      $('.alarm-btn-grp>input').off('click').on('click', function (e) {
        e.stopPropagation();
        let ruleId = 'new_' + _.replace(Math.random(), '.', '');
        let data = {
          weekList: weekDayList,
          ruleId: ruleId,
          alarmTypeValueList,
          meterFieldTypes
        };
        let newRow = template('new-rule-template', data);
        $('.alarm-condition').prepend(newRow);
        $('.weektd .magic-checkbox').prop('checked', 'checked');
        if ($('.alarm-condition>.alaram-condition-norecord').length > 0)
          $('.alarm-condition>.alaram-condition-norecord').remove();
        setTimeout(() => {
          layui.use('laydate', function () {
            let laydate = layui.laydate;
            laydate.render({
              elem: '.validate-container',
              btns: ['confirm'],
              range: '--',
              format: 'HH:mm',
              type: 'time',
              value: '00:00 -- 23:59',
            });
          });
          $('#cancel_' + ruleId).off('click').on('click', function (e) {
            e.stopPropagation();
            $('#' + ruleId).remove();
            if ($('.alarm-condition>tr').length <= 0)
              $('.alarm-condition').append('<tr class="alaram-condition-norecord"><td colspan="8" class="norecord-cell">未设置报警条件，点击右上方按钮添加</td></tr>');
          });
          $('#ok_' + ruleId).off('click').on('click', function (e) {
            e.stopPropagation();
            let alarmName = $('#name_' + ruleId).val();
            if (alarmName === '') {
              toastr.warning('请输入报警名称');
              return;
            }
            let bmfId = $('#' + ruleId + ' .fieldTd>.opt>input:checked').val();
            let bmfType = $('#' + ruleId + ' .fieldTd>.opt>input:checked').attr('data-type');
            if (!bmfId) {
              toastr.warning('请选择参数类型');
              return;
            }
            let alarmType = $('#' + ruleId + ' .alarmTypetd>.opt>input:checked').val();
            if (!alarmType) {
              toastr.warning('请选择报警类型');
              return;
            }
            let warningValue = $('.editable:eq(1)').val();
            if (!warningValue) {
              toastr.warning('请输入预警值');
              return;
            }
            let alarmValue = $('.editable:eq(2)').val();
            if (!alarmValue) {
              toastr.warning('请输入报警值');
              return;
            }
            let valiteTime = $('#validate_' + ruleId).val();
            if (!valiteTime) {
              toastr.warning('请选择生效时间');
              return;
            }
            let dateRepeat = $('#' + ruleId + ' .weektd>.opt>input:checked').val();
            if (!dateRepeat) {
              toastr.warning('请选择重复日期');
              return;
            }
            let rule = {
              BaseMeterFieldTypeId: bmfId,
              AlarmName: alarmName,
              AlarmTypeEnum: getAlarmType(bmfType, alarmType),
              PreWarnValue: $('#prewarn_' + ruleId).val(),
              OnWarnValue: $('#warn_' + ruleId).val(),
              ValidStartTime: getValidate(ruleId).startTime,
              ValidEndTime: getValidate(ruleId).endTime,
              RepeatDate: getRepeatDateStr(ruleId),
              IsEnabled: $('#enable_' + ruleId + '>input').is(':checked'),
              IsAlarmTemplate: $('#tpl_' + ruleId + '>input').is(':checked'),
            }
            esdpec.framework.core.doPostOperation('alarmcenter/addalarmrule', rule, function (response) {
              if (response.IsSuccess) {
                loadAlarmCondition(1);
              }
            })
          });
          //新增模板
          $('.fieldTd>.opt').off('click').on('click', function (e) {
            e.stopPropagation();
            $('.fieldTd>.opt>input').prop('checked', false);
            let inputDom = $(e.currentTarget).children().first();
            let type = inputDom.attr('data-type');
            inputDom.prop('checked', true);
            $('.alarmTypetd>.opt').find('input').prop('checked', false);

            if (type === '0') {
              $('#' + ruleId + '_1').removeAttr('disabled');
              $('#' + ruleId + '_2').removeAttr('disabled');
              $('#' + ruleId + '_3').removeAttr('disabled');
              $('#' + ruleId + '_4').removeAttr('disabled');
              flag = true;
            } else {
              $('#' + ruleId + '_1').attr('disabled', 'disabled');
              $('#' + ruleId + '_2').attr('disabled', 'disabled');
              $('#' + ruleId + '_3').attr('disabled', 'disabled');
              $('#' + ruleId + '_4').attr('disabled', 'disabled');
              let alarmInput = $('.alarmTypetd>.opt>input:checked').val();
              if (alarmInput === '1' || alarmInput === '2' || alarmInput === '3' || alarmInput === '4'){
                $('.alarmTypetd>.opt>input').prop('checked', false);
              }
            }
          });
          $('.alarmTypetd>.opt').off('click').on('click', function (e) {
            e.stopImmediatePropagation();
            let alarmInput = $(e.currentTarget).children().first();
            let alarmVal = alarmInput.val();
            if (alarmVal == '0' || alarmVal == '5') {
              //可选
              $(this).parent('td').parent('tr').find('.validate-container').removeAttr('disabled');
              $(this).parent('td').parent('tr').find('.magic-checkbox').removeAttr('disabled');
              $('.weektd .magic-checkbox').prop('checked', 'checked');
              $('.validate-container').val('00:00 -- 23:59')
              $('.validate-container').show();
              if (!$('div.enable_box').hasClass('hidden')) {
                $('.enable_box').addClass('hidden');
              }
            } else {
              $(this).parent('td').parent('tr').find('.validate-container').attr('disabled', 'disabled').val('');
              $(this).parent('td').parent('tr').find('.magic-checkbox').attr('disabled', 'disabled').prop('checked', false);
              $('.validate-container').hide();
              $('.enable_box').removeClass('hidden').attr('disabled', true)
            }
            if (alarmInput.is(':disabled')) return;
            $('.alarmTypetd>.opt>input').prop('checked', false);
            alarmInput.prop('checked', true);
          });
          $('.weektd>.opt').off('click').on('click', function (e) {
            e.stopPropagation();
            let currentDom = e.currentTarget;
            let currentInput = $(currentDom).children().first();

            currentInput.prop('checked', !$(currentInput)[0].checked);
            if (currentInput.prop('disabled')) {
              currentInput.prop('checked', false);
            }
            // if (flag&&flag2) {
            //   currentInput.attr('disabled','disabled');
            //   // currentInput.prop('checked', true);
            // } else {
            //   currentInput.removeAttr('disable');
            //   // currentInput.prop('checked', false);
            // }
          });
          $('#tpl_' + ruleId).off('click').on('click', function (e) {
            e.stopPropagation();
            $('#tpl_' + ruleId + '>input').prop('checked', !$('#tpl_' + ruleId + '>input').is(':checked'));
          });
          $('#enable_' + ruleId).off('click').on('click', function (e) {
            e.stopPropagation();
            $('#enable_' + ruleId + '>input').prop('checked', !$('#enable_' + ruleId + '>input').is(':checked'));
          });
        }, 300);
      });
      $('.alarm-info .meter-operate-box>input').off('click').on('click', function (e) {
        e.stopPropagation();
        let id = $(e.currentTarget).attr('id');
        switch (id) {
          case 'meter-alarm':
            $('#area-alarm-modal').dialogModal({
              onOkBut: function () {
                // 原因   处理记录
                let dealReason = $('.open .radio-grp .opt input:checked').val();
                let dealObj = {
                  MeterIds: [currentSelectedNode.id],
                  AlarmDealStatus: 1,
                  AlarmDealReason: !dealReason ? $('.open #other-reason').val() : dealReason,
                  AlarmDealReasonDetail: $('.open .area-alarm-modal-textarea').val(),
                  DealType: 2
                };
                esdpec.framework.core.doPutOperation('alarmcenter/updatealarmdatarelease', dealObj, function (response) {
                  if (response.IsSuccess && response.Content) {
                    loadMeterAlarmData(historyTime.minTime, historyTime.maxTime, 4, false, 1);
                    $('#alarm-status').text('仪表状态：无报警');
                  }
                });
              },
              onCancelBut: function () {},
              onLoad: function () {
                setTimeout(() => {
                  $('.open #r1').prop('checked', true);
                  $('.open .radio-grp .opt').on('click', function (e) {
                    e.stopPropagation();
                    let currentDom = e.currentTarget;
                    $('.open .radio-grp .opt input').prop('checked', false);
                    $(currentDom).children().first().prop('checked', true);
                    $('.open #other-reason').prop('checked', false);
                    $('.open .area-alarm-modal-textarea').val('').prop('readonly', true);
                  });
                  $('.open .area-alarm-modal-textarea').on('input', function (e) {
                    e.stopPropagation();
                    if (e.currentTarget.value.length > 30) {
                      e.currentTarget.value = e.currentTarget.value.substring(0, 30);
                      return;
                    }
                    $('.open .len-limit').text(e.currentTarget.value.length + '/30');
                  });
                  $('.open .other-reason').on('click', function (e) {
                    e.stopPropagation();
                    $('.open .radio-grp .opt input').prop('checked', false);
                    let currentDom = e.currentTarget;
                    $(currentDom).children().first().prop('checked', true);
                    $('.open .area-alarm-modal-textarea').prop('readonly', false).focus();
                  });
                }, 300);
              },
              onClose: function () {},
            });
            return;
          case 'meter-shield-device':
            $('#shield').prop('checked', true);
            $('#shield-time').prop('checked', false);
            layui.use(['layer', 'laydate'], function () {
              alarmlay = layui.layer;
              let laydate = layui.laydate;
              let setTop = function () {
                let that = this;
                alarmlay.open({
                  type: 1,
                  title: '屏蔽设置',
                  area: ['560px', '260px'],
                  shade: 0.6,
                  content: $('#set-shield-modal'),
                  btn: ['确定', '取消'],
                  yes: function () {
                    $(that).click();
                    let time = $('#sheild-time-container').val();
                    let status = $('#shield').is(':checked') ? 1 : 2;
                    let sheildObj = {
                      MeterIds: [currentSelectedNode.id],
                      AlarmDealStatus: 2,
                      AlarmDealReason: 4,
                      AlarmDealReasonDetail: '',
                      MeterDealStatus: status,
                      StartTime: $('#shield').prop('checked') ? '1973-01-01 00:00:01' : time.split(' -- ')[0],
                      EndTime: $('#shield').prop('checked') ? "2099-12-31 23:59:59" : time.split(' -- ')[1]
                    };
                    esdpec.framework.core.doPutOperation('alarmcenter/updatealarmdatashield', sheildObj, function (response) {
                      if (response.IsSuccess && response.Content) {
                        loadMeterAlarmData(historyTime.minTime, historyTime.maxTime, 4, false, 1);
                        $('#alarm-status').text('仪表状态：已屏蔽');
                        alarmlay.closeAll();
                      }
                    });
                  },
                  btn2: function () {
                    alarmlay.closeAll();
                  },
                  zIndex: alarmlay.zIndex,
                  success: function (layero) {
                    laydate.render({
                      elem: '#sheild-time-container',
                      btns: ['confirm'],
                      range: '--',
                      format: 'yyyy-MM-dd HH:mm',
                      type: 'datetime',
                      trigger: 'click',
                      value: new Date().format('yyyy-MM-dd hh:mm') + ' -- ' + new Date().format('yyyy-MM-dd hh:mm'),
                      end: function () {
                        $(".layui-layer-shade").remove();
                      }
                    });
                  }
                });
              };
              setTop();
            });
            $('.device-shield-content .opt').on('click', function (e) {
              e.stopPropagation();
              $('.device-shield-content .opt input').prop('checked', false);
              $(e.currentTarget).children().first().prop('checked', true);
            });
            return;
          case 'meter-stop-alarm':
            $('#shield').prop('checked', true);
            $('#shield-time').prop('checked', false);
            layui.use(['layer', 'laydate'], function () {
              alarmlay = layui.layer;
              let laydate = layui.laydate;
              let setTop = function () {
                let that = this;
                alarmlay.open({
                  type: 1,
                  title: '解除屏蔽',
                  area: ['590px', '260px'],
                  shade: 0.6,
                  content: $('#rmove-shield-modal'),
                  btn: ['确定', '取消'],
                  yes: function () {
                    $(that).click();
                    let time = $('#sheild-time-container').val();
                    let sheildObj = {
                      MeterIds: [currentSelectedNode.id],
                      AlarmDealStatus: 0,
                      AlarmDealReason: 0,
                      AlarmDealReasonDetail: '',
                      MeterDealStatus: 0,
                      StartTime: $('#shield').prop('checked') ? '1973-01-01 00:00:01' : time.split(' -- ')[0],
                      EndTime: $('#shield').prop('checked') ? "2099-12-31 23:59:59" : time.split(' -- ')[1]
                    };
                    esdpec.framework.core.doPutOperation('alarmcenter/updatealarmmetercancleshield', sheildObj, function (response) {
                      if (response.IsSuccess && response.Content) {
                        loadMeterAlarmData(historyTime.minTime, historyTime.maxTime, 4, false, 1);
                        $('#alarm-status').text('仪表状态：无报警');
                        alarmlay.closeAll();
                      }
                    });
                  },
                  btn2: function () {
                    alarmlay.closeAll();
                  },
                  zIndex: alarmlay.zIndex,
                  success: function (layero) {
                    laydate.render({
                      elem: '#sheild-time-container',
                      btns: ['confirm'],
                      range: '--',
                      format: 'yyyy-MM-dd HH:mm',
                      type: 'datetime',
                      trigger: 'click',
                      value: new Date().format('yyyy-MM-dd hh:mm') + ' -- ' + new Date().format('yyyy-MM-dd hh:mm'),
                      end: function () {
                        $(".layui-layer-shade").remove();
                      }
                    });
                  }
                });
              };
              setTop();
            });
            $('.device-shield-content .opt').on('click', function (e) {
              e.stopPropagation();
              $('.device-shield-content .opt input').prop('checked', false);
              $(e.currentTarget).children().first().prop('checked', true);
            });
            return;
          case 'shutdown-power':
            let status = 0;
            $('#delete-confirm-modal').dialogModal({
              onOkBut: function () {
                if (status === 1) {
                  $('.open .modal_header').text('关闭确认');
                  $('.open .device-shield-content').text('确定要进行关闭电闸操作？');
                  status = 2;
                  return false;
                } else if (status === 2) {
                  let sheildObj = {
                    MeterIds: [currentSelectedNode.id],
                    AlarmDealStatus: 3,
                    AlarmDealReason: 6,
                    MeterDealStatus: 3
                  };
                  esdpec.framework.core.doPutOperation('alarmcenter/updatealarmdatashield', sheildObj, function (response) {
                    if (response.IsSuccess && response.Content) {
                      loadMeterAlarmData(historyTime.minTime, historyTime.maxTime, 4, false, 1);
                      $('#alarm-status').text('仪表状态：已关闭');
                      alarmlay.closeAll();
                    }
                  });
                }
              },
              onCancelBut: function () {
                status = 0;
              },
              onLoad: function () {
                setTimeout(() => {
                  status = 1;
                  $('.open .modal_header').text('系统确认');
                  $('.open .device-shield-content').text('确认该仪表有电闸？');
                }, 300);
              },
              onClose: function () {
                status = 0;
              },
            });
            return;
        }
      });
      loadMeterAlarmPage();
    }
    setTimeout(() => {
      if ($('.alarm-content>.alarm-content-right').prop('scrollHeight') >
        $('.alarm-content>.alarm-content-right').prop('clientHeight')) {
        $('.alarm-content>.alarm-footer').show();
      } else {
        $('.alarm-content>.alarm-footer').hide();
      }
    }, 300);
  };
  let getExceptionOriginData = mfid => {
    let dateType = getSearchDateType();
    let searchDateType = dateType === -1 ? 2 : dateType;
    let defaultTimeStr = getDefaultSTimeAndETime(searchDateType);
    let dateArray = defaultTimeStr.split(' -- ');
    let uriparam = `mfid=${mfid}&sTime=${dateArray[0]}&eTime=${dateArray[1]}`;
    esdpec.framework.core.getJsonResult('abnormaldata/getdata?' + uriparam, function (response) {
      if (response.IsSuccess) {
        if (response.Content.length > 0) {
          let exceptionDatas = [];
          _.each(response.Content, a => {
            exceptionDatas.push({
              val: a.val,
              cost: 0,
              date: a.time,
              isChecked: false
            });
          });
          loadExceptionDataIntoGraphData(exceptionDatas);
        }
      }
    });
  };

  $('.main-content .content-right').on('scroll', function (e) {
    e.stopPropagation();
    if (currentSelectedNode && currentSelectedNode.modeltype !== 'area')
      checkElementInVisiable();
  });

  $('#onshowmeterinfo').on('click', function (e) {
    e.stopPropagation();
    $('.meter-info-container').toggleClass('close');
    if ($('.meter-info-container').hasClass('close')) {
      $('.meter-info-container').hide(300);
      $('#onshowmeterinfo>span:first-of-type').html('展开表计详情 <i class="icon iconfont icon-xiaotuziCduan_"></i>');
    } else {
      $('.meter-info-container').show(300);
      $('#onshowmeterinfo>span:first-of-type').html('收起表计详情 <i class="icon iconfont icon-xiaotuziCduan_1"></i>');
    }
  });

  //隐藏更多
  $('#onshowmoreparameter').on('click', function (e) {
    e.stopPropagation();
    $('#onshowmoreparameter').toggleClass('close');
    if ($('#onshowmoreparameter').hasClass('close')) {
      $('#onshowmoreparameter').html('更多参数<i class="icon iconfont icon-xiaotuziCduan_"></i>');
      let parameters = {
        parameterList: _.slice(currentMeterParameters, 0, 5)
      };
      let templateHtml = template('parameter-list-template', parameters);
      $('.parameter-right').html(templateHtml);
    } else {
      $('#onshowmoreparameter').html('隐藏更多<i class="icon iconfont icon-xiaotuziCduan_1"></i>');
      let parameters = {
        parameterList: currentMeterParameters
      };
      let templateHtml = template('parameter-list-template', parameters);
      $('.parameter-right').html(templateHtml);
    }
  });

  //年月日切换
  $('.btn-grp .btn').on('click', function (e) {
    e.stopPropagation();
    $('#button')[0].checked = false;
    const currentDom = e.currentTarget;
    $("div[id*='layui-laydate']").remove();
    _.each($('.btn-grp .btn'), item => {
      if ($(item).attr('data-value') !== $(currentDom).attr('data-value')) {
        $(item).removeClass('date-active');
      }
    });
    $(currentDom).toggleClass('date-active');
    let parameter = _.find(currentMeterParameters, a => a.type === 0 && a.isChecked);
    $(".total_Unit").text(parameter.unit)
    tempIndex = $(currentDom).attr('data-value');
    if (parameter && getSearchDateType() !== -1) {
      $('.exception-manager').attr('data-toggle', 'close').hide();
      $('.exception-box').hide();
    } else {
      $('.exception-manager').show();
    }
    if ($(currentDom).hasClass('date-active')) {
      switch ($(currentDom).attr('data-value')) {
        case '2':
          $('.date-grp').show();
          $('#day').removeClass('hidden');
          $('#month').addClass('hidden');
          $('#year').addClass('hidden');
          $('.on-off-button').show();
          break;
        case '3':
          $('.date-grp').hide();
          $('.on-off-button').show();
          break;
        case '4':
          $('.date-grp').show();
          $('#day').addClass('hidden');
          $('#month').removeClass('hidden');
          $('#year').addClass('hidden');
          $('.on-off-button').show();
          break;
        case '5':
          $('.date-grp').show();
          $('#day').addClass('hidden');
          $('#month').addClass('hidden');
          $('#year').removeClass('hidden');
          $('.on-off-button').hide();
          break;
      }
      $('#datevalue').val(resetSTimeAndETime(parseInt($(currentDom).attr('data-value'))));
    } else {
      $('.date-grp').show();
      $('#day').removeClass('hidden');
      $('#month').addClass('hidden');
      $('#year').addClass('hidden');
      $('#datevalue').val(resetSTimeAndETime(2));
      $('#daycontainer').val(new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'));
    }
    searchMeterData();
    if ($("#button").is(':checked')) {
      reloadMeterChartData();
    }
  });

  $('.area-btn-grp .btn').on('click', function (e) {
    e.stopPropagation();
    $("div[id*='layui-laydate']").remove();
    const currentDom = e.currentTarget;
    _.each($('.area-btn-grp .btn'), item => {
      if ($(item).attr('data-value') !== $(currentDom).attr('data-value')) {
        $(item).removeClass('date-active');
      }
    });
    $(currentDom).toggleClass('date-active');
    if ($(currentDom).hasClass('date-active')) {
      switch ($(currentDom).attr('data-value')) {
        case '2':
          $('.area-date-grp').show();
          $('#area-day').removeClass('hidden');
          $('#area-month').addClass('hidden');
          $('#area-year').addClass('hidden');
          break;
        case '3':
          $('.area-date-grp').hide();
          break;
        case '4':
          $('.area-date-grp').show();
          $('#area-day').addClass('hidden');
          $('#area-month').removeClass('hidden');
          $('#area-year').addClass('hidden');
          break;
        case '5':
          $('.area-date-grp').show();
          $('#area-day').addClass('hidden');
          $('#area-month').addClass('hidden');
          $('#area-year').removeClass('hidden');
          break;
      }
      $('#area-datevalue').val(resetSTimeAndETime(parseInt($(currentDom).attr('data-value'))));
    } else {
      $('.area-date-grp').show();
      $('#area-day').removeClass('hidden');
      $('#area-month').addClass('hidden');
      $('#area-year').addClass('hidden');
      $('#area-datevalue').val(resetSTimeAndETime(2));
      $('#area-daycontainer').val(new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'));
    }
    searchAreaData();
  });

  $('.operate-grp i.icon').on('click', function (e) {
    $('#button')[0].checked = false;
    e.stopPropagation();
    const currentDom = e.currentTarget;
    let flag = $(currentDom).attr('data-value');
    if ($(currentDom).hasClass('should-uniq')) {
      $('.operate-grp i.should-uniq').removeClass('btn-active');
      $(currentDom).addClass('btn-active');
    } else {
      $(currentDom).toggleClass('btn-active');
    }
    if(getChartType() == 'pie' || getChartType() == 'line'){
      $('.on-off-button').hide()
    }else if($('.comparsion-right')[0].children.length > 0){
      $('.on-off-button').hide()
    }else{
      $('.on-off-button').show()
    }
    //TODO
    let chartSeries = [];
    switch (flag) {
      //#region rmb
      case 'rmb':
        if (ifShowPieChart()) return;
        $('.chart-legend').show();
        if (comparsionSelectedMeters.length > 0) {
          chartSeries = getChartSeries(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData, getChartType(),
            $('.show-tip').hasClass('btn-active') ? true : false);
        } else {
          chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, getChartType(), $('.show-tip').hasClass('btn-active') ? true : false);
        }
        if ($(currentDom).hasClass('btn-active')) {
          let costSeries = [];
          if (comparsionSelectedMeters.length > 0) {
            costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData,
              $('.show-tip').hasClass('btn-active') ? true : false);
          } else {
            costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
              return {
                id: a.id,
                name: a.name
              };
            }), searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          }
          chartSeries = _.concat(chartSeries, costSeries);
        }

        break;
        //#endregion
        //#region bar
      case 'bar':
      $('.chart-legend').show();
        if (comparsionSelectedMeters.length > 0) {
          chartSeries = getChartSeries(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData, 'bar',
            $('.show-tip').hasClass('btn-active') ? true : false);
        } else {
          chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, 'bar', $('.show-tip').hasClass('btn-active') ? true : false);
        }
        if ($('.icon-RMB').hasClass('btn-active')) {
          let costSeries = [];
          if (comparsionSelectedMeters.length > 0) {
            costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap,
              searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          } else {
            costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
              return {
                id: a.id,
                name: a.name
              };
            }), searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          }
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
        //#region line
      case 'line':
      $('.chart-legend').show();
        if (comparsionSelectedMeters.length > 0) {
          chartSeries = getChartSeries(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData, 'line',
            $('.show-tip').hasClass('btn-active') ? true : false);
        } else {
          chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, 'line', $('.show-tip').hasClass('btn-active') ? true : false);
        }
        if ($('.icon-RMB').hasClass('btn-active')) {
          let costSeries = [];
          if (comparsionSelectedMeters.length > 0) {
            costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap,
              searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          } else {
            costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
              return {
                id: a.id,
                name: a.name
              };
            }), searchResult.chartXaxisData, $('.show-tip').hasClass('btn-active') ? true : false);
          }
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
      case 'pie':
        generatePieChart(true);
        return;
      case 'download':
        return;
        //#region tip
      case 'tip':
        if (ifShowPieChart()) return;
        //对比数据
        if (comparsionSelectedMeters.length > 0) {
          chartSeries = getChartSeries(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData, getChartType(),
            $(currentDom).hasClass('btn-active') ? true : false);
        } else {
          chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.checkedParameters, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, getChartType(), $(currentDom).hasClass('btn-active') ? true : false);
        }
        if ($('.icon-RMB').hasClass('btn-active')) {
          let costSeries = [];
          if (comparsionSelectedMeters.length > 0) {
            costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData,
              $(currentDom).hasClass('btn-active') ? true : false);
          } else {
            costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.checkedParameters, a => {
              return {
                id: a.id,
                name: a.name
              };
            }), searchResult.chartXaxisData, $(currentDom).hasClass('btn-active') ? true : false);
          }
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
    }
    searchMeterData();
    generateChart(searchResult.unit, searchResult.chartLegend, searchResult.chartXaxisData, chartSeries, 'chart-instance');
  });

  $('.area-operate-grp i.icon').on('click', function (e) {
    e.stopPropagation();
    const currentDom = e.currentTarget;
    let flag = $(currentDom).attr('data-value');
    if ($(currentDom).hasClass('should-uniq')) {
      $('.area-operate-grp i.should-uniq').removeClass('btn-active');
      $(currentDom).addClass('btn-active');
    } else {
      $(currentDom).toggleClass('btn-active');
    }
    //TODO
    let chartSeries = [];
    switch (flag) {
      //#region rmb
      case 'rmb':
        chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.meterAndParaMap, a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, getAreaChartType(), $('.show-tip-area').hasClass('btn-active') ? true : false);
        if ($(currentDom).hasClass('btn-active')) {
          let costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.meterAndParaMap, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, $('.show-tip-area').hasClass('btn-active') ? true : false, true);
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
        //#region bar
      case 'bar':
        chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.meterAndParaMap, a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, 'bar', $('.show-tip-area').hasClass('btn-active') ? true : false);
        if ($('.icon-RMB-area').hasClass('btn-active')) {
          let costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.meterAndParaMap, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, $('.show-tip-area').hasClass('btn-active') ? true : false, true);
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
        //#region line
      case 'line':
        chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.meterAndParaMap, a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, 'line', $('.show-tip-area').hasClass('btn-active') ? true : false);
        if ($('.icon-RMB-area').hasClass('btn-active')) {
          let costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.meterAndParaMap, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, $('.show-tip-area').hasClass('btn-active') ? true : false, true);
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
      case 'download':

        return;
        //#region tip
      case 'tip':
        chartSeries = getChartSeries(searchResult.datas, _.map(searchResult.meterAndParaMap, a => {
          return {
            id: a.id,
            name: a.name
          };
        }), searchResult.chartXaxisData, getAreaChartType(), $(currentDom).hasClass('btn-active') ? true : false);
        if ($('.icon-RMB-area').hasClass('btn-active')) {
          let costSeries = getChartSeriesForCost(searchResult.datas, _.map(searchResult.meterAndParaMap, a => {
            return {
              id: a.id,
              name: a.name
            };
          }), searchResult.chartXaxisData, $(currentDom).hasClass('btn-active') ? true : false, true);
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
    }
    let selectedLegend = {};
    _.each(searchResult.datas, data => {
      if (!data.ischecked) {
        let meter = _.find(searchResult.meterAndParaMap, a => a.mfid === data.mfid);
        if (meter) selectedLegend[meter.name] = false;
      }
    });
    generateChart(searchResult.unit, searchResult.chartLegend, searchResult.chartXaxisData, chartSeries, 'area-chart-instance', selectedLegend);
  });

  $('.func-tab .layui-tab-title>li').on('click', function (e) {
    e.stopPropagation();
    let currentDom = e.currentTarget;
    $('.func-tab .layui-tab-title>li').removeClass("layui-this");
    $('.func-tab .layui-tab-content>div').hide();
    $(currentDom).addClass('layui-this');
    $('#' + $(currentDom).attr('data-id')).show();
    checkElementInVisiable();
    // $(window).resize();
  })

  $('#area-zone .operate-hander').on('click', function (e) {
    e.stopPropagation();
    showModuleConfigureModal();
  });

  $('.content__header--btngrp .module-container').on('click', function (e) {
    e.stopPropagation();
    showModuleConfigureModal();
  });

  $(window).resize(function (e) {
    if (globalCurrentPage === 'alarm') {
      if ($('.alarm-content>.alarm-content-right').prop('scrollHeight') > $('.alarm-content>.alarm-content-right').prop('clientHeight')) {
        $('.alarm-content>.alarm-footer').show();
      } else {
        $('.alarm-content>.alarm-footer').hide();
      }
    }
  });
  //报警中心
  $('.content__header--btngrp .alarm-container').on('click', function (e) {
    e.stopPropagation();
    globalCurrentPage = 'alarm';
    $('.main-content').hide();
    $('.alarm-content').show();
    $('.meterName').addClass('nav-history');
    $('.detail').addClass('nav-history');
    $('#nav-alarm').show();
    $('#item-name').text(currentSelectedNode.text);
    alarmPageChange();
    if ($('.alarm-content>.alarm-content-right').prop('scrollHeight') >
      $('.alarm-content>.alarm-content-right').prop('clientHeight')) {
      $('.alarm-content>.alarm-footer').show();
    } else {
      $('.alarm-content>.alarm-footer').hide();
    }
  });

  //返回
  $('.alarm-content-right>.alarm-header>.navigate-back>span').on('click', function (e) {
    e.stopPropagation();
    if (backSource === '') {
      globalCurrentPage = 'analysis';
      $('.main-content').show();
      $('.alarm-content').hide();
      $('.meterName').removeClass('nav-history');
      $('.detail').removeClass('nav-history');
      $('#nav-alarm').hide();
      let treeInstance = $('#metertree').jstree(true);
      treeInstance.deselect_node(treeInstance.get_selected(true));
      treeInstance.select_node(treeInstance.get_node(currentSelectedNode.id));
    } else {
      backSource = '';
      globalCurrentPage = 'alarm';
      let treeInstance = $('#metertree').jstree(true);
      treeInstance.deselect_node(treeInstance.get_selected(true));
      treeInstance.select_node(treeInstance.get_node(currentSelectedNodeBak.id));
      currentSelectedNodeBak = null;
    }
  });

  //增加对比
  $('.comparsion-left>.meter-choose').on('click', function (e) {
    e.stopPropagation();
    $('.on-off-button').hide();
    let tempPara = "";
    $(".parameter-right div.para-item[class*='para-active']").each(function () {
      tempPara += $(this).text();
    })
    if (getSelectParameterLen() > 1) {
      toastr.warning('只能单参数对比');
      return;
    }
    $('#choose-meter-for-comparison').dialogModal({
      onOkBut: function () {
        let nodeIds = $(".open .choose-meter-list").jstree("get_checked");
        nodeIds = _.filter(nodeIds, a => a !== currentSelectedNode.id);
        let nodes = _.filter(meterDataList, a => _.includes(nodeIds, a.id) && a.modeltype !== 'area');
        comparsionSelectedMeters = [];
        comparsionSelectedMeters = _.concat([], nodes);
        let data = {
          comparisonMeterList: comparsionSelectedMeters
        };
        let templateHtml = template('comparsion-right-template', data);
        $('.comparsion-right').html(templateHtml);
        setTimeout(() => {
          //删除对比
          $('.comparsion-right .meter-item>i').on('click', function (e) {
            e.stopPropagation();
            let currentDom = e.currentTarget;
            let meterId = $(currentDom).attr('data-id');
            $(currentDom).parent().remove();
            let removeMeter = _.remove(comparsionSelectedMeters, a => a.id === meterId);
            if (comparsionSelectedMeters.length > 0) {
              //remove comparison data: remove chart data and parameter detail info
              if (removeMeter && removeMeter.length > 0) {
                let p = _.find(removeMeter[0].parameters, a => a.isChecked);
                if (p) {
                  _.remove(searchResult.datas, a => a.mfid === p.id);
                }
                generateComparisonData(searchResult.meterAndParaMap, searchResult.datas, searchResult.type);
                //generateComparisonChartData();
                if (ifShowPieChart()) {
                  generatePieChart(true);
                } else {
                  let chartSeries = getChartSeries(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData, getChartType(),
                    $('.show-tip').hasClass('btn-active') ? true : false);
                  if ($('.icon-RMB').hasClass('btn-active')) {
                    let costSeries = getChartSeriesForCost(searchResult.datas, searchResult.meterAndParaMap, searchResult.chartXaxisData,
                      $(currentDom).hasClass('btn-active') ? true : false);
                    chartSeries = _.concat(chartSeries, costSeries);
                  }
                  generateChart(searchResult.unit, _.map(searchResult.datas, a => a.meter_name), searchResult.chartXaxisData, chartSeries, 'chart-instance');
                }
              }
            } else {
              if (ifShowPieChart()) {
                $('#pie').removeClass('btn-active');
                $('#bar').addClass('btn-active');
              }
              $('#pie').hide();
              searchMeterData();
            }
          });
        }, 150);
        searchMeterData();
      },
      onCancelBut: function () {},
      onLoad: function () {
        setTimeout(() => {
          let isInit = false;
          $('.open .modal_header').text('选择对比仪表');
          if ($('.open .choose-meter-list').html() === '') {
            $('.open .choose-meter-list').jstree({
              "core": {
                "multiple": true,
                "themes": {
                  "responsive": false
                },
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
              "plugins": ["types", "search", "crrm", "checkbox"],
              "checkbox": {
                "keep_selected_style": false
              },
            }).on('loaded.jstree', function (e, data) {
              isInit = true;
              let instance = data.instance;
              let target = instance.get_node(e.target.firstChild.firstChild.lastChild);
              instance.open_node(target);
              let disableNode = instance.get_node(currentSelectedNode.id);
              instance.select_node(disableNode);
              instance.disable_node(disableNode);
              _.each(comparsionSelectedMeters, meter => {
                instance.select_node(instance.get_node(meter.id));
              });
              isInit = false
            }).on('select_node.jstree', function (e, data) {
              let instance = data.instance;
              let node = data.node.original;
              if (!isInit) {
                let nodeIds = $(".open .choose-meter-list").jstree("get_checked");
                if (nodeIds.length > 6) {
                  toastr.warning('对比仪表个数不能超过6个');
                  instance.deselect_node(instance.get_node(node.id));
                  return;
                }
                esdpec.framework.core.getJsonResult('dataanalysis/getparasbymeterid?meterId=' + node.id, function (response) {
                  if (response.IsSuccess) {
                    if (response.Content && response.Content.length <= 0) {
                      toastr.warning('无法获取当前仪表的相关参数，无法进行相关对比');
                      instance.deselect_node(instance.get_node(node.id));
                      return;
                    }
                    let selectedPara = _.find(currentMeterParameters, a => a.isChecked);
                    let exists = _.find(response.Content, a => a.name === selectedPara.name);
                    if (!exists) {
                      toastr.warning('无法获取当前仪表的相关参数，无法进行相关对比');
                      instance.deselect_node(instance.get_node(node.id));
                      return;
                    }
                  }
                });
              }
            }).on('deselect_node.jstree', function (e, data) {
              let instance = data.instance;
              let node = data.node.original;
              if (node.modeltype === 'area' && isParentNode(node.id, currentSelectedNode.id)) {
                setTimeout(() => {
                  instance.select_node(instance.get_node(currentSelectedNode.id));
                  return;
                }, 100);
              }
            });
          }
        }, 150);
      },
      onClose: function () {},
    });
  });

  $('.proportion-grp ul>li').on('click', function (e) {
    e.stopPropagation();
  });

  $('.proportion-grp .op-btn').on('click', function (e) {
    e.stopPropagation();
    $('.parameter-overlay').toggleClass('hidden');
  });

  $('.op-grp>.btn').on('click', function (e) {
    e.stopPropagation();
    let currentDom = e.currentTarget;
    $('.op-grp>.btn').removeClass('op-btn-active');
    $(currentDom).addClass('op-btn-active');
    let id = $(currentDom).attr('data-id');
    $('.area-sort-list').empty();
    switch (id) {
      case 'usage':
        generateAreaSort(searchResult.datas);
        break;
      case 'cost':
        generateAreaCostSort(searchResult.datas);
        break;
    }
  });

  $('.comparison-proportion .comparison-rmb').on('click', function (e) {
    e.stopPropagation();
    let currentDom = e.currentTarget;
    $(currentDom).toggleClass('btn-active');
    if ($(currentDom).hasClass('btn-active')) generateAreaCostPie();
    else generateAreaPie();
  });

  $('.area-fgp-data>.btn-group>div.btn').on('click', function (e) {
    e.stopPropagation();
    let currentDom = e.currentTarget;
    $("div[id*='layui-laydate']").remove();
    $('.area-fgp-data>.btn-group>div.btn').removeClass('date-active');
    $(currentDom).addClass('date-active');
    switch ($(currentDom).attr('data-value')) {
      case '2':
        $('.area-fgp-date-grp').show();
        $('#area-fgp-day').removeClass('hidden');
        $('#area-fgp-month').addClass('hidden');
        let date = new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd');
        $('#area-fgp-daycontainer').val(date);
        break;
      case '3':
        $('.area-fgp-date-grp').hide();
        break;
      case '4':
        $('.area-fgp-date-grp').show();
        $('#area-fgp-day').addClass('hidden');
        $('#area-fgp-month').removeClass('hidden');
        let month = new Date().format('yyyy-MM') + ' -- ' + new Date().format('yyyy-MM');
        $('#area-fgp-monthcontainer').val(month);
        break;
    }
    generateAreaFgp();
  });

  $('.proportion-grp .area-pie').on('click', function (e) {
    e.stopPropagation();
    let canvas = document.getElementById('proportion-chart-instance').children[0].children[0];
    let dataUrl = canvas.toDataURL();
    let aTag = document.createElement('a');
    aTag.href = dataUrl;
    aTag.download = '分项占比.png';
    document.body.appendChild(aTag);
    aTag.click();
    document.body.removeChild(aTag);
  });

  $('.peak-data>.btn-group>div.btn').on('click', function (e) {
    e.stopPropagation();
    let currentDom = e.currentTarget;
    $("div[id*='layui-laydate']").remove();
    $('.peak-data>.btn-group>div.btn').removeClass('date-active');
    $(currentDom).addClass('date-active');
    switch ($(currentDom).attr('data-value')) {
      case '2':
        $('.meter-fgp-date-grp').show();
        $('#meter-fgp-day').removeClass('hidden');
        $('#meter-fgp-month').addClass('hidden');
        let date = new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd');
        $('#meter-fgp-daycontainer').val(date);
        break;
      case '3':
        $('.meter-fgp-date-grp').hide();
        break;
      case '4':
        $('.meter-fgp-date-grp').show();
        $('#meter-fgp-day').addClass('hidden');
        $('#meter-fgp-month').removeClass('hidden');
        let month = new Date().format('yyyy-MM') + ' -- ' + new Date().format('yyyy-MM');
        $('#meter-fgp-monthcontainer').val(month);
        break;
    }
    generateFgpData();
  });

  $('.graph-data .exception-manager').on('click', function (e) {
    e.stopImmediatePropagation();
    let currentDom = e.currentTarget;
    let currentPara = $('.list-body div.param-item-active');
    let mfid = currentPara.attr('data-id');
    let parameters = _.filter(currentMeterParameters, a => a.isChecked);
    let mfids = _.head(parameters);
    if ($(currentDom).attr('data-toggle') === 'close') {
      $('.exception-box').show();
      $(currentDom).attr('data-toggle', 'open');
      $(currentDom).children(0).children(0).removeClass('icon-xiaotuziCduan_').addClass('icon-xiaotuziCduan_1');
      $('.inException').show();
      $('.valtd').removeClass('lasttd');
      if (currentPara) {
        getExceptionOriginData(mfid);
      } else {
        getExceptionOriginData(mfids);
      }
      $('#exception-open-history').on('click', function (e) {
        e.stopImmediatePropagation();
        $('#exception-history-data').dialogModal({
          onOkBut: function () {},
          onCancelBut: function () {},
          onLoad: function () {
            let currentPara = $('.list-body div.param-item-active');
            esdpec.framework.core.getJsonResult('abnormaldata/getdatabypage?mfid=' + currentPara.attr('data-id') + '&pagenum=1', function (response) {
              if (response.IsSuccess) {
                generateExceptionHistory(response.Content, currentPara.attr('data-id'));
              }
            });
          },
          onClose: function () {},
        });
      });
      $('#exception-filter-rule').on('click', function (e) {
        e.stopPropagation();
        if (!operateBefore()) return;
        let exceptionItem = {
          mfid: currentPara.attr('data-id')
        };
        $(this).attr('disabled', 'disabled');
        setTimeout(() => {
          $('#exception-filter-rule').removeAttr('disabled')
        }, 1000);
        let time = $('#exception-daycontainer').val();
        let timeArray = time.split(' -- ');
        exceptionItem.stime = timeArray[0] + ' 00:00:01';
        exceptionItem.etime = timeArray[1] + ' 23:59:59';
        let minVal = $('#min-val-input').val();
        let maxVal = $('#max-val-input').val();
        toastr.options = {
          closeButton: false,
          debug: false,
          progressBar: false,
          positionClass: "toast-top-center",
          onclick: null,
          showDuration: "300",
          hideDuration: "1000",
          timeOut: "1000",
          extendedTimeOut: "1000",
          showEasing: "swing",
          hideEasing: "linear",
          showMethod: "fadeIn",
          hideMethod: "fadeOut"
        };
        if (minVal !== '') {
          exceptionItem.gt_val = parseFloat(minVal);
        }
        if (maxVal !== '') {
          exceptionItem.lt_val = parseFloat(maxVal);
        }
        if ((exceptionItem.lt_val && exceptionItem.gt_val && exceptionItem.gt_val >= exceptionItem.lt_val) || (!exceptionItem.lt_val && !exceptionItem.gt_val)) {
          toastr.warning('数值范围异常，最大值和最小值必须有一个存在，并且最大值必须大于最小值');
          return;
        }
        esdpec.framework.core.doPostOperation('abnormalrule/saverule', exceptionItem, function (response) {
          if (response.IsSuccess && response.Content) {
            toastr.info("规则保存成功");
            return;
          }
        });
      });
      $('#exception-filter').on('click', function (e) {
        e.stopImmediatePropagation();
        let exceptionItem = {
          mfid: currentPara.attr('data-id')
        };
        $(this).attr('disabled', 'disabled');
        setTimeout(() => {
          $('#exception-filter').removeAttr('disabled')
        }, 1000);
        toastr.options = {
          closeButton: false,
          debug: false,
          progressBar: false,
          positionClass: "toast-top-center",
          onclick: null,
          showDuration: "300",
          hideDuration: "1000",
          timeOut: "1000",
          extendedTimeOut: "1000",
          showEasing: "swing",
          hideEasing: "linear",
          showMethod: "fadeIn",
          hideMethod: "fadeOut"
        };
        let time = $('#exception-daycontainer').val();
        let timeArray = time.split(' -- ');
        exceptionItem.stime = timeArray[0] + ' 00:00:01';
        exceptionItem.etime = timeArray[1] + ' 23:59:59';
        let minVal = $('#min-val-input').val();
        let maxVal = $('#max-val-input').val();
        if (minVal !== '') {
          exceptionItem.gt_val = parseFloat(minVal);
        }
        if (maxVal !== '') {
          exceptionItem.lt_val = parseFloat(maxVal);
        }
        if ((exceptionItem.lt_val && exceptionItem.gt_val && exceptionItem.gt_val >= exceptionItem.lt_val) || (!exceptionItem.lt_val && !exceptionItem.gt_val)) {
          toastr.warning('数值范围异常，最大值和最小值必须有一个存在，并且最大值必须大于最小值');
          return;
        }
        esdpec.framework.core.doPostOperation('abnormaldata/savelistdata', exceptionItem, function (response) {
          if (response.IsSuccess) {
            reloadMeterChartData();
            reloadExceptionGraphData();
          }
        });
      });
      $('#exception-unfilter').on('click', function (e) {
        e.stopImmediatePropagation();
        let exceptionItem = {
          mfid: currentPara.attr('data-id')
        };
        $(this).attr('disabled', 'disabled');
        setTimeout(() => {
          $('#exception-unfilter').removeAttr('disabled')
        }, 1000);
        toastr.options = {
          closeButton: false,
          debug: false,
          progressBar: false,
          positionClass: "toast-top-center",
          onclick: null,
          showDuration: "300",
          hideDuration: "1000",
          timeOut: "1000",
          extendedTimeOut: "1000",
          showEasing: "swing",
          hideEasing: "linear",
          showMethod: "fadeIn",
          hideMethod: "fadeOut"
        };
        let time = $('#exception-daycontainer').val();
        let timeArray = time.split(' -- ');
        exceptionItem.stime = timeArray[0] + ' 00:00:01';
        exceptionItem.etime = timeArray[1] + ' 23:59:59';
        let minVal = $('#min-val-input').val();
        let maxVal = $('#max-val-input').val();
        if (minVal !== '') {
          exceptionItem.gt_val = parseFloat(minVal);
        }
        if (maxVal !== '') {
          exceptionItem.lt_val = parseFloat(maxVal);
        }
        if ((exceptionItem.lt_val && exceptionItem.gt_val && exceptionItem.gt_val >= exceptionItem.lt_val) || (!exceptionItem.lt_val && !exceptionItem.gt_val)) {
          toastr.warning('数值范围异常，最大值和最小值必须有一个存在，并且最大值必须大于最小值');
          return;
        }
        esdpec.framework.core.doPostOperation('abnormaldata/cancellistdata', exceptionItem, function (response) {
          if (response.IsSuccess) {
            reloadMeterChartData();
            reloadExceptionGraphData();
          }
        });
      });
    } else {
      $('.exception-box').hide();
      $(currentDom).attr('data-toggle', 'close');
      $(currentDom).children(0).children(0).removeClass('icon-xiaotuziCduan_1').addClass('icon-xiaotuziCduan_');
      $('.inException').hide();
      $('.valtd').addClass('lasttd');
      $('.graph-data-list tr.shouldremove').remove();
    }
  });

  $('#min-val-input').on('input', function (e) {
    e.stopImmediatePropagation();
    let minVal = e.target.value.replace(/[^\d.]/g, '');
    $('#min-val-input').val(minVal);
    if (minVal === '') {
      minVal = '--';
    }
    $('#minval').text(minVal);
  });

  $('#max-val-input').on('input', function (e) {
    e.stopImmediatePropagation();
    let maxVal = e.target.value.replace(/[^\d.]/g, '');
    $('#max-val-input').val(maxVal);
    if (maxVal === '') {
      maxVal = '--';
    }
    $('#maxval').text(maxVal);
  });

  $(document).on('click', function (e) {
    e.stopPropagation();
    $('.parameter-overlay').addClass('hidden');
    let current = e.target;
    if ($(current).hasClass('dialogModal open')) {
      $('.dialogModal.open').remove();
      areaSubscribeModule = _.cloneDeep(areaSubscribeModuleClone);
      areaConfigureMeters = _.cloneDeep(areaConfigureMetersClone);
    }
  });

  layui.use('laydate', function () {
    let laydate = layui.laydate;
    laydate.render({
      elem: '#daycontainer',
      btns: ['confirm'],
      range: '--',
      format: 'yyyy-MM-dd',
      type: 'date',
      trigger: 'click',
      value: new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'),
      done: (value, date) => {
        let truthValue = value.split('--');
        $('#datevalue').val(_.trim(truthValue[0]) + ' 00:00:00 -- ' + truthValue[1] + ' 23:59:59');
        $("#button")[0].checked = false;
        searchMeterData();
      },
    });

    lay('.area-grp').on('mouseleave', function (e) {
      lay('.area-grp').on('mouseleave', function (e) {
        laydate.render({
          elem: '#daycontainer',
          show: false,
          closeStop: '.area-grp',
        });
      });
      laydate.render({
        elem: '#monthcontainer',
        btns: ['confirm'],
        range: '--',
        format: 'yyyy-MM',
        type: 'month',
        value: new Date().format('yyyy-MM') + ' -- ' + new Date().format('yyyy-MM'),
        done: (value, date) => {
          let truthValue = value.split('--');
          let dayInMonth = new moment(truthValue[1]).daysInMonth();
          $('#datevalue').val(_.trim(truthValue[0]) + '-01 -- ' + truthValue[1] + '-' + dayInMonth);
          $("#button")[0].checked = false;
          searchMeterData();
        }
      });
      laydate.render({
        elem: '#yearcontainer',
        btns: ['confirm'],
        range: '--',
        format: 'yyyy',
        type: 'year',
        value: new Date().format('yyyy') + ' -- ' + new Date().format('yyyy'),
        done: (value, date) => {
          let truthValue = value.split('--');
          $('#datevalue').val(_.trim(truthValue[0]) + '-01-01 -- ' + truthValue[1] + '-12-31');
          $("#button")[0].checked = false;
          searchMeterData();
        }
      });
    });

    layui.use('laydate', function () {
      let laydate = layui.laydate;
      laydate.render({
        elem: '#area-daycontainer',
        btns: ['confirm'],
        range: '--',
        format: 'yyyy-MM-dd',
        type: 'date',
        value: new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'),
        done: (value, date) => {
          let truthValue = value.split('--');
          $('#area-datevalue').val(_.trim(truthValue[0]) + ' 00:00:00 -- ' + truthValue[1] + ' 23:59:59');
          searchAreaData();
        }
      });
      laydate.render({
        elem: '#area-monthcontainer',
        btns: ['confirm'],
        range: '--',
        format: 'yyyy-MM',
        type: 'month',
        value: new Date().format('yyyy-MM') + ' -- ' + new Date().format('yyyy-MM'),
        done: (value, date) => {
          let truthValue = value.split('--');
          let dayInMonth = new moment(truthValue[1]).daysInMonth();
          $('#area-datevalue').val(_.trim(truthValue[0]) + '-01 -- ' + truthValue[1] + '-' + dayInMonth);
          searchAreaData();
        }
      });
      laydate.render({
        elem: '#area-yearcontainer',
        btns: ['confirm'],
        range: '--',
        format: 'yyyy',
        type: 'year',
        value: new Date().format('yyyy') + ' -- ' + new Date().format('yyyy'),
        done: (value, date) => {
          let truthValue = value.split('--');
          $('#area-datevalue').val(_.trim(truthValue[0]) + '-01-01 -- ' + truthValue[1] + '-12-31');
          searchAreaData();
        }
      });
    });

    layui.use('laydate', function () {
      let laydate = layui.laydate;
      laydate.render({
        elem: '#area-fgp-daycontainer',
        btns: ['confirm'],
        range: '--',
        format: 'yyyy-MM-dd',
        type: 'date',
        value: new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'),
        done: (value, date) => {
          let truthValue = value.split('--');
          $('#area-fgp-datevalue').val(_.trim(truthValue[0]) + ' 00:00:00 -- ' + truthValue[1] + ' 23:59:59');
          setTimeout(() => generateAreaFgp(), 300);
        }
      });
      laydate.render({
        elem: '#area-fgp-monthcontainer',
        btns: ['confirm'],
        range: '--',
        format: 'yyyy-MM',
        type: 'month',
        value: new Date().format('yyyy-MM') + ' -- ' + new Date().format('yyyy-MM'),
        done: (value, date) => {
          let truthValue = value.split('--');
          let dayInMonth = new moment(truthValue[1]).daysInMonth();
          $('#area-fgp-datevalue').val(_.trim(truthValue[0]) + '-01 -- ' + truthValue[1] + '-' + dayInMonth);
          setTimeout(() => generateAreaFgp(), 300);
        }
      });
    });

    layui.use('laydate', function () {
      let laydate = layui.laydate;
      laydate.render({
        elem: '#meter-fgp-daycontainer',
        btns: ['confirm'],
        range: '--',
        format: 'yyyy-MM-dd',
        type: 'date',
        value: new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'),
        done: (value, date) => {
          let truthValue = value.split('--');
          $('#meter-fgp-datevalue').val(_.trim(truthValue[0]) + ' 00:00:00 -- ' + truthValue[1] + ' 23:59:59');
          setTimeout(() => generateFgpData(), 300);
        }
      });
      laydate.render({
        elem: '#meter-fgp-monthcontainer',
        btns: ['confirm'],
        range: '--',
        format: 'yyyy-MM',
        type: 'month',
        value: new Date().format('yyyy-MM') + ' -- ' + new Date().format('yyyy-MM'),
        done: (value, date) => {
          let truthValue = value.split('--');
          let dayInMonth = new moment(truthValue[1]).daysInMonth();
          $('#meter-fgp-datevalue').val(_.trim(truthValue[0]) + '-01 -- ' + truthValue[1] + '-' + dayInMonth);
          setTimeout(() => generateFgpData(), 300);
        }
      });
    });

    layui.use('laydate', function () {
      let laydate = layui.laydate;
      laydate.render({
        elem: '#exception-daycontainer',
        btns: ['confirm'],
        range: '--',
        format: 'yyyy-MM-dd',
        type: 'date',
        value: new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'),
        done: (value, date) => {
          let truthValue = value.split('--');
          $('#exception-datevalue').val(_.trim(truthValue[0]) + ' 00:00:00 -- ' + truthValue[1] + ' 23:59:59');
        }
      });
    });

    esdpec.framework.core.getJsonResult('common/gettree', function (response) {
      if (response.IsSuccess) {
        meterDataList = _.map(response.Content, a => {
          a.icon = esdpec.framework.core.Config.AssertSite + a.icon;
          return a;
        });
        //树形初始
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
          setTimeout(() => instance.select_node(target), 300);
        }).on("select_node.jstree", function (e, data) {
          let node = data.node;
          let nodeId = node.original.id;
          currentSelectedNode = node.original;
          comparsionSelectedMeters = [];
          $('.comparsion-right').html("");
          backSource = '';
          // tempIndex = $('.btn-grp>.btn.date-active').attr('data-value');
          if ($('.parameter-right>div.para-active').attr("data-type") === '1') {
            $('.btn-grp>div.btn:nth-child(n+2)').hide();
            $('.btn-grp>div.btn:first-child').addClass('date-active');
          } else {
            $('.btn-grp>div.btn:nth-child(n+2)').show();
            $('.btn-grp>div.btn:first-child').removeClass('borderRight');
          }
          $('.meterName').text(node.original.text);
          $('.content__header--title span:first').text(node.original.text);
          if (globalCurrentPage === 'analysis') {
            if (node.original.modeltype === 'area') {
              currentMeterParameters = [];
              areaWindowInteractive();
              if ($('.icon-tubiao-bingtu').hasClass('btn-active')) {
                $('.area-operate-grp .icon-icon-').addClass('btn-active');
                $('.icon-tubiao-bingtu').removeClass('btn-active').hide();
              }
              esdpec.framework.core.getJsonResult('dataanalysis/getareafun?areaId=' + nodeId, function (response) {
                if (response.IsSuccess) {
                  areaSubscribeModule = response.Content.fun_code ? JSON.parse(response.Content.fun_code) : [];
                  areaSubscribeModuleClone = _.cloneDeep(areaSubscribeModule);
                  let meterAndMfidMapStr = response.Content.meterid_mfid_map || '';
                  let meterAndMfidMap = meterAndMfidMapStr.split(';');
                  let meterIds = [];
                  let mfIds = [];
                  _.each(meterAndMfidMap, m => {
                    if (m === '') return true;
                    let meterMfid = m.split(',');
                    meterIds.push(meterMfid[0]);
                    mfIds.push(meterMfid[1]);
                  });
                  areaConfigureMeters = meterIds.length > 0 ? _.filter(meterDataList, a => _.includes(meterIds, a.id)) : [];
                  areaConfigureMetersClone = _.cloneDeep(areaConfigureMeters);
                  areaConfigure = response.Content;
                  areaConfigure.mfIds = mfIds;
                  areaConfigure.meterIds = meterIds;
                  loadAreaDetailPage();
                }
              });
              $('.detail').html(' - 区域数据详情');
              $('.content__header--title span:last').text(' - 区域数据详情');
            } else {
              $('.detail').html(' - 仪表数据详情');
              $('.content__header--title span:last').text(' - 仪表数据详情')
              meterWindowInteractive();
              esdpec.framework.core.getJsonResult('dataanalysis/getparasbymeterid?meterId=' + nodeId, function (response) {
                if (response.IsSuccess) {
                  let selectedItem = _.filter(currentMeterParameters, a => a.isChecked);
                  currentMeterParameters = response.Content;
                  if($('.btn-grp>div.btn.date-active.borderRight').attr('data-value')!=tempIndex){
                    if($('.parameter-right>.para-item.choose-para.para-active').text()!=selectedItem[0].name){
                      $('.btn-grp>div.btn:first-child').removeClass('date-active');
                    }
                  }
                  if (selectedItem && selectedItem.length > 0) {
                    _.each(selectedItem, item => {
                      let select = _.find(currentMeterParameters, a => a.name === item.name);
                      if (select) {
                        select.isChecked = true;
                      }
                    });
                  } else {
                    let firstAggreate = _.find(currentMeterParameters, a => a.type === 0);
                    if (!firstAggreate) firstAggreate = _.head(currentMeterParameters);
                    firstAggreate.isChecked = true;
                  }
                  if (_.filter(currentMeterParameters, a => a.isChecked).length <= 0) {
                    _.head(currentMeterParameters).isChecked = true;
                  }
                  if (currentMeterParameters.length > 6) {
                    $('#onshowmoreparameter').removeClass('hidden');
                  } else $('#onshowmoreparameter').addClass('hidden');
                  _.each(currentMeterParameters, a => {
                    if (a.name.length > 8)
                      a.displayName = a.name.substring(0, 3) + '...' + a.name.substring(a.name.length - 3);
                    else
                      a.displayName = a.name;
                  });
                  let parameters = {
                    parameterList: _.slice(currentMeterParameters, 0, 5)
                  };
                  let templateHtml = template('parameter-list-template', parameters);
                  $('.parameter-right').html(templateHtml);
                  if($('.para-item.choose-para.para-active').attr('data-type')==='0'){
                    $('#meter-zone .icon-icon-').addClass('btn-active').siblings().removeClass('btn-active');
                  }else if($('.para-item.choose-para.para-active').attr('data-type')==='1'){
                    $('#meter-zone .icon-line-chart_icon').addClass('btn-active').siblings().removeClass('btn-active');
                  }
                  if ($('.icon-tubiao-bingtu').hasClass('btn-active')) {
                    let checkedParam = _.find(currentMeterParameters, a => a.isChecked);
                    if (checkedParam.type === 0) {
                      $('.operate-grp .icon-icon-').addClass('btn-active');
                    } else {
                      $('.operate-grp .icon-line-chart_icon').addClass('btn-active');
                    }
                    $('.icon-tubiao-bingtu').removeClass('btn-active').hide();
                  }
                  // reset exception box
                  let defaultChecked = _.find(currentMeterParameters, a => a.isChecked);
                  if (defaultChecked.type === 0) {
                    if ($('.exception-manager').is(':visible')) {
                      $('.exception-box').hide();
                      $('.exception-manager').attr('data-toggle', 'close');
                      $('.exception-manager').children(0).children(0).removeClass('icon-xiaotuziCduan_1').addClass('icon-xiaotuziCduan_');
                      $('.exception-manager').hide();
                    }
                  }
                  // end reset exception box
                  
                  setTimeout(() => {
                    //表参数选择
                    if($('.btn-grp>div.btn:first-child').hasClass('date-active')){
                      $('#day').parent().show()
                      $('#day').removeClass('hidden').siblings().addClass('hidden');
                    }
                    if($('.btn-grp>div.btn:nth-child(2)').hasClass('date-active')){
                      $('#day').parent().hide();
                    }
                    if($('.btn-grp>div.btn:nth-child(3)').hasClass('date-active')){
                      $('#month').parent().show()
                      $('#month').removeClass('hidden').siblings().addClass('hidden');
                    }
                    if($('.btn-grp>div.btn:nth-child(4)').hasClass('date-active')){
                      $('#year').parent().show()
                      $('#year').removeClass('hidden').siblings().addClass('hidden');
                    }else{
                      $('.btn-grp>div.btn:first-child').addClass('date-active');
                    }
                    if ($('.parameter-right>div.para-active').attr("data-type") === '1') {
                      $('.btn-grp>div.btn:nth-child(n+2)').hide();
                      $('.btn-grp>div.btn:first-child').addClass('date-active borderRight');
                      $('#day').removeClass('hidden').siblings().addClass('hidden');
                    } else {
                      $('.btn-grp>div.btn:nth-child(n+2)').show();
                      $('.btn-grp>div.btn:first-child').removeClass('borderRight');
                    }
                    $('.btn-grp>div.btn:nth-child(n+2)').each(function(){
                      if($(this).hasClass('date-active')){
                        if($('.parameter-right>.para-item.choose-para.para-active').attr('data-type')==='0'){
                          $('.btn-grp>div.btn:first-child').removeClass('date-active');
                        }
                      }
                    })
                    $('.parameter').on('click', 'div.para-item', function (e) {
                      e.stopImmediatePropagation();
                      $("div[id*='layui-laydate']").remove();
                      let currentDom = e.currentTarget;
                      let type = parseInt($(currentDom).attr('data-type'));
                      let unit = $(currentDom).attr('data-unit');
                      if (type === 1) {
                        $('.btn-grp>div.btn:nth-child(n+2)').hide();
                        $('.btn-grp>div.btn:first-child').addClass('date-active borderRight');
                        $('.operate-grp>i.should-uniq').removeClass('btn-active');
                        $('#meter-zone .icon-line-chart_icon').addClass('btn-active');
                        $("#day").removeClass('hidden').siblings().addClass('hidden');
                        $('#datevalue').val(resetSTimeAndETime(parseInt($(currentDom).attr('data-value'))));
                        $('.date-grp').show();
                      } else {
                        $('.btn-grp>div.btn:nth-child(n+2)').show();
                        $('.btn-grp>div.btn:first-child').removeClass('borderRight').siblings().removeClass('date-active');
                        $('.operate-grp>i.should-uniq').removeClass('btn-active');
                        $('.operate-grp>i.should-uniq').first().addClass('btn-active');
                      }
                      if (type === 0 && getSearchDateType() !== -1) {
                        $('.exception-manager').attr('data-toggle', 'close').hide();
                        $('.exception-box').hide();
                      } else {
                        $('.exception-manager').show();
                      }
                      let id = $(currentDom).attr('data-id');
                      if (comparsionSelectedMeters.length > 0) {
                        $('.parameter-right>.para-active').removeClass('para-active');
                        $(currentDom).addClass('para-active');
                        _.each(currentMeterParameters, a => {
                          if (a.id === id) a.isChecked = true;
                          else a.isChecked = false;
                        });
                      } else {
                        let hasChooseParameter = _.find(currentMeterParameters, a => a.isChecked && a.id !== id);
                        if (hasChooseParameter && hasChooseParameter.unit !== unit) {
                          _.each(currentMeterParameters, a => {
                            a.isChecked = false;
                          });
                          $('.parameter-right>.para-active').removeClass('para-active');
                        }
                        let chooseNode = _.find(currentMeterParameters, a => a.id === id);
                        let checkedNodes = _.filter(currentMeterParameters, a => a.isChecked);
                        if (chooseNode.isChecked && checkedNodes.length < 1) {
                          toastr.warning('至少需要选择一个参数');
                          return;
                        }
                        chooseNode.isChecked = !chooseNode.isChecked;
                        $(currentDom).toggleClass('para-active');
                      }
                      searchMeterData();
                    });
                    searchMeterData();
                  }, 100);
                }
              });
              $("#button")[0].checked = false;
              if($('.comparsion-right').innerHTML){
                $('.on-off-button').hide();
              }else{
                $('.on-off-button').show();
              }
              esdpec.framework.core.getJsonResult('dataanalysis/getmeterinfobymeterid?meterId=' + nodeId, function (response) {
                if (response.IsSuccess) {
                  let meterInfo = response.Content;
                  meterInfo.area = getMeterBelongArea(nodeId);
                  // meterInfo.status = getMeterStatus(meterInfo.state);
                  let templateData = {
                    data: meterInfo
                  }
                  let templateHtml = template('meter-info-template', templateData);
                  $('.info-table').html(templateHtml);
                }
              });
            }
          } else {
            $('#item-name').text(currentSelectedNode.text);
            alarmPageChange();
            if ($('.alarm-content>.alarm-content-right').prop('scrollHeight') >
              $('.alarm-content>.alarm-content-right').prop('clientHeight')) {
              $('.alarm-content>.alarm-footer').show();
            } else {
              $('.alarm-content>.alarm-footer').hide();
            }
          }
        });
        let searchTimeout = false;
        $('#searchbox').keyup(function () {
          if (searchTimeout) {
            clearTimeout(searchTimeout);
          }
          searchTimeout = setTimeout(function () {
            let keyword = $('#searchbox').val();
            $('#metertree').jstree(true).search(keyword);
          }, 1000);
        });
      }
    });

    toastr.options = _.merge(toastr.options, {
      positionClass: "toast-top-center",
      closeButton: true,
      closeDuration: 100,
      closeMethod: 'fadeOut',
      closeEasing: 'swing',
      progressBar: false,
      onclick: null,
      showDuration: "300",
      hideDuration: "1000",
      timeOut: "1000",
      extendedTimeOut: "1000",
      showEasing: "swing",
      hideEasing: "linear",
      showMethod: "fadeIn",
      hideMethod: "fadeOut"
    });
    //new code
    // $('.share-datas td').append(createInput);
    $('#button').off('click').on('click', function (e) {
      e.stopPropagation();
      if ($("#button").is(':checked')) {
        let dateType = getSearchDateType();
        let searchDateType = dateType === -1 ? 2 : dateType;
        let defaultTimeStr = getDefaultSTimeAndETime(searchDateType);
        let timeArray = defaultTimeStr.split(' -- ');
        let sTime = timeArray[0];
        let eTime = timeArray[1];
        if ($('.btn-grp div.date-active').attr('data-value') == 4) {
          sTime = sTime + ' 00:00:00';
          eTime = eTime + ' 23:59:59';
          searchDateType = 2;
        }
        let selectedItem = _.filter(currentMeterParameters, a => a.isChecked);
        let mIds = _.map(selectedItem, a => a.id);
        let expObj = `mfid=${_.join(mIds, ',')}&dateType=${searchDateType}&sTime=${sTime}&eTime=${eTime}`;
        reloadMeterChartData();
        esdpec.framework.core.getJsonResult('exceptionData/getexceptiondata?' + expObj, function (response) {
          if (response.IsSuccess) {
            // console.log(response)
            searchMeterData(response.Content.data_list)
            getExceptionData(response.Content.data_list, response.Content.mfid);
          }
        });
      } else {
        reloadMeterChartData();
      }
    })
  });
  $('.subscribe').on('click', function () {
    $('.subscribe').toggleClass('isSubscribe');
    $(this).hasClass('isSubscribe') ? $(this).html('- 已关注') : $(this).html('+ 关注')
  })
  $('.parameter div').on('click', function () {
    $('#button')[0].checked = false;
  })
})