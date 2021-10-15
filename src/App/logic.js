import { ViewsFlow } from '/src/Views/Flow.js'
import View from './view.js'
import React from 'react'

export default function Logic(props) {
  console.log('testwww')
  return (
    <ViewsFlow>
      <View {...props} />
    </ViewsFlow>
  )
}
