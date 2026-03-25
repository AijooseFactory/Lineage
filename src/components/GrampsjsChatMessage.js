import {html, css, LitElement} from 'lit'
import {unsafeHTML} from 'lit/directives/unsafe-html.js'
import {classMap} from 'lit/directives/class-map.js'
import {marked} from 'marked'
import '@material/web/icon/icon.js'
import {mdiFamilyTree, mdiLightbulbOutline, mdiChevronDown} from '@mdi/js'

import {sharedStyles} from '../SharedStyles.js'
import {GrampsjsAppStateMixin} from '../mixins/GrampsjsAppStateMixin.js'
import {renderIconSvg} from '../icons.js'

class GrampsjsChatMessage extends GrampsjsAppStateMixin(LitElement) {
  static get styles() {
    return [
      sharedStyles,
      css`
        .container {
          margin: 15px 0;
          font-size: 16px;
          line-height: 26px;
          font-weight: 340;
          clear: right;
          max-width: 90%;
          display: flex;
          align-items: flex-start;
        }

        .container.human {
          background-color: var(--grampsjs-color-shade-230);
          color: var(--grampsjs-body-font-color);
          padding: 10px 20px;
          border-radius: 16px;
          float: right;
          max-width: 70%;
          margin-right: 10px;
        }

        .container.alert {
          max-width: 70%;
          margin-left: auto;
          margin-right: auto;
          width: fit-content;
          border-radius: 16px;
          border: 0;
        }

        /* Human messages: preserve whitespace as before */
        .container.human .slot-wrap {
          white-space: pre-wrap;
        }

        .slot-wrap {
          flex-grow: 1;
          overflow: hidden;
          overflow-x: auto;
        }

        .avatar {
          width: 35px;
          height: 35px;
          flex-shrink: 0;
        }

        .avatar md-icon {
          --md-icon-size: 20px;
          position: relative;
          top: 3px;
        }

        /* ── Markdown rendered content (AI messages) ─────────────────── */

        .markdown-body {
          line-height: 1.65;
        }

        .markdown-body p {
          margin: 0.4em 0;
        }

        .markdown-body p:first-child {
          margin-top: 0;
        }

        .markdown-body p:last-child {
          margin-bottom: 0;
        }

        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6 {
          margin: 0.75em 0 0.3em;
          font-weight: 600;
          line-height: 1.3;
        }

        .markdown-body h1 {
          font-size: 1.35em;
        }
        .markdown-body h2 {
          font-size: 1.2em;
        }
        .markdown-body h3 {
          font-size: 1.05em;
        }

        /* Tables */
        .markdown-body table {
          border-collapse: collapse;
          margin: 0.6em 0;
          font-size: 0.93em;
          width: auto;
          max-width: 100%;
        }

        .markdown-body th,
        .markdown-body td {
          border: 1px solid var(--grampsjs-color-shade-200, #ccc);
          padding: 6px 14px;
          text-align: left;
          vertical-align: top;
        }

        .markdown-body th {
          background-color: var(--grampsjs-color-shade-230, #eee);
          font-weight: 600;
        }

        .markdown-body tr:nth-child(even) td {
          background-color: var(--grampsjs-color-shade-250, #f8f8f8);
        }

        /* Lists */
        .markdown-body ul,
        .markdown-body ol {
          margin: 0.4em 0;
          padding-left: 1.5em;
        }

        .markdown-body li {
          margin: 0.15em 0;
        }

        /* Inline code */
        .markdown-body code {
          font-family: monospace;
          font-size: 0.88em;
          background: var(--grampsjs-color-shade-230, #eee);
          padding: 1px 5px;
          border-radius: 3px;
        }

        /* Code blocks */
        .markdown-body pre {
          background: var(--grampsjs-color-shade-230, #eee);
          padding: 10px 14px;
          border-radius: 6px;
          overflow-x: auto;
          font-size: 0.88em;
          margin: 0.5em 0;
        }

        .markdown-body pre code {
          background: none;
          padding: 0;
        }

        /* Blockquotes */
        .markdown-body blockquote {
          border-left: 3px solid var(--grampsjs-main-color, #795548);
          margin: 0.5em 0;
          padding: 0 0.75em;
          color: var(--grampsjs-body-font-color-40, #888);
        }

        /* Links */
        .markdown-body a {
          color: var(--grampsjs-main-color, #795548);
          text-decoration: none;
        }

        .markdown-body a:hover {
          text-decoration: underline;
        }

        /* Horizontal rule */
        .markdown-body hr {
          border: none;
          border-top: 1px solid var(--grampsjs-color-shade-200, #ccc);
          margin: 0.75em 0;
        }

        /* Strong / em */
        .markdown-body strong {
          font-weight: 600;
        }

        /* ── Thinking / Reasoning Block ──────────────────────────── */

        details.thought-details {
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--grampsjs-main-color) 6%, transparent),
            color-mix(in srgb, var(--grampsjs-main-color) 3%, transparent)
          );
          border: 1px solid color-mix(in srgb, var(--grampsjs-main-color) 20%, transparent);
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
        }

        details.thought-details summary {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 14px;
          font-size: 0.8em;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--grampsjs-main-color);
          cursor: pointer;
          list-style: none;
          user-select: none;
          transition: opacity 0.15s;
        }

        details.thought-details summary::-webkit-details-marker {
          display: none;
        }

        details.thought-details summary:hover {
          opacity: 0.75;
        }

        details.thought-details summary .chevron {
          margin-left: auto;
          transition: transform 0.2s ease;
        }

        details.thought-details[open] summary .chevron {
          transform: rotate(180deg);
        }

        .thought-body {
          padding: 2px 16px 14px;
          font-size: 0.875em;
          line-height: 1.6;
          color: var(--grampsjs-body-font-color-40);
          font-style: italic;
          border-top: 1px solid color-mix(in srgb, var(--grampsjs-main-color) 15%, transparent);
        }

        .thought-body p {
          margin: 0.35em 0;
        }

        .thought-body p:first-child { margin-top: 0.5em; }
        .thought-body p:last-child  { margin-bottom: 0; }
      `,
    ]
  }

