import React, { useEffect, useState, useRef } from "react";
import * as dc from "dc";
//import * as d3 from "d3";
import * as crossfilter from "crossfilter2/crossfilter";
import Grid from '@material-ui/core/Grid';
import * as d3module from 'd3'
import d3tip from 'd3-tip'
import { legend } from "dc";
const d3 = {
    ...d3module,
    tip: d3tip
}

const Compose = ({ params }) => {
    const div = React.useRef(null);
    const div1 = React.useRef(null);
    var tipvalue = 'title';
    var rowtip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) {

            var split = tipvalue.split("\n");
            //var retdiv = '<div>';
            var retdiv = '<div class="class_tooltip">';
            for (var i = 0; i < split.length; i++) {
                retdiv = retdiv + split[i] + '<br>';
            }
            retdiv = retdiv + '</div>';
            return retdiv;
            //return '<div>'+tipvalue+'</div>';
        });
    const tipremove = () => {
        var tipelements = document.getElementsByClassName("class_tooltip");
        var tiplength = tipelements.length;
        for (var i = tiplength - 1; i >= 0; i--) {
            tipelements[i].remove();
        }
    }
    // let compositeChart = null
    React.useEffect(() => {

        var experiments = params.Uploaded_file
        var Groups = [];
        var ndx = crossfilter(experiments),

            runDimension = ndx.dimension(function (d) {
                //return d.Run;
                // return [d[params.XAxis],d[params.GroupBy]];
                return d[params.XAxis];
            });

        var value = params.GroupByValues;
        for (let i = 0; i < value.length; i++) {
            window['grps' + i] = runDimension.group().reduceSum(function (d) { return d[params.GroupBy] == value[i] ? d[params.YAxis] : 0 });
            // window['grps' + i] = runDimension.group().reduce(
            //     function (p, v) {
            //         ++p.count;
            //         p[params.YAxis] = v[params.GroupBy] === value[i] ? v[params.YAxis] : 0;

            //         return p
            //     },
            //     function (p, v) {
            //         --p.count;

            //         p[params.YAxis] = v[params.GroupBy] === value[i] ? v[params.YAxis] : 0;
            //         return p
            //     },
            //     ()=>({
            //         [params.YAxis]:0
            //     }))
            Groups.push('grps' + i)

        }



        var fmt = d3.format('02d');
        var table_ = ndx.dimension(function (d) { return d[params.XAxis] });
        let compositeChart = new dc.compositeChart(div.current)
        var datatabel = new dc.dataTable(div1.current);
        var max = Math.max(...experiments);
        let barPadding;
        const BAR_PADDING = 0.1;
        const RANGE_BAND_PADDING = 0;
        const OUTER_RANGE_BAND_PADDING = 0;
        var offsetHeight = document.getElementById('Charts').offsetHeight;
        var offsetWidth = document.getElementById('Charts').offsetWidth;
        let sizing = chart => {
            chart.width(offsetWidth).height(offsetHeight).redraw();
        };
        let resizing = chart => window.onresize = () => sizing(chart);

        let scaleSubChartBarWidth = chart => {
            let subs = chart.selectAll(".sub");
            if (typeof barPadding === 'undefined') { // first draw only
                barPadding = BAR_PADDING / subs.size() * 100;
                barPadding = barPadding / 2;
            }

            let startAt, endAt, subScale = d3.scaleLinear().domain([0, subs.size()]).range([0, 100]);

            subs.each(function (d, i) {
                startAt = subScale(i + 1) - subScale(1);
                endAt = subScale(i + 1);
                startAt += barPadding;
                endAt -= barPadding;
                d3.select(this)
                    .selectAll('rect')
                    .attr("clip-path", `polygon(${startAt}% 0%, ${endAt}% 0%, ${endAt}% 100%, ${startAt}% 100%)`);
            });
        };
        var div2 = d3.select("#Charts").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("font-family", params.TooltipFont)
            .style("color", params.TooltipColor)
            .style("font-size", params.TooltipSize + "px")
            .style("background-color", params.TooltipBGColor)
            .style("border", params.TooltipThickness + 'px ' + params.TooltipTickColor + ' solid')

        var charts = []
        for (let i = 0; i < Groups.length; i++) {
            window['Chart' + i] = dc.barChart(compositeChart)
                .gap(10)
                //  .renderLabel(true)
                // .yAxisPadding("12%")
                //.useRightYAxis(true)
                .brushOn(false)

                .colors(d3.scaleOrdinal([getRandomColor()]))
                .dimension(runDimension)
                .group(window[Groups[i]], value[i])
                // .addFilterHandler(function (filters, filter) {
                //     debugger
                //     return [filter, 'South'];
                // })

                .title(function (y) {
                    var tooltip = params.XAxis + ': ' + y.key + '\n'
                        + params.YAxis + ': ' + y.value

                    return ''
                })

            charts.push(window['Chart' + i])
        }
        let PadTop, PadRight, PadBottom, PadLeft = 0
        if (params.PadTop === undefined || params.PadTop === '') PadTop = 0; else PadTop = params.PadTop
        if (params.PadRight === undefined || params.PadRight === '') PadRight = 0; else PadRight = params.PadRight
        if (params.PadBottom === undefined || params.PadBottom === '') PadBottom = 0; else PadBottom = params.PadBottom
        if (params.PadLeft === undefined || params.PadLeft === '') PadLeft = 0; else PadLeft = params.PadLeft
        compositeChart
            .margins({ top: parseInt(10) + parseInt(PadTop), right: parseInt(30) + parseInt(PadRight), bottom: parseInt(50) + parseInt(PadBottom), left: parseInt(30) + parseInt(PadLeft) })

            .width(params.Width_)
            .height(params.Heigth_)

            .elasticY(true)
            .shareTitle(false)
            .dimension(runDimension)
            .group(window['grps0'])
            ._rangeBandPadding(RANGE_BAND_PADDING)
            ._outerRangeBandPadding(OUTER_RANGE_BAND_PADDING)
            .transitionDuration(1000)
            .brushOn(false)
            .legend(new legend().x(0).y(10).itemHeight(13).gap(5).horizontal(params.LengendPosition).legendText(function (d, i) { return d.name; }))
            .x(d3.scaleOrdinal())
            .xUnits(dc.units.ordinal)
            .y(d3.scaleLinear().domain([0, max]))
            .compose(charts)

            .on("pretransition", chart => {
                scaleSubChartBarWidth(chart)
            })
            .on("preRedraw", chart => {
                chart.rescale();
            })
            .on("preRender", chart => {
                chart.rescale();
            })
            .renderlet(function (chart) {
                //X-Axis 
                chart.selectAll("g.x g.tick text")
                    .attr('dx', params.Rotate === undefined || params.Rotate === '' ? '' : '-10')
                    .attr('text-anchor', params.Rotate === undefined || params.Rotate === '' ? '' : 'end')
                    .attr('transform', `rotate(${params.Rotate})`)
                    .style("font-family", params.xFont)
                    .style("color", params.xColor)
                    .style("font-size", params.xSize + "px")

                //y-Axis 
                chart.selectAll("g.y g.tick text")
                    .attr('dx', '-10')
                    .attr('text-anchor', 'end')
                    // .attr('transform', `rotate(${params.Rotate})`)
                    .style("font-family", params.yFont)
                    .style("color", params.yColor)
                    .style("font-size", params.ySize + "px")

                //X-Axis Label
                chart.selectAll(".x-axis-label")
                    .style("font-family", params.xlFont)
                    .style("fill", params.xlColor)
                    .style("font-size", params.xlSize + "px")
                    .style("display", params.Axesswatch === undefined ? 'none' : params.Axesswatch)


                //Y-Axis Label
                chart.selectAll(".y-axis-label")
                    .style("font-family", params.ylFont)
                    .style("fill", params.ylColor)
                    .style("font-size", params.ylSize + "px")
                    .style("display", params.Axesswatch === undefined ? 'none' : params.Axesswatch)

            })
            .yAxisLabel(params.YAxisLabel)
            .xAxisLabel(params.XAxisLabel)
            .yAxis().tickFormat(function (v) { return BMK(v); })



        datatabel
            .width(300)
            .height(480)
            .dimension(table_)
            //  .group(function (d) { return d.Region })
            .size(Infinity)
            .group(function (d) { return '' })
            .showGroups(false)
            .showSections(false)
            // .section(d => {
            //     return d['Region'] == 'South'

            // })
            //.showGroups(true)
            // .filter(function(d) { 
            //     console.log('sdf',d)
            //     return d.Region == 'South'})
            .columns(params.XAxis_)
            .sortBy(function (d) {
                return [fmt(+d.Region)];
            })
            .order(d3.ascending)

            .on('preRender', update_offset)
            .on('preRedraw', update_offset)
            .on('pretransition', display)

        dc.renderAll();
        // dc.redrawAll();
        setTimeout(() => {
            barlabelpostion();
        }, 1000);
        // sizing(compositeChart);
        resizing(compositeChart);

        d3.selectAll("g.dc-legend-item text")
            // .style
            .style("font-family", params.LegendFont)
            .style("fill", params.LegendColor)
            .style("font-size", params.LegendSize)

        d3.selectAll(".dc-legend")
            .style("display", params.Legendswatch === undefined ? 'none' : params.Legendswatch)
        d3.select('body').on('mouseover', function () {

            d3.selectAll('rect.bar')
                .on("mouseover", function (d) {
                    div2.transition()
                        .duration(500)
                        .style("opacity", params.Tooltipswatch)
                    // .style("font-family", params.TooltipFont)
                    // .style("color", params.TooltipColor)
                    // .style("font-size", params.TooltipSize + "px")
                    // .style("background-color", params.TooltipBGColor)
                    // .style("border", params.TooltipThickness + 'px ' + params.TooltipTickColor + ' solid')
                    if (params.TooltipContent === 'X') {
                        div2.html('<div><div><b>' + params.XAxis + '</b> : ' + d.target.__data__.x + '</div><div')
                    }
                    else if (params.TooltipContent === 'Y') {
                        div2.html('<div><div><b>' + params.YAxis + '</b> : ' + d.target.__data__.y.toFixed(2) + '</div><div')
                    }
                    else if (params.TooltipContent === 'Group') {
                        div2.html('<div><div><b>' + params.GroupBy + '</b> : ' + d.target.__data__.layer + '</div><div>')
                    }
                    else if (params.TooltipContent === 'All') {
                        div2.html('<div><div><b>' + params.GroupBy + '</b> : ' + d.target.__data__.layer + '</div><div><b>'
                            + params.XAxis + '</b> : ' + d.target.__data__.x + '</div><div><b>'
                            + params.YAxis + '</b> : ' + d.target.__data__.y.toFixed(2) + '</div></div>')
                    }

                    div2.style("left", (d.pageX) + "px")
                        .style("top", (d.pageY - 70) + "px");
                })
                .on("mouseout", function (d) {
                    div2.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
        });

        function barlabelpostion() {
            var list = document.getElementsByClassName('barLabel');
            for (var i = 0; i < list.length; i++) {
                var value = list[i].attributes.x.value;
                //console.log(list[i].innerHTML);
                //if(i % 2 == 0) {
                if (list[i].__data__.layer == "grp4 Bar") {
                    //console.log("The number is even.");
                    list[i].attributes.x.value = parseFloat(value) - 18;
                } else {
                    //if (list[i].innerHTML != "$0.0")
                    list[i].attributes.x.value = parseFloat(value) - 7;
                }
            }
        }

        function getRandomColor() {
            var letters = 'BCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * letters.length)];
            }
            return color;

            // var colorCode = "1234567890abcdef";
            // var color = "#";
            // for (var i = 0; i < 6; i++) {
            //     color += colorCode.charAt(Math.floor(Math.random() * colorCode.length));
            // }
            // return color
        }
        function BMK(labelValue) {
            // Nine Zeroes for Billions
            return Math.abs(Number(labelValue)) >= 1.0e9
                ? Math.abs(Number(labelValue)) / 1.0e9 + "B"
                : // Six Zeroes for Millions
                Math.abs(Number(labelValue)) >= 1.0e6
                    ? Math.abs(Number(labelValue)) / 1.0e6 + "M"
                    : // Three Zeroes for Thousands
                    Math.abs(Number(labelValue)) >= 1.0e3
                        ? Math.abs(Number(labelValue)) / 1.0e3 + "K"
                        : Math.abs(Number(labelValue));
        }
        var ofs = 0, pag = 100;

        function update_offset() {
            var totFilteredRecs = ndx.groupAll().value();
            pag = totFilteredRecs;
            var end = ofs + pag > totFilteredRecs ? totFilteredRecs : ofs + pag;
            if (ofs == undefined || pag == undefined) {
                ofs = 0;
                pag = totFilteredRecs;
            }
            ofs = ofs >= totFilteredRecs ? Math.floor((totFilteredRecs - 1) / pag) * pag : ofs;
            ofs = ofs < 0 ? 0 : ofs;
            datatabel.beginSlice(ofs);
            datatabel.endSlice(ofs + pag);
        }
        function display() {
            var totFilteredRecs = ndx.groupAll().value();
            var end = ofs + pag > totFilteredRecs ? totFilteredRecs : ofs + pag;
            d3.select('#begin')
                .text(end === 0 ? ofs : ofs + 1);
            d3.select('#end')
                .text(end);
            d3.select('#last')
                .attr('disabled', ofs - pag < 0 ? 'true' : null);
            d3.select('#next')
                .attr('disabled', ofs + pag >= totFilteredRecs ? 'true' : null);
            d3.select('#size').text(totFilteredRecs);
            if (totFilteredRecs != ndx.size()) {
                d3.select('#totalsize').text("(filtered Total: " + ndx.size() + " )");
            } else {
                d3.select('#totalsize').text('');
            }

            // d3.selectAll('rect.bar')
            // .on('click',function(d){
            //     debugger
            //     return d.currentTarget.__data__.layer+
            // })
        }
        function next() {
            ofs += pag;
            update_offset();
            datatabel.redraw();
        }
        function last() {
            ofs -= pag;
            update_offset();
            datatabel.redraw();
        }
    })
    React.useEffect(() => {

    })

    const Chartheader = () => {
        return (
            <div style={{ backgroundColor: params.Compositeswatch === 'show' ? params.BGColor : '', display: params.Titleswatch === undefined ? 'none' : params.Titleswatch }}>
                <span style={{ fontFamily: params.TitleFont, fontSize: params.TitleSize, color: params.TitleColor }}>{params.Title}</span>
            </div>
        );
    };

    return (
        <Grid item xs={12} sm={12} md={12} xl={4} lg={12} >
            <Grid item className="cardbox">
                <Chartheader />
                <div style={{ backgroundColor: params.Compositeswatch === 'show' ? params.BGColor : '' }}>
                    <div ref={div} id="Charts" className="boxcenter">
                    </div>
                </div>
            </Grid>
            <Grid item className="cardbox">
                <div id="table-scroll" className="table-scroll">
                    <div className="table-wrap">

                        <table ref={div1} className="main-table">
                        </table>
                    </div>
                    <div id="paging" style={{ float: "right" }}>
                        Showing <span id="begin"></span>-<span id="end"></span> of <span id="size"></span> <span id="totalsize" style={{ display: 'none' }}></span>
                    </div>
                </div>
            </Grid>
        </Grid>
    );
}
export default Compose