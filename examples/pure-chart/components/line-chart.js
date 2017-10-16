import React from 'react'
import { View, TouchableWithoutFeedback, Text, Animated, Easing, ScrollView } from 'react-native'
import _ from 'lodash'
// UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true)

class LineChart extends React.Component {
  constructor (props) {
    super(props)
    var newState = this.initData(this.props.data)
    this.state = {
      loading: false,
      sortedData: newState.sortedData,
      selectedIndex: null,
      nowHeight: 200,
      nowWidth: 200,
      scrollPosition: 0,
      nowX: 0,
      nowY: 0,
      max: newState.max,
      fadeAnim: new Animated.Value(0),
      guideArray: newState.guideArray
    }

    this.drawCoordinates = this.drawCoordinates.bind(this)
    this.drawCooridinate = this.drawCooridinate.bind(this)
    this.drawSelected = this.drawSelected.bind(this)

    this.initData = this.initData.bind(this)
    this.drawGuideLine = this.drawGuideLine.bind(this)
    this.drawGuideText = this.drawGuideText.bind(this)
    this.drawLabels = this.drawLabels.bind(this)
    this.refineData = this.refineData.bind(this)
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (nextState.sortedData !== this.state.sortedData ||
      nextState.selectedIndex !== this.state.selectedIndex ||
      nextState.scrollPosition !== this.state.scrollPosition) {
      return true
    } else {
      return false
    }
  }

  componentDidMount () {
    Animated.timing(this.state.fadeAnim, { toValue: 1, easing: Easing.bounce, duration: 1000, useNativeDriver: true }).start()
  }

  refineData (dataProp, max) {
    var data = []
    var length = dataProp.length
    var simpleTypeCount = 0
    var objectTypeCount = 0

    for (var i = 0; i < length; i++) {
      var maxClone = max

      if (maxClone === 0) {
        maxClone = 1
      }

      if (typeof dataProp[i] === 'number') {
        simpleTypeCount++
        data.push([i * this.props.gap, dataProp[i] / maxClone * this.props.height, dataProp[i]])
      } else if (typeof dataProp[i] === 'object') {
        if (typeof dataProp[i].y === 'number' && dataProp[i].x) {
          objectTypeCount++
          data.push([i * this.props.gap, dataProp[i].y / maxClone * this.props.height, dataProp[i].y, dataProp[i].x])
        }
      }
    }

    // validate
    var isValidate = false
    if (simpleTypeCount === length || objectTypeCount === length) {
      isValidate = true
    }
    console.log('validate', isValidate, data, max)
    if (isValidate) {
      return data.sort((a, b) => { return a[0] - b[0] })
    } else {
      return []
    }
  }

  initData (dataProp) {
    if (dataProp.length === 0) {
      return {
        sortedData: [],
        max: 0,
        guideArray: []
      }
    }
    var values = []
    dataProp.map((value) => {
      if (typeof value === 'number') {
        values.push(value)
      } else if (typeof value === 'object' && typeof value.y === 'number') {
        values.push(value.y)
      }
    })
    var max = Math.max.apply(null, values)
    console.log('values', values)
    var sortedData = this.refineData(dataProp, max)

    var x = parseInt(max)
    var arr = []
    var length
    var temp
    var postfix = ''
    if (x > -1 && x < 1000) {
      x = Math.round(x * 10)
      temp = 1
    } else if (x >= 1000 && x < 1000000) {
      postfix = 'K'
      x = Math.round(x / 100)
      temp = 100
    } else if (x >= 1000000 && x < 1000000000) {
      postfix = 'M'
      x = Math.round(x / 100000)
      temp = 100000
    } else {
      postfix = 'B'
      x = Math.round(x / 100000000)
      temp = 100000000
    }
    length = x.toString().length

    x = _.round(x, -1 * length + 1) / 10
    var first = parseInt(x.toString()[0])

    if (first > -1 && first < 3) { // 1,2
      x = 2.5 * x / first
    } else if (first > 2 && first < 6) { // 4,5
      x = 5 * x / first
    } else {
      x = 10 * x / first
    }
    for (var i = 1; i < 6; i++) {
      var v = x / 5 * i
      arr.push([v + postfix, v * temp * 10 / max * this.props.height])
    }
    return {
      sortedData: sortedData,
      max: max,
      fadeAnim: new Animated.Value(0),
      selectedIndex: null,
      nowHeight: 200,
      nowWidth: 200,
      scrollPosition: 0,
      nowX: 0,
      nowY: 0,
      guideArray: arr
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.data !== this.props.data) {
      // LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)

      this.setState(this.initData(nextProps.data), () => {
        Animated.timing(this.state.fadeAnim, { toValue: 1, easing: Easing.bounce, duration: 1000, useNativeDriver: true }).start()
      })
    }
  }