  static get properties() {
    return {
      type: {type: String},
      // Pre-parsed markdown HTML for AI messages.
      // Passed as a Lit property (not attribute) so the HTML string is set
      // directly without attribute serialisation.
      content: {type: String},
      // Reasoning / thought process from the AI
      thought: {type: String},
    }
  }

  constructor() {
    super()
    this.type = 'human'
    this.content = ''
    this.thought = ''
  }

  render() {
    return html`
      <div
        class="${classMap({
          container: true,
          human: this.type === 'human',
          ai: this.type === 'ai',
          alert: this.type === 'error',
          error: this.type === 'error',
        })}"
      >
        ${this.type === 'ai'
          ? html`
              <div class="avatar">
                <md-icon
                  >${renderIconSvg(
                    mdiFamilyTree,
                    'var(--grampsjs-body-font-color-40)',
                    270
                  )}</md-icon
                >
              </div>
            `
          : ''}
        <slot name="no-wrap"></slot>
        <div class="slot-wrap">
          ${this.thought
            ? html`
                <details class="thought-details">
                  <summary>
                    ${renderIconSvg(
                      mdiLightbulbOutline,
                      'var(--grampsjs-main-color)',
                      150
                    )}
                    Reasoning
                    <span class="chevron"
                      >${renderIconSvg(
                        mdiChevronDown,
                        'var(--grampsjs-main-color)',
                        150
                      )}</span
                    >
                  </summary>
                  <div class="thought-body">
                    ${unsafeHTML(marked.parse(this.thought))}
                  </div>
                </details>
              `
            : ''}
          ${this.content
            ? html`<div class="markdown-body">${unsafeHTML(this.content)}</div>`
            : html`<slot></slot>`}
        </div>
      </div>
    `
  }
}

window.customElements.define('grampsjs-chat-message', GrampsjsChatMessage)
