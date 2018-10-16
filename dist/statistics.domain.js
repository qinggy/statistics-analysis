$(function () {
  //#region fields 
  let lastclicktime = null;
  let analysisChart = null;
  let areaChart = null;
  let meterDataList = [];
  let searchResult = {};
  let currentSelectedNode = null;
  let currentMeterParameters = [];
  let comparsionSelectedMeters = [];
  let areaSubscribeModule = [];
  let areaConfigureMeters = [];
  let areaConfigure = {};
  let sortColor = ['#F36349', '#F6BC41', '#35BDA5', '#39B0DB', '#00FA9A', '#00FF7F', '#3CB371', '#90EE90', '#32CD32', '#008000', '#ADFF2F',
    '#808000', '#FFE4C4', '#F5DEB3', '#40E0D0', '#7FFFAA', '#008B8B', '#2F4F4F', '#5F9EA0', '#4682B4', '#778899', '#B0C4DE', '#6495ED', '#4169E1', '#0000FF', '#9370DB', '#9932CC'
  ];
  let usageColor = ['#F36349', '#F6BC41', '#35BDA5', '#39B0DB', '#00FA9A', '#00FF7F', '#3CB371', '#90EE90', '#32CD32', '#008000', '#ADFF2F', '#808000', '	#FFE4C4', '#F5DEB3'];
  let costColor = ['#2F4F4F', '#5F9EA0', '#4682B4', '#778899', '#B0C4DE', '#6495ED', '#4169E1', '#0000FF', '#9370DB', '#9932CC', '#40E0D0', '#7FFFAA', '#008B8B'];
  //#endregion
  let numberFormat = function(num){
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
  let getMeterStatus = function (state) {
    switch (state) {
      case 0:
        return '正常';
      case 1:
        return '关电闸';
      case 2:
        return '报警中';
      case 3:
        return '屏蔽直到某个时间点开启'
    }
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
  let operateBefore = function () {
    if (lastclicktime === null)
      lastclicktime = new Date();
    else {
      let currentTime = new Date();
      if (parseInt(currentTime - lastclicktime) <= 300) {
        // console.log('Frequent operation, no response!');
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
    let stimeAndetime = $('#datevalue').val();
    if (stimeAndetime === '') {
      return resetSTimeAndETime(type);
    }
    return stimeAndetime;
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
  let getChartSeries = function (datas, mfIdAndNameMap, xAxisData, type = 'bar', showLabel = false) {
    let seriesArray = [];
    _.each(datas, data => {
      let series = {
        name: _.find(mfIdAndNameMap, a => a.id === data.mfid).name,
        type: type
      };
      series.itemStyle = {
        normal: {
          label: {
            show: showLabel,
          }
        }
      };
      xAxisData = _.uniq(_.orderBy(xAxisData, a => a, "asc"));
      series.data = _.map(xAxisData, a => {
        var valueItem = _.find(data.now_data_list || data.data_list, b => b.date === a);
        if (!!valueItem) return valueItem.val;
      });
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
          tooltip: {
            trigger: 'item',
            formatter: function (params) {
              return params.seriesName + "<br/>" + params.data.name + ": " + params.data.value;
            }
          }
        }]
      };
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
                color: '#dc143c'
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
      seriesArray.push(series);
    });
    return seriesArray;
  };
  let getChartSeriesForCost = function (datas, mfIdAndNameMap, xAxisData, showLabel = false) {
    let seriesArray = [];
    _.each(datas, data => {
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
  let generateAreaPie = function () {
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
      datas.push(sumVal);
      legends.push(meter.text);
    });
    let option = generatePieForAggregateData(legends, datas, searchResult.unit);
    let areaChart = echarts.init(document.getElementById('proportion-chart-instance'), e_macarons);
    areaChart.setOption(option, true);
    window.onresize = areaChart.resize;
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
      datas.push(sumVal);
      legends.push(meter.text);
    });
    let option = generatePieForAggregateData(legends, datas, '元', '费用对比');
    let areaChart = echarts.init(document.getElementById('proportion-chart-instance'), e_macarons);
    areaChart.setOption(option, true);
    window.onresize = areaChart.resize;
  };
  let searchMeterData = function () {
    if (currentMeterParameters.length <= 0) {
      toastr.warning('请先选择查询仪表');
      return;
    }
    let currentSelectedParameters = _.filter(currentMeterParameters, a => a.isChecked);
    if (currentSelectedParameters.length <= 0) return;
    let parameter = _.head(currentSelectedParameters);
    let dateType = getSearchDateType();
    let searchDateType = dateType === -1 ? 2 : dateType;
    let searchParaType = dateType === -1 ? 1 : parameter.type;
    let defaultTimeStr = getDefaultSTimeAndETime(searchDateType);
    let timeArray = defaultTimeStr.split(' -- ');
    let sTime = timeArray[0];
    let eTime = timeArray[1];
    if (comparsionSelectedMeters.length > 0) {
      $('.comparison-tab').show();
      $('.func-tab').hide();
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
                generatePieChart();
              } else
                assembleChartComponent(parameter.unit, chartLegend, chartXaxisData, response.Content, meterAndParaMap, 'chart-instance', getChartType());
            }
          });
        }
      });
    } else {
      $('.comparison-tab').hide();
      $('.func-tab').show();
      $('#summary-container').show();
      let mfids = _.map(currentSelectedParameters, a => a.id);
      let uriparam = `mfids=${_.join(mfids, ',')}&paraType=${searchParaType}&dateType=${searchDateType}&sTime=${sTime}&eTime=${eTime}`;
      esdpec.framework.core.getJsonResult('dataanalysis/getdata?' + uriparam, function (response) {
        if (response.IsSuccess) {
          let chartLegend = [];
          let chartXaxisData = [];
          let checkedParameters = _.filter(currentMeterParameters, p => _.includes(mfids, p.id));
          chartLegend = _.map(checkedParameters, a => a.name);
          chartXaxisData = searchParaType === 0 ? getXAxisData(dateType, sTime, eTime) : getOriginalXAxisData(response.Content.data_list);
          chartXaxisData = _.uniq(_.orderBy(chartXaxisData, a => a, "asc"));
          let datas = searchParaType === 0 ? [response.Content] : response.Content.data_list;
          searchResult = {
            unit: parameter.unit,
            chartLegend,
            chartXaxisData,
            datas,
            checkedParameters
          };
          assembleChartComponent(parameter.unit, chartLegend, chartXaxisData, datas, checkedParameters, 'chart-instance', getChartType());
          if (currentSelectedNode.modeltype === 'meter') {
            $('#summary-container').show();
            $('.func-tab').show();
            if (searchParaType === 0 && dateType === 2 && sTime.substring(0, 10) === eTime.substring(0, 10)) {
              $('.summary-container').show();
              generateContemporaryComparison(response.Content.avg_per, response.Content.avg_val, response.Content.last_sum_val, response.Content.now_sum_val, response.Content.sum_per, parameter.unit);
            } else if (searchParaType !== 0) $('.summary-container').hide();
            generateGraphData(parameter.unit, searchParaType);
            generateOriginalData();
            generateFgpData();
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
  let assembleChartComponent = function (unit, chartLegend, chartXaxisData, datas, checkedParameters, chartDom, chartType = 'bar') {
    let chartSeries = getChartSeries(datas, _.map(checkedParameters, a => {
      return {
        id: a.id,
        name: a.name
      };
    }), chartXaxisData, chartType);
    generateChart(unit, chartLegend, chartXaxisData, chartSeries, chartDom);
  };
  let generateChart = function (unit, chartLegend, chartXaxisData, chartSeries, chartDom) {
    let option = {
      title: {
        subtext: '单位：' + unit
      },
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: 15,
        right: 100,
        bottom: 20
      },
      legend: {
        data: chartLegend
      },
      calculable: true,
      xAxis: [{
        type: 'category',
        data: chartXaxisData
      }],
      yAxis: [{
        type: 'value',
        position: 'right'
      }],
      dataZoom: [{
        type: "inside"
      }],
      series: chartSeries
    };
    analysisChart = echarts.init(document.getElementById(chartDom), e_macarons);
    analysisChart.setOption(option, true);
    window.onresize = analysisChart.resize;
  };
  let generateAreaChart = function (unit, chartLegend, chartXaxisData, datas, checkedParameters, chartDom, chartType = 'bar') {
    let chartSeries = getChartSeries(datas, _.map(checkedParameters, a => {
      return {
        id: a.id,
        name: a.name
      };
    }), chartXaxisData, chartType);
    let option = {
      title: {
        subtext: '单位：' + unit
      },
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: 15,
        right: 100,
        bottom: 20
      },
      legend: {
        data: chartLegend
      },
      calculable: true,
      xAxis: [{
        type: 'category',
        data: chartXaxisData
      }],
      yAxis: [{
        type: 'value',
        position: 'right'
      }],
      dataZoom: [{
        type: "inside"
      }],
      series: chartSeries
    };
    areaChart = echarts.init(document.getElementById(chartDom), e_macarons);
    window.onresize = areaChart.resize;
    areaChart.setOption(option, true);
  };
  let generateContemporaryComparison = function (avg_per, avg_val, last_sum_val, now_sum_val, sum_per, unit) {
    let maxVal = _.max([last_sum_val, now_sum_val, avg_val]);
    let data = {
      data: {
        unit,
        avg_per: numberFormat(avg_per.toFixed(2)),
        sum_per: numberFormat(sum_per.toFixed(2)),
        avg_val: numberFormat(avg_val.toFixed(2)),
        last_sum_val: numberFormat(last_sum_val.toFixed(2)),
        now_sum_val: numberFormat(now_sum_val.toFixed(2)),
        last_sum_width: maxVal === last_sum_val ? '98%' : ((last_sum_val / maxVal) * 100) + '%',
        now_sum_width: maxVal === now_sum_val ? '98%' : ((now_sum_val / maxVal) * 100) + '%',
        avg_val_width: maxVal === avg_val ? '98%' : ((avg_val / maxVal) * 100) + '%'
      }
    };
    let templateHtml = template('contemporary-Comparison-template', data);
    $('#summary-container').html(templateHtml);
    setTimeout(() => {
      $('#onshowdata').on('click', function (e) {
        e.stopPropagation();
        $('#onshowdata').toggleClass('close');
        if ($('#onshowdata').hasClass('close')) {
          $('#onshowdata').html('展开数据<i class="icon iconfont icon-xiaotuziCduan_"></i>');
          $('.summary-container').addClass('collapse-height');
          $('.progress-container').hide();
        } else {
          $('#onshowdata').html('收起展示<i class="icon iconfont icon-xiaotuziCduan_1"></i>');
          $('.summary-container').removeClass('collapse-height');
          $('.progress-container').show();
        }
      });
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
  let generateGraphData = function (unit, type) {
    let currentSelectedParameters = _.filter(currentMeterParameters, a => a.isChecked);
    if (currentSelectedParameters.length <= 0) return;
    let data = {
      selectedParameterList: currentSelectedParameters
    };
    let head = _.head(data.selectedParameterList);
    head.isDefault = true;
    let templateHtml = template('list-body-template', data);
    $('.list-body').html(templateHtml);
    setTimeout(() => {
      $('.list-body>div.choose-param-item').on('click', function (e) {
        e.stopPropagation();
        let currentDom = e.currentTarget;
        $('.list-body>div.choose-param-item').removeClass('param-item-active');
        $(currentDom).addClass('param-item-active');
        let mfid = $(currentDom).attr('data-id');
        if($(currentDom).parent().parent().hasClass('param-position')){
          $('.choose-param-list>.list-body>div.choose-param-item').removeClass('param-item-active');
          $('.choose-param-list>.list-body>div[data-id=' + mfid + ']').addClass('param-item-active');
        }else{
          $('.param-position>.list-body>div.choose-param-item').removeClass('param-item-active');
          $('.param-position>.list-body>div[data-id=' + mfid + ']').addClass('param-item-active');          
        }
        let originalList = _.find(searchResult.datas, item => item.mfid === mfid);
        let originalDatas = {
          data: {
            mfid,
            unit,
            type,
            graphDataList: originalList ? originalList.now_data_list || [] : []
          }
        }
        _.each(originalDatas.data.graphDataList, a => a.isChecked = true);
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
            if ($(currentDom).is(':checked') == true) {
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
      });
    }, 100);
    let originalList = _.find(searchResult.datas, item => item.mfid === head.id);
    let originalDatas = {
      data: {
        mfid: head.id,
        unit,
        type,
        graphDataList: originalList ? originalList.now_data_list || [] : [],
      }
    };
    _.each(originalDatas.data.graphDataList, a => a.isChecked = true);
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
        if ($(currentDom).is(':checked') == true) {
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
        $('#original-table-body tr>td').on('click', function (e) {
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
  let getToolTipTitle = data => {
    return data.axisValueLabel;
  };
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
  let getStackSeries = (branchs, datas, flag, chartType) => {
    let usageSeries = [];
    if (flag === 0) {
      _.each(branchs, (b, index) => {
        usageSeries.push({
          name: b,
          type: 'bar',
          stack: '堆积',
          barWidth: 30,
          data: [getStackSeriesData(datas.now_data_list, b, chartType), getStackSeriesData(datas.last_data_list, b, chartType)],
          itemStyle: {
            normal: {
              color: chartType === 0 ? usageColor[index] : costColor[index]
            },
          }
        });
      });
    } else {
      _.each(branchs, (b, index) => {
        usageSeries.push({
          name: b,
          type: 'bar',
          stack: '堆积',
          barWidth: 30,
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
    let branchs = _.merge(nowbranchs, lastbranchs);
    switch (dateType) {
      case '2':
        let flag = 0;
        if (dateArray[0].substring(0, 10) === dateArray[1].substring(0, 10) && dateArray[1].substring(0, 10) === new Date().format('yyyy-MM-dd')) {
          xAxisData = [new Date(dateArray[0]).format('yyyy-MM-dd'), new Date(dateArray[1]).addDays(-1).format('yyyy-MM-dd')];
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
          $('.usage-title-container').show().html("<span>本日用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span><span>昨日用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span>");
          $('.cost-title-container').show().html("<span>本日费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span><span>昨日费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span>");
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
        xAxisData = [getWeek().monday.substring(0, 10) + ' 至 ' + getWeek().sunday.substring(0, 10), new Date(getWeek().monday).addDays(-7).format('yyyy-MM-dd') + ' 至 ' + new Date(getWeek().sunday).addDays(-7).format('yyyy-MM-dd')];
        $('.usage-title-container').show().html("<span>本周用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span><span>上周用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span>");
        $('.cost-title-container').show().html("<span>本周费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span><span>上周费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span>");
        series = getStackSeries(branchs, datas, 0, chartType);
        break;
      case '4':
        let flaga = 0;
        if (dateArray[0].substring(0, 7) === dateArray[1].substring(0, 7) && dateArray[1].substring(0, 7) === new Date().format('yyyy-MM')) {
          xAxisData = [new moment(dateArray[0]).format('YYYY-MM'), new moment(dateArray[1]).subtract(1, 'months').format('YYYY-MM')];
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
          $('.usage-title-container').show().html("<span>本月用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span><span>上月用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span>");
          $('.cost-title-container').show().html("<span>本月费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span><span>上月费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span>");
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
        position: 'right'
      },
      series: series
    };
    let areaFgpChart = echarts.init(document.getElementById(chartDom), e_macarons);
    areaFgpChart.setOption(option, true);
  };
  let generateFgpPieChart = function (chartDom, fgpDatas, dateArray, dateType, chartType, title) {
    let datas = [];
    let seriesColor = [];
    let branchs = _.map(fgpDatas, a => a.name);
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
        left: 20
      },
      tooltip: {
        trigger: 'item',
        formatter: function(data){
          return `${data.seriesName} <br/>${data.name} (${numberFormat(data.value)}` + (chartType === 0 ? searchResult.unit : '元') + ")";
        },
        padding: [5, 5, 5, 10]
      },
      legend: {
        orient: 'vertical',
        right: 20,
        data: legend
      },
      calculable: true,
      series: [{
        name: title,
        type: 'pie',
        radius: '55%',
        center: ['50%', '50%'],
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
  };
  let generateMeterStackChart = function (chartDom, datas, dateArray, dateType, chartType) {
    let xAxisData = [];
    let series = [];
    let nowbranchs = _.map(datas.now_data_list, a => a.name);
    let lastbranchs = _.map(datas.last_data_list, a => a.name);
    let branchs = _.merge(nowbranchs, lastbranchs);
    switch (dateType) {
      case '2':
        let flag = 0;
        if (dateArray[0].substring(0, 10) === dateArray[1].substring(0, 10) && dateArray[1].substring(0, 10) === new Date().format('yyyy-MM-dd')) {
          xAxisData = [new Date(dateArray[0]).format('yyyy-MM-dd'), new Date(dateArray[1]).addDays(-1).format('yyyy-MM-dd')];
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
          $('.meter-usage-title-container').show().html("<span>本日用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span><span>昨日用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span>");
          $('.meter-cost-title-container').show().html("<span>本日费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span><span>昨日费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span>");
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
        xAxisData = [getWeek().monday.substring(0, 10) + ' 至 ' + getWeek().sunday.substring(0, 10), new Date(getWeek().monday).addDays(-7).format('yyyy-MM-dd') + ' 至 ' + new Date(getWeek().sunday).addDays(-7).format('yyyy-MM-dd')];
        $('.meter-usage-title-container').show().html("<span>本周用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span><span>上周用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span>");
        $('.meter-cost-title-container').show().html("<span>本周费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span><span>上周费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span>");
        series = getStackSeries(branchs, datas, 0, chartType);
        break;
      case '4':
        let flaga = 0;
        if (dateArray[0].substring(0, 7) === dateArray[1].substring(0, 7) && dateArray[1].substring(0, 7) === new Date().format('yyyy-MM')) {
          xAxisData = [new moment(dateArray[0]).format('YYYY-MM'), new moment(dateArray[1]).subtract(1, 'months').format('YYYY-MM')];
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
          $('.meter-usage-title-container').show().html("<span>本月用量：" + numberFormat(nowUsageSum.toFixed(3)) + searchResult.unit + "</span><span>上月用量：" + numberFormat(lastUsageSum.toFixed(3)) + searchResult.unit + "</span>");
          $('.meter-cost-title-container').show().html("<span>本月费用：" + numberFormat(nowCostSum.toFixed(3)) + "元</span><span>上月费用：" + numberFormat(lastCostSum.toFixed(3)) + "元</span>");
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
        position: 'right'
      },
      series: series
    };
    let meterFgpChart = echarts.init(document.getElementById(chartDom), e_macarons);
    meterFgpChart.setOption(option, true);
  };
  let generateMeterFgpPieChart = function (chartDom, fgpDatas, dateArray, dateType, chartType, title) {
    let datas = [];
    let seriesColor = [];
    let branchs = _.map(fgpDatas, a => a.name);
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
        left: 20
      },
      tooltip: {
        trigger: 'item',
        formatter: function (data){
          return `${data.seriesName} <br/>${data.name} (${numberFormat(data.value)}` + (chartType === 0 ? searchResult.unit : '元') + ")";
        },
        padding: [5, 5, 5, 10]
      },
      legend: {
        orient: 'vertical',
        right: 20,
        data: legend
      },
      calculable: true,
      series: [{
        name: title,
        type: 'pie',
        radius: '55%',
        center: ['50%', '60%'],
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
  };
  let generatePieChart = function () {
    let datas = [];
    let legends = [];
    _.each(searchResult.datas, data => {
      let sumVal = {
        name: data.meter_name,
        value: data.sum_val ? data.sum_val : 0
      };
      datas.push(sumVal);
      legends.push(data.meter_name);
    });
    let option = generatePieForAggregateData(legends, datas, searchResult.unit);
    if (analysisChart) analysisChart.clear();
    analysisChart = echarts.init(document.getElementById('chart-instance'), e_macarons);
    analysisChart.setOption(option, true);
    window.onresize = analysisChart.resize;
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
      "plugins": ["types", "search", "crrm", "state"]
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
          let exist = _.find(areaConfigureMeters, a=>a.id === node.id);
          if(exist){
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
    $('.meter-list').html(templateHtml);
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
    let fgp = _.find(areaSubscribeModule, a => a.key === '_AreaFgpStatistics');
    if (fgp) {
      $('.area-fgp').show();
      if ($('.content-right')[0].scrollHeight > $('.content-right')[0].clientHeight)
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
      if ($('.content-right')[0].scrollHeight > $('.content-right')[0].clientHeight)
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
              esdpec.framework.core.getJsonResult('dataanalysis/getareafun?areaId=' + currentSelectedNode.id, function (response) {
                if (response.IsSuccess) {
                  areaSubscribeModule = response.Content.fun_code ? JSON.parse(response.Content.fun_code) : [];
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
                areaConfigure = response.Content;
                areaConfigure.mfIds = mfIds;
                areaConfigure.meterIds = meterIds;
                loadAreaDetailPage();
              }
            });
          }
        });
      },
      onCancelBut: function () {},
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
            } else if (id === 'binding-data') {
              $('.binding-data').addClass('layui-this');
              $('.binding-data>span').addClass('finish');
              $('.page-configure-func').hide();
              $('.page-binding-data').show();
              if ($('.open .meter-tree').html() === '')
                bindingMeterTree('.open .meter-tree');
              bindSelectedMeterList();
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
      onClose: function () {},
    });
  };
  let generatePieForAggregateData = (xAxisData, seriesData, unit, tooltip = '能耗对比') => {
    let option = {
      title: {
        subtext: '单位：' + unit
      },
      tooltip: {
        trigger: 'item',
        formatter: function (data){
          return  `${data.seriesName} <br/>${data.name} : ${numberFormat(data.value)} (${data.percent}%)`;
        }
      },
      legend: {
        orient: 'horizontal',
        left: 'center',
        data: xAxisData
      },
      series: [{
        name: tooltip,
        type: 'pie',
        center: ['50%', '60%'],
        label: {
          normal: {
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
    let date = $('#datevalue').val();
    let dateArray = date.split(' -- ');
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
    let graphList = _.merge(graphData, datas);
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
        if ($(currentDom).is(':checked') == true) {
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
    if(parentId === parent) return true;
    if(parent === '#') return false;
    isParentNode(parentId, parent);
  };
  let checkElementInVisiable = () => {
    if($(window).scrollTop() > ($('#list-body').offset().top + $('#list-body').outerHeight() - 100)) {
      $('.param-position>.list-body').show();
    } else { 
      $('.param-position>.list-body').hide();
    }
  };

  $('.main-content .content-right').on('scroll', function(e) {
    e.stopPropagation();
    if(currentSelectedNode.modeltype !== 'area') checkElementInVisiable();
  });

  $('#onshowmeterinfo').on('click', function (e) {
    e.stopPropagation();
    $('.meter-info-container').toggleClass('close');
    if ($('.meter-info-container').hasClass('close')) {
      $('.meter-info-container').hide(300);
      $('#onshowmeterinfo>span:first-of-type').html('展开表计详情<i class="icon iconfont icon-xiaotuziCduan_"></i>');
    } else {
      $('.meter-info-container').show(300);
      $('#onshowmeterinfo>span:first-of-type').html('收起表计详情<i class="icon iconfont icon-xiaotuziCduan_1"></i>');
    }
  });

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

  $('.btn-grp .btn').on('click', function (e) {
    e.stopPropagation();
    const currentDom = e.currentTarget;
    _.each($('.btn-grp .btn'), item => {
      if ($(item).attr('data-value') !== $(currentDom).attr('data-value')) {
        $(item).removeClass('date-active');
      }
    });
    $(currentDom).toggleClass('date-active');
    let parameter = _.find(currentMeterParameters, a => a.type === 0 && a.isChecked);
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
          break;
        case '3':
          $('.date-grp').hide();
          break;
        case '4':
          $('.date-grp').show();
          $('#day').addClass('hidden');
          $('#month').removeClass('hidden');
          $('#year').addClass('hidden');
          break;
        case '5':
          $('.date-grp').show();
          $('#day').addClass('hidden');
          $('#month').addClass('hidden');
          $('#year').removeClass('hidden');
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
  });

  $('.area-btn-grp .btn').on('click', function (e) {
    e.stopPropagation();
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
    e.stopPropagation();
    const currentDom = e.currentTarget;
    let flag = $(currentDom).attr('data-value');
    if ($(currentDom).hasClass('should-uniq')) {
      $('.operate-grp i.should-uniq').removeClass('btn-active');
      $(currentDom).addClass('btn-active');
    } else {
      $(currentDom).toggleClass('btn-active');
    }
    //TODO
    let chartSeries = [];
    switch (flag) {
      //#region rmb
      case 'rmb':
        if (ifShowPieChart()) return;
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
        generatePieChart();
        return;
      case 'download':

        return;
        //#region tip
      case 'tip':
        if (ifShowPieChart()) return;
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
          }), searchResult.chartXaxisData, $('.show-tip-area').hasClass('btn-active') ? true : false);
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
          }), searchResult.chartXaxisData, $('.show-tip-area').hasClass('btn-active') ? true : false);
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
          }), searchResult.chartXaxisData, $('.show-tip-area').hasClass('btn-active') ? true : false);
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
          }), searchResult.chartXaxisData, $(currentDom).hasClass('btn-active') ? true : false);
          chartSeries = _.concat(chartSeries, costSeries);
        }
        break;
        //#endregion
    }
    generateChart(searchResult.unit, searchResult.chartLegend, searchResult.chartXaxisData, chartSeries, 'area-chart-instance');
  });

  $('.func-tab .layui-tab-title>li').on('click', function (e) {
    e.stopPropagation();
    let currentDom = e.currentTarget;
    $('.func-tab .layui-tab-title>li').removeClass("layui-this");
    $('.func-tab .layui-tab-content>div').hide();
    $(currentDom).addClass('layui-this');
    $('#' + $(currentDom).attr('data-id')).show();
  })

  $('#area-zone .operate-hander').on('click', function (e) {
    e.stopPropagation();
    showModuleConfigureModal();
  });

  $('.content__header--btngrp .module-container').on('click', function (e) {
    e.stopPropagation();
    showModuleConfigureModal();
  });

  $('.content__header--btngrp .alarm-container').on('click', function (e) {
    e.stopPropagation();
    $('.main-content').hide();
    $('.alarm-content').show();
    $('.meterName').addClass('nav-history');
    $('.detail').addClass('nav-history');
    $('#nav-alarm').show();
    $('#item-name').text(currentSelectedNode.text);
  });

  $('.alarm-content>.alarm-header>.navigate-back').on('click', function (e) {
    e.stopPropagation();
    $('.main-content').show();
    $('.alarm-content').hide();
    $('.meterName').removeClass('nav-history');
    $('.detail').removeClass('nav-history');
    $('#nav-alarm').hide();
  });

  $('.comparsion-left>.meter-choose').on('click', function (e) {
    e.stopPropagation();
    if (getSelectParameterLen() > 1) {
      toastr.warning('只能单参数对比');
      return;
    }
    $('#choose-meter-for-comparison').dialogModal({
      onOkBut: function () {
        let nodeIds = $(".open .choose-meter-list").jstree("get_checked");
        nodeIds = _.filter(nodeIds, a=> a !== currentSelectedNode.id);
        let nodes = _.filter(meterDataList, a => _.includes(nodeIds, a.id) && a.modeltype !== 'area');
        comparsionSelectedMeters = [];
        comparsionSelectedMeters = _.concat([], nodes);
        let data = {
          comparisonMeterList: comparsionSelectedMeters
        };
        let templateHtml = template('comparsion-right-template', data);
        $('.comparsion-right').html(templateHtml);
        setTimeout(() => {
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
                _.remove(searchResult.datas, a => a.mfid === p.id);
                generateComparisonData(searchResult.meterAndParaMap, searchResult.datas, searchResult.type);
                //generateComparisonChartData();
                if (ifShowPieChart()) {
                  generatePieChart();
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
                $('#pie').removeClass('btn-active').hide();
                $('#bar').addClass('btn-active');
              }
              searchMeterData();
            }
          });
        }, 150);
        searchMeterData();
      },
      onCancelBut: function () {},
      onLoad: function () {
        setTimeout(() => {
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
              _.each(comparsionSelectedMeters, meter => {
                instance.select_node(instance.get_node(meter.id));
              });
              let disableNode = instance.get_node(currentSelectedNode.id);
              instance.select_node(disableNode);
              instance.disable_node(disableNode);
            }).on('select_node.jstree', function(e, data){
              let instance = data.instance;
              let node = data.node.original;
              let nodeIds = $(".open .choose-meter-list").jstree("get_checked");
              if(nodeIds.length > 6){
                toastr.warning('对比仪表个数不能超过6个');
                instance.deselect_node(instance.get_node(node.id));
                return;
              }
            }).on('deselect_node.jstree', function (e, data) {
              let instance = data.instance;
              let node = data.node.original;
              if(node.modeltype === 'area' && isParentNode(node.id, currentSelectedNode.id)){
                setTimeout(()=>{
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
    e.stopPropagation();
    let currentDom = e.currentTarget;
    if ($(currentDom).attr('data-toggle') === 'close') {
      $('.exception-box').show();
      $(currentDom).attr('data-toggle', 'open');
      $(currentDom).children(0).children(0).removeClass('icon-xiaotuziCduan_').addClass('icon-xiaotuziCduan_1');
      $('.inException').show();
      let date = $('#datevalue').val();
      let dateArray = date.split(' -- ');
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
      $('#exception-open-history').on('click', function (e) {
        e.stopPropagation();
        $('#exception-history-data').dialogModal({
          onOkBut: function () {},
          onCancelBut: function () {},
          onLoad: function () {
            esdpec.framework.core.getJsonResult('abnormaldata/getdatabypage?mfid=' + mfids.id + '&pagenum=1', function (response) {
              if (response.IsSuccess) {
                generateExceptionHistory(response.Content, mfids.id);
              }
            });
          },
          onClose: function () {},
        });
      });
      $('#exception-filter-rule').on('click', function (e) {
        e.stopPropagation();
        let exceptionItem = {
          mfid: mfids.id
        };
        let time = $('#exception-daycontainer').val();
        let timeArray = time.split(' -- ');
        exceptionItem.stime = timeArray[0] + ' 00:00:01';
        exceptionItem.etime = timeArray[1] + ' 23:59:59';
        let minVal = $('#min-val-input').val();
        let maxVal = $('#max-val-input').val();
        if (minVal !== '') {
          exceptionItem.lt_val = parseFloat(minVal);
        }
        if (maxVal !== '') {
          exceptionItem.gt_val = parseFloat(maxVal);
        }
        if (exceptionItem.lt_val && exceptionItem.gt_val && exceptionItem.lt_val >= exceptionItem.gt_val) {
          toastr.warning('数值范围异常，最大值必须大于最小值');
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
        e.stopPropagation();
        let exceptionItem = {
          mfid: mfids.id
        };
        let time = $('#exception-daycontainer').val();
        let timeArray = time.split(' -- ');
        exceptionItem.stime = timeArray[0] + ' 00:00:01';
        exceptionItem.etime = timeArray[1] + ' 23:59:59';
        let minVal = $('#min-val-input').val();
        let maxVal = $('#max-val-input').val();
        if (minVal !== '') {
          exceptionItem.lt_val = parseFloat(minVal);
        }
        if (maxVal !== '') {
          exceptionItem.gt_val = parseFloat(maxVal);
        }
        if (exceptionItem.lt_val && exceptionItem.gt_val && exceptionItem.lt_val >= exceptionItem.gt_val) {
          toastr.warning('数值范围异常，最大值必须大于最小值');
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
        e.stopPropagation();
        let exceptionItem = {
          mfid: mfids.id
        };
        let time = $('#exception-daycontainer').val();
        let timeArray = time.split(' -- ');
        exceptionItem.stime = timeArray[0] + ' 00:00:01';
        exceptionItem.etime = timeArray[1] + ' 23:59:59';
        let minVal = $('#min-val-input').val();
        let maxVal = $('#max-val-input').val();
        if (minVal !== '') {
          exceptionItem.lt_val = parseFloat(minVal);
        }
        if (maxVal !== '') {
          exceptionItem.gt_val = parseFloat(maxVal);
        }
        if (exceptionItem.lt_val && exceptionItem.gt_val && exceptionItem.lt_val >= exceptionItem.gt_val) {
          toastr.warning('数值范围异常，最大值必须大于最小值');
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
      $('.graph-data-list tr.shouldremove').remove();
    }
  });

  $('#min-val-input').on('input', function (e) {
    e.stopPropagation();
    let minVal = e.target.value.replace(/[^\d]/g, '');
    $('#min-val-input').val(minVal);
    if (minVal === '') {
      minVal = '--';
    }
    $('#minval').text(minVal);
  });

  $('#max-val-input').on('input', function (e) {
    e.stopPropagation();
    let maxVal = e.target.value.replace(/[^\d]/g, '');
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
    if($(current).hasClass('dialogModal open')) $('.dialogModal.open').remove();
  });

  layui.use('laydate', function () {
    let laydate = layui.laydate;
    laydate.render({
      elem: '#daycontainer',
      btns: ['confirm'],
      range: '--',
      format: 'yyyy-MM-dd',
      type: 'date',
      value: new Date().format('yyyy-MM-dd') + ' -- ' + new Date().format('yyyy-MM-dd'),
      done: (value, date) => {
        let truthValue = value.split('--');
        $('#datevalue').val(_.trim(truthValue[0]) + ' 00:00:00 -- ' + truthValue[1] + ' 23:59:59');
        searchMeterData();
      }
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
        instance.select_node(target);
      }).on("select_node.jstree", function (e, data) {
        let node = data.node;
        let nodeId = node.original.id;
        currentSelectedNode = node.original;
        $('.meterName').text(node.original.text);
        $('.content__header--title').text(node.original.text + ' - 仪表数据详情');
        if (node.original.modeltype === 'area') {
          currentMeterParameters = [];
          areaWindowInteractive();
          esdpec.framework.core.getJsonResult('dataanalysis/getareafun?areaId=' + nodeId, function (response) {
            if (response.IsSuccess) {
              areaSubscribeModule = response.Content.fun_code ? JSON.parse(response.Content.fun_code) : [];
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
              areaConfigure = response.Content;
              areaConfigure.mfIds = mfIds;
              areaConfigure.meterIds = meterIds;
              loadAreaDetailPage();
            }
          });
        } else {
          meterWindowInteractive();
          esdpec.framework.core.getJsonResult('dataanalysis/getparasbymeterid?meterId=' + nodeId, function (response) {
            if (response.IsSuccess) {
              currentMeterParameters = response.Content;
              let firstAggreate = _.find(currentMeterParameters, a => a.type === 0);
              firstAggreate.isChecked = true;
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
              searchMeterData();
              setTimeout(() => {
                $('.parameter-right>div.para-item').on('click', function (e) {
                  e.stopPropagation();
                  let currentDom = e.currentTarget;
                  let unit = $(currentDom).attr('data-unit');
                  let type = parseInt($(currentDom).attr('data-type'));
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
                    _.each(currentMeterParameters, a=>{
                      if(a.id === id) a.isChecked = true;
                      else a.isChecked = false;
                    });
                    if (type !== 0) {
                      $('.operate-grp>i.should-uniq').removeClass('btn-active');
                      $('.operate-grp>i.should-uniq').first().addClass('btn-active');
                    }
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
                    if (chooseNode.isChecked && checkedNodes.length <= 1) {
                      toastr.warning('至少需要选择一个参数');
                      return;
                    }
                    chooseNode.isChecked = !chooseNode.isChecked;
                    $(currentDom).toggleClass('para-active');
                  }
                  searchMeterData();
                });
              }, 100);
            }
          });
          esdpec.framework.core.getJsonResult('dataanalysis/getmeterinfobymeterid?meterId=' + nodeId, function (response) {
            if (response.IsSuccess) {
              let meterInfo = response.Content;
              meterInfo.area = getMeterBelongArea(nodeId);
              meterInfo.status = getMeterStatus(meterInfo.state);
              let templateData = {
                data: meterInfo
              }
              let templateHtml = template('meter-info-template', templateData);
              $('.info-table').html(templateHtml);
            }
          });
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
        }, 100);
      });
    }
  });

  toastr.options = _.merge(toastr.options, {
    positionClass: "toast-top-center",
    closeButton: true,
    closeDuration: 100,
    closeMethod: 'fadeOut',
    closeEasing: 'swing'
  });
});