/* eslint-disable jsx-a11y/accessible-emoji, no-unused-vars, no-dupe-keys, react/jsx-no-duplicate-props */
// This file is auto-generated. Edit App.view to change it. More info: https://github.com/viewstools/docs/blob/master/UseViews/README.md#viewjs-is-auto-generated-and-shouldnt-be-edited
import React from 'react'
import * as styles from './view.module.css'

export default function App({
  children,
  'data-testid': dataTestid,
  'data-view-path': dataViewPath,
  viewPath = '/App',
}) {
  return (
    <React.Fragment>
      <div
        data-testid="App.Vertical"
        data-view-path="/App"
        className={`views-block ${styles.Vertical}`}
      >
        <span
          data-testid="App.Text"
          data-view-path="/App"
          className={`views-text ${styles.Text}`}
        >
          Hello Views Tools!!!
        </span>
      </div>
      {children}
    </React.Fragment>
  )
}