  getTransform (rad, width) {
    var x = (0 - width / 2) * Math.cos(rad) - (0 - width / 2) * Math.sin(rad)
    var y = (0 - width / 2) * Math.sin(rad) + (0 - width / 2) * Math.cos(rad)

    return [ {translateX: (-1 * x) - width / 2}, {translateY: (-1 * y) + width / 2}, { rotate: rad + 'rad' } ]
  }

  drawCooridinate (index, start, end, backgroundColor = '#FFFFFF00', isBlank = false, lastCoordinate = false) {
    var key = 'line' + index
    var dx = end[0] - start[0]
    var dy = end[1] - start[1]
    var size = Math.sqrt(dx * dx + dy * dy)
    var angleRad = -1 * Math.atan2(dy, dx)
    var height
    var top
    var topMargin = 20

    if (start[1] > end[1]) {
      height = start[1]
      top = -1 * size
    } else {
      height = end[1]
      top = -1 * (size - Math.abs(dy))
    }

    return (
      <View key={key} style={{
        height: this.props.height + topMargin,
        justifyContent: 'flex-end'
      }}>

        <View style={{
          width: dx,
          height: height,
          marginTop: topMargin,
          overflow: 'hidden',
          justifyContent: 'flex-start',
          alignContent: 'flex-start'
        }}>
          <View style={{
            top: top,
            width: size,
            height: size,
            borderColor: isBlank ? backgroundColor : this.props.primaryColor,
            borderTopWidth: 1,
            transform: this.getTransform(angleRad, size),

            overflow: 'hidden',
            justifyContent: 'flex-start'}} />
          <View style={{
            position: 'absolute',
            height: height - Math.abs(dy) - 2,
            width: '100%',
            backgroundColor: lastCoordinate ? '#FFFFFF00' : backgroundColor,
            marginTop: Math.abs(dy) + 2
          }} />
        </View>
        {!lastCoordinate ? (
          <View style={{
            position: 'absolute',
            height: '100%',
            width: dx,
            borderRightColor: '#e0e0e050',
            borderRightWidth: 1
          }} />
        ) : null}

        <TouchableWithoutFeedback onPress={() => {
          console.log('index', index)
          this.setState({

            selectedIndex: lastCoordinate ? index - 1 : index
          })
        }}>
          <View style={{
            position: 'absolute',
            height: '100%',
            width: dx,
            backgroundColor: '#AA000050',
            marginLeft: -1 * dx / 2
          }} />
        </TouchableWithoutFeedback>

      </View>
    )
  }

  drawPoint (index, point) {
    var key = 'point' + index
    var size = 8
    var color = this.props.primaryColor
    if (this.state.selectedIndex === index) {
      color = 'red'
    }

    return (
      <TouchableWithoutFeedback key={key} onPress={() => {
        this.setState({selectedIndex: index})
      }}>
        <View style={{
          width: size,
          height: size,
          borderRadius: 10,
          left: point[0] - size / 2,
          bottom: point[1] - size / 2,
          position: 'absolute',
          borderColor: color,
          backgroundColor: color,
          borderWidth: 1
        }} />
      </TouchableWithoutFeedback>
    )
  }

  drawCoordinates (data) {
    var result = []

    for (var i = 0; i < data.length - 1; i++) {
      result.push(this.drawCooridinate(i, data[i], data[i + 1]))
    }
    var lastData = data[data.length - 1].slice(0)
    var lastCoordinate = data[data.length - 1].slice(0)
    lastCoordinate[0] = lastCoordinate[0] + this.props.gap
    result.push(this.drawCooridinate((i + 1), lastData, lastCoordinate, '#FFFFFF', true, true))

    if (data.length > 1) {
      result.push(this.drawPoint(0, data[0]))
    }

    for (i = 0; i < data.length - 1; i++) {
      result.push(this.drawPoint((i + 1), data[i + 1]))
    }

    return result
  }

