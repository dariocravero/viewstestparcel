import * as fromDesignSystem from './ToolsDesignSystem.js'
import { useQuery } from 'react-query'
// import ReconnectingWebsocket from 'reconnecting-websocket'
import React, { useEffect, useRef, useState } from 'react'

export default function ViewsTools(props) {
  if (window.location?.pathname.startsWith('/DesignSystem')) {
    return <DesignSystem />
  }

  return <Server {...props} />
}
ViewsTools.SYNC_ONE_WAY = false

function DesignSystem() {
  let { view } = parseQuerystring(window.location?.search)
  let [message, setMessage] = useState(null)
  let View = fromDesignSystem[view]
  useEffect(() => {
    if (!message) return

    let timeout = setTimeout(() => {
      setMessage(null)
    }, 2500)

    return () => clearTimeout(timeout)
  }, [message])

  return (
    <React.Suspense fallback={<div>loading</div>}>
      <div
        style={{
          paddingTop: 25,
          paddingBottom: 25,
          paddingLeft: 25,
          paddingRight: 25,
          flex: 1,
          overflow: 'auto',
          background:
            'linear-gradient(90deg, #1f1f1f 9px, transparent 1%) center, linear-gradient(#1f1f1f 9px, transparent 1%) center, #474747',
          backgroundSize: '11px 11px',
        }}
      >
        <View
          text={view}
          onClick={() => setMessage('⚡️ onClick')}
          onMouseEnter={() => setMessage('⚡️ onMouseEnter')}
          onMouseLeave={() => setMessage('⚡️ onMouseLeave')}
          onChange={() => setMessage('⚡️ onChange')}
        />
        {message && (
          <div
            style={{
              position: 'absolute',
              bottom: 25,
              left: 25,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              paddingTop: 4,
              paddingBottom: 4,
              paddingLeft: 8,
              paddingRight: 8,
              borderRadius: 4,
              fontFamily: 'sans-serif',
              fontSize: 12,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </React.Suspense>
  )
}

function Server(props) {
  let { data: clientSyncData } = useQuery(
    'client:sync',
    () =>
      fetchFn('client:sync', { app: '/Users/dario/Documents/viewstestparcel' }),
    {
      refetchInterval: 2500,
      refetchIntervalInBackground: true,
    }
  )
  // let ws = useRef(null)
  // useEffect(() => {
  //   ws.current = new ReconnectingWebsocket('ws://192.168.1.36:55005/')

  //   ws.current.addEventListener('open', () => {
  //     ws.current.send('hello!')
  //   })

  //   ws.current.addEventListener('message', (message) => {
  //     console.log('got message', message)
  //   })

  //   return () => {
  //     ws.current.close()
  //   }
  // }, [])

  let flowStateSetFlow = useRef(null)
  let isSettingFlowInApp = useRef(false)

  let [flowState, flowDispatch] = props.flow
  useEffectSyncAppStateFromTools({
    clientSyncData,
    flowDispatch,
    flowState,
    isSettingFlowInApp,
  })
  useEffectSyncToolsFromAppState({
    clientSyncData,
    flowState,
    flowStateSetFlow,
    isSettingFlowInApp,
  })
  useEffectToggleIsSelecting({ clientSyncData })
  useEffectSyncMode({ clientSyncData })
  useEffectSyncFlowMap({
    clientSyncData,
    onFlowMapChange: props.onFlowMapChange,
  })

  return (
    <React.Fragment>
      {clientSyncData?.isShowingWireframeColors ? <WireframeColors /> : null}
      {props.children}
    </React.Fragment>
  )
}

function useEffectSyncAppStateFromTools({
  clientSyncData,
  flowDispatch,
  flowState,
  isSettingFlowInApp,
}) {
  useEffect(() => {
    if (
      !clientSyncData?.flow ||
      haveTheSameFlow(clientSyncData.flow, flowState.flow) ||
      isSettingFlowInApp.current ||
      clientSyncData?.sync === 'no'
    )
      return

    flowDispatch({
      type: 'flow/SYNC',
      id: clientSyncData.id,
      flow: clientSyncData.flow,
    })
  }, [clientSyncData]) // eslint-disable-line
  // ignore flowDispatch and flowState.flow
}

function useEffectSyncToolsFromAppState({
  clientSyncData,
  flowState,
  flowStateSetFlow,
  isSettingFlowInApp,
}) {
  useEffect(() => {
    if (
      !clientSyncData?.flow ||
      haveTheSameFlow(clientSyncData.flow, flowState.flow)
    )
      return

    isSettingFlowInApp.current = true

    if (flowStateSetFlow.current === null) {
      flowStateSetFlow.current = {
        flow: { ...flowState.flow },
        flowAction: flowState.actions[0],
      }
    } else {
      clearTimeout(flowStateSetFlow.current.timeout)
      if (!flowState.flow[flowStateSetFlow.current.flowAction]) {
        flowStateSetFlow.current.flowAction = flowState.actions[0]
      }
      flowStateSetFlow.current.flow = { ...flowState.flow }
    }

    flowStateSetFlow.current.timeout = setTimeout(() => {
      fetchFn('client:setFlow', {
        app: '/Users/dario/Documents/viewstestparcel',
        flow: flowStateSetFlow.current.flow,
        flowAction: flowStateSetFlow.current.flowAction,
      })

      flowStateSetFlow.current = null
      isSettingFlowInApp.current = false
    }, 1000)
  }, [flowState]) // eslint-disable-line
  // ignore clientSyncData and flowStateSetFlow
}

function useEffectToggleIsSelecting({ clientSyncData }) {
  useEffect(() => {
    if (!clientSyncData?.isSelecting) return

    let clear = select({ onClick })

    function onClick(event, item) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      if (item?.view) {
        fetchFn('client:select', {
          app: '/Users/dario/Documents/viewstestparcel',
          selected: item.view,
          selectedOpenNewTab: event.metaKey,
        })
      } else {
        clear()
        clear = select({ onClick })
      }
    }

    return () => clear()
  }, [clientSyncData?.isSelecting]) // eslint-disable-line
  // we only care about clientSyncData.isSelecting
}

function useEffectSyncMode({ clientSyncData }) {
  useEffect(() => {
    if (clientSyncData?.sync === 'one-way') {
      ViewsTools.SYNC_ONE_WAY = clientSyncData.flowAction

      function onClick() {
        ViewsTools.SYNC_ONE_WAY = false
        fetchFn('client:setSync', {
          app: '/Users/dario/Documents/viewstestparcel',
          sync: 'two-ways',
        })
      }

      document.addEventListener('mousedown', onClick)

      return () => document.removeEventListener('mousedown', onClick)
    } else {
      ViewsTools.SYNC_ONE_WAY = false
    }
  }, [clientSyncData?.sync, clientSyncData?.flowAction]) // eslint-disable-line
}

function useEffectSyncFlowMap({ clientSyncData, onFlowMapChange }) {
  let flowMapVersion = useRef(null)

  useEffect(() => {
    if (
      clientSyncData?.flowMap &&
      typeof onFlowMapChange === 'function' &&
      flowMapVersion.current !== clientSyncData.flowMapVersion
    ) {
      flowMapVersion.current = clientSyncData.flowMapVersion
      onFlowMapChange(JSON.parse(clientSyncData.flowMap))
    }
  }, [clientSyncData]) // eslint-disable-line
  // ignore onFlowMapChange
}

let colors = []
for (let i = 200; i < 230; i = i + 4) {
  colors.push(`hsl(${i},80%,50%)`)
  colors.push(`hsl(${i},85%,55%)`)
  // colors.push(`hsl(${i},80%,50%)`)
}
function WireframeColors() {
  useEffect(() => {
    let blocks = []

    function setup() {
      blocks = Array.from(document.querySelectorAll('.views-block')).map(
        (item, i) => {
          let originalBackgroundColor = item.style.backgroundColor || ''
          item.style.backgroundColor = colors[i % colors.length]
          return { element: item, originalBackgroundColor }
        }
      )
    }

    function cleanup() {
      blocks.forEach((item) => {
        item.element.style.backgroundColor = item.originalBackgroundColor
      })
    }
    setup()

    let observer = new MutationObserver(() => {
      cleanup()
      setup()
    })
    observer.observe(document.getElementById('root'), {
      childList: true,
      subtree: true,
    })

    return () => {
      cleanup()
      observer.disconnect()
    }
  }, [])

  return null
}

// https://github.com/unshiftio/querystringify/blob/2ee657501249f85a682b9c2f070f235d42f8ce93/index.js#L43
function parseQuerystring(query) {
  let parser = /([^=?&]+)=?([^&]*)/g
  let result = {}
  let part

  while ((part = parser.exec(query))) {
    let key = decode(part[1])
    let value = decode(part[2])

    //
    // Prevent overriding of existing properties. This ensures that build-in
    // methods like `toString` or __proto__ are not overriden by malicious
    // querystrings.
    //
    // In the case if failed decoding, we want to omit the key/value pairs
    // from the result.
    //
    if (key === null || value === null || key in result) continue
    result[key] = value
  }

  return result
}
function decode(input) {
  try {
    return decodeURIComponent(input.replace(/\+/g, ' '))
  } catch (e) {
    return null
  }
}

async function fetchFn(query, variables) {
  try {
    let res = await fetch('http://192.168.1.36:55005/', {
      method: 'POST',
      body: JSON.stringify({ type: query, ...variables }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      return null
    }

    return await res.json()
  } catch (error) {
    return null
  }
}

function haveTheSameFlow(ra, rb) {
  let a = Object.entries(ra)
  let b = Object.entries(rb)

  return a.length === b.length && a.every(([key, value]) => rb[key] === value)
}

// original source https://github.com/ghmcadams/boxvis/blob/master/debugcss.js
function select({ onClick }) {
  let boxvis
  let outlinerContainer
  let latestInfo
  let scrollTimeout = null
  let scrollendDelay = 250 // ms

  function addStyleElement(css) {
    let head = document.head || document.getElementsByTagName('head')[0]
    let style = document.createElement('style')

    style.type = 'text/css'
    if (style.styleSheet) {
      style.styleSheet.cssText = css
    } else {
      style.appendChild(document.createTextNode(css))
    }

    head.appendChild(style)
  }

  function getStyleValue(style, value) {
    return parseFloat(style[value])
  }

  function getElementInfo(element) {
    let styles = window.getComputedStyle(element)

    let view = element.dataset.viewPath
    let viewElement = element.parentElement
    while (!view && viewElement) {
      view = viewElement.dataset.viewPath
      viewElement = viewElement.parentElement
    }

    return {
      element: element,
      block: element.dataset.testid || element.tagName.toLowerCase(),
      view,
      box: element.getBoundingClientRect(),
      margin: {
        top: getStyleValue(styles, 'margin-top'),
        right: getStyleValue(styles, 'margin-right'),
        bottom: getStyleValue(styles, 'margin-bottom'),
        left: getStyleValue(styles, 'margin-left'),
      },
      border: {
        top: getStyleValue(styles, 'border-top-width'),
        right: getStyleValue(styles, 'border-right-width'),
        bottom: getStyleValue(styles, 'border-bottom-width'),
        left: getStyleValue(styles, 'border-left-width'),
      },
      padding: {
        top: getStyleValue(styles, 'padding-top'),
        right: getStyleValue(styles, 'padding-right'),
        bottom: getStyleValue(styles, 'padding-bottom'),
        left: getStyleValue(styles, 'padding-left'),
      },
    }
  }

  function mouseHandler(e) {
    clearScrollTimer()

    let info = getElementInfo(e.target)
    latestInfo = info
    showInfo(info)
  }
  function mouseOutHandler(e) {
    hideBoxVis()
  }

  function clickHandler(event) {
    onClick(event, latestInfo)
  }

  function toggleRulersHandler(e) {
    if (e.key !== 'Alt') return

    outlinerContainer.classList.toggle('noln')
  }

  function scrollHandler(e) {
    if (!scrollTimeout) {
      onScrollStart()
    }

    scrollTimeout = setTimeout(onScrollEnd, scrollendDelay)
  }
  function clearScrollTimer() {
    clearTimeout(scrollTimeout)
    scrollTimeout = null
  }
  function onScrollStart() {
    hideBoxVis()
  }
  function onScrollEnd() {
    clearScrollTimer()
    if (latestInfo) {
      latestInfo.box = latestInfo.element.getBoundingClientRect()
      showInfo(latestInfo)
    }
  }

  function hideBoxVis() {
    boxvis.tooltip.style.display = 'none'

    boxvis.margin.horizontal.removeAttribute('style')
    boxvis.margin.vertical.removeAttribute('style')
    boxvis.margin.inner.style.display = 'none'

    boxvis.border.horizontal.removeAttribute('style')
    boxvis.border.vertical.removeAttribute('style')
    boxvis.border.inner.style.display = 'none'

    boxvis.padding.horizontal.removeAttribute('style')
    boxvis.padding.vertical.removeAttribute('style')
    boxvis.padding.inner.style.display = 'none'

    boxvis.box.horizontal.removeAttribute('style')
    boxvis.box.vertical.removeAttribute('style')
    boxvis.box.inner.style.display = 'none'
  }

  function showInfo(info) {
    let windowHeight =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight
    let windowWidth =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth

    // tooltip
    let block = '<span class="t">' + info.block + '</span>'
    let view = '<span class="i">' + info.view + '</span>'
    let dimensions =
      '<span class="d"> | ' +
      Math.round(info.box.width * 100) / 100 +
      ' x ' +
      Math.round(info.box.height * 100) / 100 +
      '</span>'
    let information = block + view + dimensions

    boxvis.tooltip.style.display = 'block'
    boxvis.tooltip.innerHTML = information
    let tooltipBox = boxvis.tooltip.getBoundingClientRect()

    let tooltipTop = info.box.top - 30
    if (tooltipTop < 0) {
      tooltipTop = info.box.bottom + 6

      if (tooltipTop + 30 > windowHeight) {
        tooltipTop = 6
      }
    }

    let tooltipLeft = info.box.left + 2
    if (tooltipLeft < 0) {
      tooltipLeft = 2
    } else {
      if (tooltipLeft + tooltipBox.width > windowWidth) {
        tooltipLeft = windowWidth - tooltipBox.width - 2
      }
    }

    boxvis.tooltip.style.top = tooltipTop + 'px'
    boxvis.tooltip.style.left = tooltipLeft + 'px'

    // margin
    boxvis.margin.horizontal.style.top = info.box.top - info.margin.top + 'px'
    boxvis.margin.horizontal.style.height =
      info.box.height + info.margin.top + info.margin.bottom + 'px'

    boxvis.margin.vertical.style.left = info.box.left - info.margin.left + 'px'
    boxvis.margin.vertical.style.width =
      info.box.width + info.margin.left + info.margin.right + 'px'

    boxvis.margin.inner.style.display = 'block'
    boxvis.margin.inner.style.top = info.box.top - info.margin.top + 'px'
    boxvis.margin.inner.style.left = info.box.left - info.margin.left + 'px'
    boxvis.margin.inner.style.height =
      info.box.height + info.margin.top + info.margin.bottom + 'px'
    boxvis.margin.inner.style.width =
      info.box.width + info.margin.left + info.margin.right + 'px'

    // border
    boxvis.border.horizontal.style.top = info.box.top + 'px'
    boxvis.border.horizontal.style.height = info.box.height + 'px'

    boxvis.border.vertical.style.left = info.box.left + 'px'
    boxvis.border.vertical.style.width = info.box.width + 'px'

    boxvis.border.inner.style.display = 'block'
    boxvis.border.inner.style.top = info.box.top + 'px'
    boxvis.border.inner.style.left = info.box.left + 'px'
    boxvis.border.inner.style.height = info.box.height + 'px'
    boxvis.border.inner.style.width = info.box.width + 'px'

    // padding
    boxvis.padding.horizontal.style.top = info.box.top + info.border.top + 'px'
    boxvis.padding.horizontal.style.height =
      info.box.height - info.border.top - info.border.bottom + 'px'

    boxvis.padding.vertical.style.left = info.box.left + info.border.left + 'px'
    boxvis.padding.vertical.style.width =
      info.box.width - info.border.left - info.border.right + 'px'

    boxvis.padding.inner.style.display = 'block'
    boxvis.padding.inner.style.top = info.box.top + info.border.top + 'px'
    boxvis.padding.inner.style.left = info.box.left + info.border.left + 'px'
    boxvis.padding.inner.style.height =
      info.box.height - info.border.top - info.border.bottom + 'px'
    boxvis.padding.inner.style.width =
      info.box.width - info.border.left - info.border.right + 'px'

    // box
    boxvis.box.horizontal.style.top =
      info.box.top + info.border.top + info.padding.top + 'px'
    boxvis.box.horizontal.style.height =
      info.box.height -
      info.border.top -
      info.border.bottom -
      info.padding.top -
      info.padding.bottom +
      'px'

    boxvis.box.vertical.style.left =
      info.box.left + info.border.left + info.padding.left + 'px'
    boxvis.box.vertical.style.width =
      info.box.width -
      info.border.left -
      info.border.right -
      info.padding.left -
      info.padding.right +
      'px'

    boxvis.box.inner.style.display = 'block'
    boxvis.box.inner.style.top =
      info.box.top + info.border.top + info.padding.top + 'px'
    boxvis.box.inner.style.left =
      info.box.left + info.border.left + info.padding.left + 'px'
    boxvis.box.inner.style.height =
      info.box.height -
      info.border.top -
      info.border.bottom -
      info.padding.top -
      info.padding.bottom +
      'px'
    boxvis.box.inner.style.width =
      info.box.width -
      info.border.left -
      info.border.right -
      info.padding.left -
      info.padding.right +
      'px'
  }

  let styles = `
.boxvis {
  font-family: sans-serif;
}
.boxvis > div > div {
  pointer-events:none;
  position:fixed;
  z-index:2147483637;
  top:-10px;
  bottom:-10px;
  left:-10px;
  right:-10px;
}
.boxvis:not(.noln) > div > div {
  border-width:1px;
  border-style:dashed;
}
.boxvis > .mg > div {
  border-color:#e67700;
}
.boxvis > .bd > div {
  border-color:#dcdc40;
}
.boxvis > .pd > div {
  border-color:#00bb20;
}
.boxvis > .bx > div {
  border-color:#0000e6;
}
.boxvis > div > .o{
  z-index:2147483638;
  border:none;
  display:none
}
.boxvis > .mg > .o {
  background-color:rgba(255,153,0,0.125)
}
.boxvis > .pd > .o {
  background-color:rgba(0,140,64,0.125)
}
.boxvis > .bd > .o {
  background-color:rgba(255,255,0,0.125)
}
.boxvis > .bx > .o {
  background-color:rgba(0,100,255,0.35)
}
.boxvis > .i {
  pointer-events:none;
  position:fixed;
  z-index:2147483638;
  background-color:#181818;
  font-size:12px;
  padding: 4px 8px 4px 8px;
  border-radius: 4px;
  white-space:nowrap;
  display:none;
}
.boxvis > .i > .t{
  color:#FF74FF;
  font-weight:700
}
.boxvis > .i > .i {
  color:#FFB952
}
.boxvis > .i > .c{
  color:#75CFFF
}
.boxvis > .i > .d{
  font-size:10px;
  margin-left:3px;
  color:#CCC
}
`
  addStyleElement(styles)

  let html =
    // margin
    '<div class="mg"><div class="h"></div><div class="v"></div><div class="o"></div></div>' +
    // border
    '<div class="bd"><div class="h"></div><div class="v"></div><div class="o"></div></div>' +
    // padding
    '<div class="pd"><div class="h"></div><div class="v"></div><div class="o"></div></div>' +
    // inside box
    '<div class="bx"><div class="h"></div><div class="v"></div><div class="o"></div></div>' +
    // info bubble
    '<div class="i"></div>'

  outlinerContainer = document.createElement('div')
  outlinerContainer.className = 'boxvis'
  document.body.appendChild(outlinerContainer)

  outlinerContainer.innerHTML = html

  let addedElements = outlinerContainer.childNodes
  boxvis = {
    margin: {
      horizontal: addedElements[0].childNodes[0],
      vertical: addedElements[0].childNodes[1],
      inner: addedElements[0].childNodes[2],
    },
    border: {
      horizontal: addedElements[1].childNodes[0],
      vertical: addedElements[1].childNodes[1],
      inner: addedElements[1].childNodes[2],
    },
    padding: {
      horizontal: addedElements[2].childNodes[0],
      vertical: addedElements[2].childNodes[1],
      inner: addedElements[2].childNodes[2],
    },
    box: {
      horizontal: addedElements[3].childNodes[0],
      vertical: addedElements[3].childNodes[1],
      inner: addedElements[3].childNodes[2],
    },
    tooltip: addedElements[4],
  }

  document.body.addEventListener('mouseover', mouseHandler)
  window.addEventListener('scroll', scrollHandler)
  document.body.addEventListener('mouseout', mouseOutHandler)
  document.body.addEventListener('click', clickHandler)
  document.addEventListener('keyup', toggleRulersHandler)

  return function () {
    if (outlinerContainer) {
      outlinerContainer.remove()
    }

    document.body.removeEventListener('mouseover', mouseHandler)
    window.removeEventListener('scroll', scrollHandler)
    document.body.removeEventListener('mouseout', mouseOutHandler)
    document.body.removeEventListener('click', clickHandler)
    document.removeEventListener('keyup', toggleRulersHandler)
  }
}
