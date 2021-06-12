import React, {Component} from 'react'
import style from './../styles/styles.less';

// https://underscorejs.org/
import _ from 'underscore';

// https://github.com/topojson/topojson
import * as topojson from 'topojson-client';

// https://d3js.org/
import * as d3 from 'd3';

import constants from './Constants.jsx';
import languages from './Languages.jsx';

let interval, g, path, features, svg;

let width = 800,
    height = 800,
    p1, p2 = [0, 0], 
    r1, r2 = [0, 0, 0],
    tilt = 20;

let coordinates = [{
  'date':'April 3, 1993',
  'year':'1993',
  'president_us':'Bill Clinton',
  'president_ru':'Boris Yeltsin',
  'city':'Vancouver',
  'country':'Canada',
  'lat':49.2827,
  'lng':-123.1207
},{
  'date':'March 21, 1997',
  'year':'1997',
  'president_us':'George W. Bush',
  'president_ru':'Vladimir Putin',
  'city':'Helsinki',
  'country':'Finland',
  'lat':60.1699,
  'lng':24.9384
},{
  'date':'June 16, 2001',
  'year':'2001',
  'president_us':'Bill Clinton',
  'president_ru':'Boris Yeltsin',
  'city':'Ljubljana',
  'country':'Slovenia',
  'lat':46.0569,
  'lng':14.5058
},{
  'date':'February 24, 2005',
  'year':'2005',
  'president_us':'George W. Bush',
  'president_ru':'Vladimir Putin',
  'city':'Bratislava',
  'country':'Slovakia',
  'lat':48.1486,
  'lng':17.1077
},{
  'date':'April 8, 2010',
  'year':'2010',
  'president_us':'Barack Obama',
  'president_ru':'Dmitry Medvedev',
  'city':'Prague',
  'country':'Czechia',
  'lat':50.0755,
  'lng':14.4378
},{
  'date':'July 16, 2018',
  'year':'2018',
  'president_us':'Donald Trump',
  'president_ru':'Vladimir Putin',
  'city':'Helsinki',
  'country':'Finland',
  'lat':60.1699,
  'lng':24.9384
},{
  'date':'June 16, 2021',
  'year':'2021',
  'president_us':'Joe Biden',
  'president_ru':'Vladimir Putin',
  'city':'Geneva',
  'country':'Switzerland',
  'lat':46.2044,
  'lng':6.1432
}];


// https://bl.ocks.org/mbostock/3757125
// https://observablehq.com/@d3/world-tour
// https://bl.ocks.org/Andrew-Reid/d95e59b71544706515632c4b7fb0402a

// https://github.com/d3/d3-geo-projection
let projection = d3.geoOrthographic().fitExtent([[10, 10], [width - 10, height - 10]], {type: 'Sphere'});

