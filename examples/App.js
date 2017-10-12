import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import PureChart from '../index.js'

export default class App extends React.Component {
  constructor (props) {
    super(props)
    this.generateData = this.generateData.bind(this)
    this.state = {
      data: []
    }
  }

  generateData () {
    var data = []
    for (var i = 0; i < 50; i++) {
      data.push(Math.round(Math.random() * 10000))
    }

    this.setState({data: data})
  }
  render () {
    return (
      <View style={styles.container}>
        <View style={{padding: 50}}>
          <PureChart type={'line'} data={this.state.data} />
          <Button title='test' onPress={this.generateData}>
            <Text>start</Text>
          </Button>
          <PureChart type={'line'} data={this.state.data} />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 100
  }
})
