/* @flow */

// this file is used in the vue-template-compiler npm package
// and assumes its dependencies and a Node/CommonJS environment
import deindent from 'de-indent'
import { SourceMapGenerator } from 'source-map'

import { parseHTML } from './html-parser'
import { makeMap } from 'shared/util'

const splitRE = /\r?\n/g
const isSpecialTag = makeMap('script,style,template', true)

type Attribute = {
  name: string,
  value: string
}

/**
 * Parse a single-file component (*.vue) file into an SFC Descriptor Object.
 */
export function parseComponent (
  content: string,
  options?: Object
 ): SFCDescriptor {
  const sfc: SFCDescriptor = {
    template: null,
    script: null,
    styles: []
  }
  let depth = 0
  let currentBlock: ?SFCBlock = null

  function start (tag: string, attrs: Array<Attribute>) {
    depth++
    if (depth > 1) {
      return
    }
    if (isSpecialTag(tag)) {
      currentBlock = {
        type: tag,
        content: ''
      }
      checkAttrs(currentBlock, attrs)
      if (tag === 'style') {
        sfc.styles.push(currentBlock)
      } else {
        sfc[tag] = currentBlock
      }
    }
  }

  function checkAttrs (block: SFCBlock, attrs: Array<Attribute>) {
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i]
      if (attr.name === 'lang') {
        block.lang = attr.value
      }
      if (attr.name === 'scoped') {
        block.scoped = true
      }
      if (attr.name === 'src') {
        block.src = attr.value
      }
    }
  }

  function end () {
    depth--
    if (currentBlock && options && options.map) {
      addSourceMap(currentBlock)
    }
    currentBlock = null
  }

  function chars (text: string) {
    if (currentBlock) {
      currentBlock.start = content.indexOf(text)
      currentBlock.end = currentBlock.start + text.length
      text = deindent(text)
      // pad content so that linters and pre-processors can output correct
      // line numbers in errors and warnings
      if (currentBlock.type !== 'template' && options && options.pad) {
        text = padContent(currentBlock) + text
      }
      currentBlock.content = text
    }
  }

  function padContent (block: SFCBlock) {
    const leadingContent = content.slice(0, block.start)
    const padChar = block.type === 'script' && !block.lang
      ? '//\n'
      : '\n'
    return Array(leadingContent.split(splitRE).length).join(padChar)
  }

  function addSourceMap (block: SFCBlock) {

  }

  parseHTML(content, {
    isSpecialTag,
    start,
    end,
    chars
  })

  return sfc
}