// .center([0,25]).scale(160);
const data_file_name = 'data - data.csv';

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      data:{},
      id:-1
    }
  }
  componentDidMount() {
    d3.csv('./data/' + data_file_name).then((data) => {
      this.setState((state, props) => ({
        data:data
      }), this.drawMap);
    })
    .catch(function (error) {
    })
    .then(function () {
    });
  }
  componentWillUnMount() {
    clearInterval(interval);
  }
  drawMap() {
    svg = d3.select('.' + style.map_container).append('svg').attr('width', width).attr('height', height);
    path = d3.geoPath().projection(projection);
    g = svg.append('g');

    d3.json('./data/countries-110m.topojson').then((topology) => {
      features = topojson.feature(topology, topology.objects.countries).features
      g.selectAll('path').data(features)
        .enter().append('path')
        .attr('d', path)
        .attr('class', style.path)
        .style('stroke', (d, i) => {
          return this.getAreaStroke(d.properties.name);
        })
        .attr('fill', (d, i) => {
          return this.getAreaFill(d.properties.name);
        });

      g.selectAll('.centroid').data(coordinates)
        .enter().append('circle')
        .attr('class', 'centroid')
        .attr('fill', '#f00')
        .attr('stroke', '#f00')
        .attr('stroke-width', 0)
        .attr('visibility', (d) => {
          const visible = path({type: 'Point', coordinates: [d.lng, d.lat]});
          return visible ? 'visible' : 'hidden';
        })
        .attr('r', 6)
        .attr('cx', (d) => {
          return projection([d.lng, d.lat])[0];
        })
        .attr('cy', (d) => {
          return projection([d.lng, d.lat])[1];
        });

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('x', (d, i) => {
          
        })
        .attr('y', (d, i) => {
          
        })
        .html('');

      setInterval(() => {
        this.setState((state, props) => ({
          id:state.id + 1
        }), this.changeLocation);
      }, 5000);
    });
  }
  getAreaStroke(area) {
    return '#999';
  }
  getAreaFill(area) {
    return '#eee';
  }
  changeLocation() {
    if (coordinates[this.state.id]) {
      g.selectAll('text').html('')
      p1 = p2, p2 = d3.geoCentroid(features.find((({properties}) => properties.name === coordinates[this.state.id].country)));
      r1 = r2, r2 = [-p2[0], tilt - p2[1], 0];
      const iv = Versor.interpolateAngles(r1, r2);
      
      d3.transition().duration(1500).tween('render', () => t => {
        projection.rotate(iv(t));
        svg.selectAll('path').attr('d', path)
        g.selectAll('.centroid')
          .attr('visibility', (d) => {
            const visible = path({type: 'Point', coordinates: [d.lng, d.lat]});
            return visible ? 'visible' : 'hidden';
          })
          .attr('cx', (d) => {
            return projection([d.lng, d.lat])[0];
          })
          .attr('cy', (d) => {
            return projection([d.lng, d.lat])[1];
          })
          .attr('fill', (d) => {
            return (d.country === coordinates[this.state.id].country) ? '#0f0' : '#f00' 
          })
          .attr('stroke', (d) => {
            return (d.country === coordinates[this.state.id].country) ? '#0f0' : '#f00' 
          });
      }).on('end', () => this.showLocationMeta());
    }
    else {
      clearInterval(interval);
    }
  }
  showLocationMeta() {
    g.selectAll('text')
      .attr('x', projection([coordinates[this.state.id].lng, coordinates[this.state.id].lat])[0])
      .attr('y', projection([coordinates[this.state.id].lng, coordinates[this.state.id].lat])[1] + 5)
      .html('<tspan style="text-transform: uppercase; font-size: 18px;" dy="1.2em "x="'+projection([coordinates[this.state.id].lng, coordinates[this.state.id].lat])[0]+'">' + coordinates[this.state.id].year + ': ' + coordinates[this.state.id].city + '</tspan><tspan style="font-size: 16px;" dy="1.2em "x="'+projection([coordinates[this.state.id].lng, coordinates[this.state.id].lat])[0]+'">' + coordinates[this.state.id].president_us + ' and ' + coordinates[this.state.id].president_ru + '</tspan>');
  }
  render() {
    return (
      <div className={style.plus}>
        <div>
          <div className={style.map_container}></div>
        </div>
        <div className={style.meta_container}>
        </div>
      </div>
    );
  }
}

class Versor {
  static fromAngles([l, p, g]) {
    l *= Math.PI / 360;
    p *= Math.PI / 360;
    g *= Math.PI / 360;
    const sl = Math.sin(l), cl = Math.cos(l);
    const sp = Math.sin(p), cp = Math.cos(p);
    const sg = Math.sin(g), cg = Math.cos(g);
    return [
      cl * cp * cg + sl * sp * sg,
      sl * cp * cg - cl * sp * sg,
      cl * sp * cg + sl * cp * sg,
      cl * cp * sg - sl * sp * cg
    ];
  }
  static toAngles([a, b, c, d]) {
    return [
      Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * 180 / Math.PI,
      Math.asin(Math.max(-1, Math.min(1, 2 * (a * c - d * b)))) * 180 / Math.PI,
      Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * 180 / Math.PI
    ];
  }
  static interpolateAngles(a, b) {
    const i = Versor.interpolate(Versor.fromAngles(a), Versor.fromAngles(b));
    return t => Versor.toAngles(i(t));
  }
  static interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    a2 -= a1, b2 -= b1, c2 -= c1, d2 -= d1;
    const x = new Array(4);
    return t => {
      const l = Math.hypot(x[0] = a1 + a2 * t, x[1] = b1 + b2 * t, x[2] = c1 + c2 * t, x[3] = d1 + d2 * t);
      x[0] /= l, x[1] /= l, x[2] /= l, x[3] /= l;
      return x;
    };
  }
  static interpolate([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    let dot = a1 * a2 + b1 * b2 + c1 * c2 + d1 * d2;
    if (dot < 0) a2 = -a2, b2 = -b2, c2 = -c2, d2 = -d2, dot = -dot;
    if (dot > 0.9995) return Versor.interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]); 
    const theta0 = Math.acos(Math.max(-1, Math.min(1, dot)));
    const x = new Array(4);
    const l = Math.hypot(a2 -= a1 * dot, b2 -= b1 * dot, c2 -= c1 * dot, d2 -= d1 * dot);
    a2 /= l, b2 /= l, c2 /= l, d2 /= l;
    return t => {
      const theta = theta0 * t;
      const s = Math.sin(theta);
      const c = Math.cos(theta);
      x[0] = a1 * c + a2 * s;
      x[1] = b1 * c + b2 * s;
      x[2] = c1 * c + c2 * s;
      x[3] = d1 * c + d2 * s;
      return x;
    };
  }
}

export default App;