  getDistance (p1, p2) {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2))
  }

  drawSelected (index) {
    if (typeof (this.state.selectedIndex) === 'number' && this.state.selectedIndex >= 0) {
      if (!this.state.sortedData[index]) {
        return null
      }
      var reverse = true
      var bottom = this.state.sortedData[index][1]
      var width = 200
      var left = this.state.sortedData[index][0] - width / 2 + 1
      if (bottom > this.props.height * 2 / 3) {
        reverse = false
      }

      return (
        <View style={{
          position: 'absolute',
          height: '100%',
          width: width,
          left: left,
          alignItems: 'center',
          justifyContent: reverse ? 'flex-start' : 'flex-end'
        }}>
          <View style={{
            position: 'absolute',
            width: 1,
            height: '100%',
            backgroundColor: 'red' }} />
          <View style={Object.assign({
            backgroundColor: '#FFFFFF',
            borderRadius: 5,
            borderColor: '#AAAAAA',
            borderWidth: 1,
            height: this.state.sortedData[index][3] ? 60 : 30,
            padding: 3,
            alignItems: 'center',
            justifyContent: 'center'
          }, reverse ? {
            marginTop: this.state.sortedData[index][3] ? this.props.height - bottom - 45 : this.props.height - bottom - 15
          } : {
            marginBottom: this.state.sortedData[index][3] ? bottom - 65 : bottom - 35
          }, index === 0 ? {
            marginLeft: width / 2 - 10
          } : index === this.state.sortedData.length - 1 ? {
            marginRight: width / 2 - 20
          } : {})}>
            {this.state.sortedData[index][3] ? (
              <Text style={{fontWeight: 'bold'}}>{this.state.sortedData[index][3]}</Text>
            ) : null}
            <Text>{this.numberWithCommas(this.state.sortedData[index][2], false)}</Text>
          </View>

        </View>
      )
    } else {
      return null
    }
  }

  drawYAxis () {
    return (
      <View style={{
        borderRightWidth: 1,
        borderColor: '#e0e0e0',
        width: 1,
        height: '100%',
        marginRight: 0

      }} />

    )
  }
  drawGuideText (arr) {
    var height = this.props.height + 20
    return (
      <View style={{
        width: 30,
        height: height,
        justifyContent: 'flex-end',
        alignItems: 'flex-end'
      }}>

        {arr.map((v, i) => {
          if (v[1] > height) return null
          return (
            <View
              key={'guide' + i}
              style={{
                bottom: v[1] - 5,
                position: 'absolute'
              }}>
              <Text style={{fontSize: 11}}>{v[0]}</Text>
            </View>
          )
        })}

      </View>
    )
  }
  drawGuideLine (arr) {
    return (
      <View style={{
        width: '100%',
        height: '100%',

        position: 'absolute'
      }}>

        {arr.map((v, i) => {
          return (
            <View
              key={'guide' + i}
              style={{
                width: '100%',
                borderTopWidth: 1,
                borderTopColor: '#e0e0e0',
                bottom: v[1],
                position: 'absolute'
              }} />
          )
        })}

      </View>
    )
  }
  drawXAxis () {
    return (
      <View style={{
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0'
      }} />
    )
  }
  drawLabels () {
    return (
      <View style={{
        width: '100%',
        paddingVertical: 10,
        height: 10
      }}>
        {this.state.sortedData.map((data, i) => {
          if (data[3] && i % 2 === 1) {
            return (
              <View key={'label' + i} style={{
                position: 'absolute',
                left: data[0] - this.props.gap / 2,
                width: this.props.gap
              }}>
                <Text style={{fontSize: 9}}>{data[3]}</Text>
              </View>
            )
          } else {
            return null
          }
        })}
      </View>
    )
  }

  numberWithCommas (x, summary = true) {
    var postfix = ''
    if (summary) {
      if (x >= 1000 && x < 1000000) {
        postfix = 'K'
        x = Math.round(x / 100) / 10
      } else if (x >= 1000000 && x < 1000000000) {
        postfix = 'M'
        x = Math.round(x / 100000) / 10
      } else if (x >= 1000000000 && x < 1000000000000) {
        postfix = 'B'
        x = Math.round(x / 100000000) / 10
      }
    }

    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + postfix
  }

  render () {
    let {fadeAnim} = this.state
    return (
      this.state.sortedData.length > 0 ? (
        <View style={{flexDirection: 'row'}}>
          <View style={{
            paddingRight: 5
          }}>
            {this.drawGuideText(this.state.guideArray)}

          </View>

          <View style={{ paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}>
            <View>
              <ScrollView horizontal>
                <View ref='chartView' style={{flexDirection: 'row', alignItems: 'flex-end', margin: 0, paddingRight: 0}}>

                  {this.drawYAxis()}
                  {this.drawGuideLine(this.state.guideArray)}
                  <Animated.View style={{ transform: [{scaleY: fadeAnim}], flexDirection: 'row', alignItems: 'flex-end', height: '100%' }} >
                    {this.drawCoordinates(this.state.sortedData)}
                  </Animated.View>
                  {this.drawSelected(this.state.selectedIndex)}

                </View>

                {this.drawXAxis()}
              </ScrollView>
            </View>

            {this.drawLabels()}

          </View>

        </View>
      ) : null

    )
  }
}

LineChart.defaultProps = {
  data: [],
  primaryColor: '#297AB1',
  height: 100,
  gap: 50
}

export default LineChart
