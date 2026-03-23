import {html, css} from 'lit'

import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/button/text-button.js'
import '@material/web/progress/circular-progress.js'

import '../components/GrampsjsChatPermissions.js'
import {GrampsjsConnectedComponent} from '../components/GrampsjsConnectedComponent.js'
import {sharedStyles} from '../SharedStyles.js'
import {fireEvent} from '../util.js'

// localStorage key for draft auto-save
const DRAFT_KEY = 'lineage:chat-prompt-draft'

class GrampsjsViewChatSettings extends GrampsjsConnectedComponent {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: block;
        }

        /* ── Page layout ─────────────────────────────────────────── */

        .page-header {
          margin-bottom: 28px;
        }

        .page-header h2 {
          font-size: 1.4rem;
          font-weight: 600;
          margin: 0 0 4px;
          color: var(--grampsjs-body-font-color);
        }

        .page-header p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--grampsjs-body-font-color-40);
        }

        /* ── Section cards ───────────────────────────────────────── */

        .settings-card {
          background: var(--grampsjs-color-shade-250, #fafafa);
          border: 1px solid var(--grampsjs-color-shade-200, #e8e8e8);
          border-radius: 10px;
          padding: 24px 28px;
          margin-bottom: 20px;
          max-width: 760px;
        }

        .settings-card h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 4px;
          color: var(--grampsjs-body-font-color);
        }

        .settings-card .card-desc {
          font-size: 0.855rem;
          color: var(--grampsjs-body-font-color-40);
          margin: 0 0 18px;
          line-height: 1.5;
        }

        /* ── Textarea ────────────────────────────────────────────── */

        .textarea-wrap {
          position: relative;
        }

        textarea.prompt-editor {
          width: 100%;
          min-height: 240px;
          max-height: 520px;
          box-sizing: border-box;
          font-family: 'Roboto Mono', 'Courier New', monospace;
          font-size: 0.8rem;
          line-height: 1.6;
          padding: 12px 14px;
          border: 1.5px solid var(--grampsjs-color-shade-200, #ccc);
          border-radius: 6px;
          background: var(--md-sys-color-surface, #fff);
          color: var(--grampsjs-body-font-color);
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
          display: block;
        }

        textarea.prompt-editor:focus {
          border-color: var(--grampsjs-main-color, #795548);
        }

        textarea.prompt-editor.is-dirty {
          border-color: var(--grampsjs-main-color, #795548);
        }

        .char-count {
          position: absolute;
          bottom: 8px;
          right: 10px;
          font-size: 0.72rem;
          color: var(--grampsjs-body-font-color-40);
          background: var(--md-sys-color-surface, #fff);
          padding: 0 4px;
          pointer-events: none;
        }

        .char-count.over-limit {
          color: #c62828;
          font-weight: 600;
        }

        /* ── Actions row ─────────────────────────────────────────── */

        .prompt-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          align-items: center;
          flex-wrap: wrap;
        }

        .save-feedback {
          font-size: 0.82rem;
          color: var(--grampsjs-main-color, #795548);
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.25s;
        }

        .save-feedback.visible {
          opacity: 1;
        }

        .draft-notice {
          font-size: 0.78rem;
          color: var(--grampsjs-body-font-color-40);
          padding: 6px 0 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Status pill ─────────────────────────────────────────── */

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.78rem;
          font-weight: 500;
        }

        .status-pill.custom {
          background: color-mix(in srgb, var(--grampsjs-main-color, #795548) 12%, transparent);
          color: var(--grampsjs-main-color, #795548);
        }

        .status-pill.default {
          background: var(--grampsjs-color-shade-230, #eeeeee);
          color: var(--grampsjs-body-font-color-40);
        }

        /* ── Loading skeleton ────────────────────────────────────── */

        .skeleton-card {
          background: var(--grampsjs-color-shade-250, #fafafa);
          border: 1px solid var(--grampsjs-color-shade-200, #e8e8e8);
          border-radius: 10px;
          padding: 24px 28px;
          margin-bottom: 20px;
          max-width: 760px;
        }

        .skeleton-line {
          border-radius: 4px;
          background: var(--grampsjs-color-shade-200, #e0e0e0);
          animation: pulse 1.4s infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        md-filled-button {
          --md-filled-button-container-color: var(--grampsjs-main-color, #795548);
          --md-filled-button-label-text-color: #fff;
        }

        /* ── Researcher table ─────────────────────────────────────── */

        .researcher-name {
          font-size: 1rem;
          font-weight: 500;
          margin: 0 0 14px;
          color: var(--grampsjs-body-font-color);
        }

        table.researcher-table th,
        table.researcher-table td {
          font-size: 14px;
          font-weight: 300;
          height: 20px;
          padding-bottom: 10px;
          padding-top: 10px;
          padding-right: 25px;
          padding-left: 0;
          text-align: left;
        }

        table.researcher-table th {
          font-weight: 450;
          color: var(--grampsjs-body-font-color-100);
          text-align: right;
        }
      `,
    ]
  }

  static get properties() {
    return {
      ...super.properties,
      _promptValue: {type: String},
      _isDirty: {type: Boolean},
      _saving: {type: Boolean},
      _saved: {type: Boolean},
      _hasDraft: {type: Boolean},
    }
  }

  constructor() {
    super()
    this._promptValue = ''
    this._isDirty = false
    this._saving = false
    this._saved = false
    this._hasDraft = false
    this._serverPrompt = '' // last saved value from server
  }

  // ── Data loading ──────────────────────────────────────────────────

  // eslint-disable-next-line class-methods-use-this
  getUrl() {
    return '/api/trees/-'
  }

  updated(changedProps) {
    // When fresh data arrives from GET, initialise the editor (but don't
    // clobber unsaved user edits if they already started typing).
    if (changedProps.has('_data') && this._data?.data) {
      this._serverPrompt = this._data.data.system_prompt_ai ?? ''
      if (!this._isDirty) {
        // Restore draft from localStorage if one was saved for this tree
        const draft = localStorage.getItem(DRAFT_KEY)
        if (draft !== null && draft !== this._serverPrompt) {
          this._promptValue = draft
          this._isDirty = true
          this._hasDraft = true
        } else {
          this._promptValue = this._serverPrompt
        }
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  renderContent() {
    const isCustom = !!(this._data?.data?.system_prompt_ai)
    const charCount = this._promptValue.length
    const overLimit = charCount > 8000

    return html`
      <div class="page-header">
        <h2>${this._('AI Settings')}</h2>
        <p>
          ${this._('Configure the AI assistant for this family tree.')}
        </p>
      </div>

      <!-- ── System Prompt ── -->
      <div class="settings-card">
        <h3>
          ${this._('System Prompt')}
          &nbsp;
          <span class="status-pill ${isCustom ? 'custom' : 'default'}">
            ${isCustom ? this._('Custom') : this._('Default')}
          </span>
        </h3>
        <p class="card-desc">
          ${this._(
            'Define how the AI historian speaks and what it focuses on. Leave blank to use the built-in Lineage prompt.'
          )}
        </p>

        ${this._hasDraft
          ? html`
              <div class="draft-notice">
                ⚠ ${this._('You have a saved draft — click Save or Discard.')}
                <md-text-button @click="${this._discardDraft}">
                  ${this._('Discard draft')}
                </md-text-button>
              </div>
            `
          : ''}

        <div class="textarea-wrap">
          <textarea
            class="prompt-editor ${this._isDirty ? 'is-dirty' : ''}"
            .value="${this._promptValue}"
            placeholder="${this._('Leave blank to use the Lineage default prompt…')}"
            @input="${this._handlePromptInput}"
          ></textarea>
          <span class="char-count ${overLimit ? 'over-limit' : ''}">
            ${charCount.toLocaleString()} / 8,000
          </span>
        </div>

        <div class="prompt-actions">
          <md-filled-button
            ?disabled="${!this._isDirty || this._saving || overLimit}"
            @click="${this._savePrompt}"
          >
            ${this._saving
              ? html`<md-circular-progress
                  indeterminate
                  style="--md-circular-progress-size:18px"
                ></md-circular-progress>`
              : this._('Save Prompt')}
          </md-filled-button>

          ${isCustom
            ? html`
                <md-outlined-button
                  ?disabled="${this._saving}"
                  @click="${this._restoreDefault}"
                >
                  ${this._('Restore Default')}
                </md-outlined-button>
              `
            : ''}

          <span class="save-feedback ${this._saved ? 'visible' : ''}">
            ✓ ${this._('Saved')}
          </span>
        </div>
      </div>

      <!-- ── Chat Access ── -->
      <div class="settings-card">
        <h3>${this._('Chat Access')}</h3>
        <p class="card-desc">
          ${this._('Choose which user groups can access the AI chat assistant.')}
        </p>
        <grampsjs-chat-permissions
          .appState="${this.appState}"
        ></grampsjs-chat-permissions>
      </div>

      <!-- ── Researcher Information ── -->
      ${!this.appState.frontendConfig?.hideResearcherDetails
        ? this._renderResearcherSection()
        : ''}
    `
  }

  _renderResearcherSection() {
    const researcher = this.appState.dbInfo?.researcher ?? {}
    const address = this._buildAddress()

    return html`
      <div class="settings-card">
        <h3>${this._('Researcher Information')}</h3>
        <p class="card-desc">
          ${this._('The researcher details associated with this family tree database.')}
        </p>

        <p class="researcher-name">${researcher.name || '–'}</p>

        <table class="researcher-table">
          <tr>
            <th>${this._('E-mail')}</th>
            <td>${researcher.email || '–'}</td>
          </tr>
          <tr>
            <th>${this._('Phone')}</th>
            <td>${researcher.phone || '–'}</td>
          </tr>
          ${address
            ? html`<tr>
                <th>${this._('Address')}</th>
                <td>${address}</td>
              </tr>`
            : ''}
        </table>
      </div>
    `
  }

  _buildAddress() {
    const researcher = this.appState.dbInfo?.researcher
    if (!researcher) {
      return null
    }

    const parts = [
      researcher.addr,
      researcher.locality,
      researcher.city,
      researcher.state,
      researcher.country,
      researcher.postal,
    ].filter(value => value)

    return parts.length === 0 ? null : parts.join(', ')
  }

  renderLoading() {
    return html`
      <div class="skeleton-card">
        <div class="skeleton-line" style="width:180px;height:22px;margin-bottom:8px"></div>
        <div class="skeleton-line" style="width:420px;height:14px;margin-bottom:20px"></div>
        <div class="skeleton-line" style="width:100%;height:240px;margin-bottom:14px"></div>
        <div class="skeleton-line" style="width:120px;height:36px;border-radius:18px"></div>
      </div>
      <div class="skeleton-card" style="height:100px"></div>
    `
  }

  // ── Event handlers ────────────────────────────────────────────────

  _handlePromptInput(e) {
    this._promptValue = e.target.value
    this._isDirty = this._promptValue !== this._serverPrompt
    this._saved = false
    // Auto-save draft to localStorage
    if (this._isDirty) {
      localStorage.setItem(DRAFT_KEY, this._promptValue)
    } else {
      localStorage.removeItem(DRAFT_KEY)
    }
    this._hasDraft = false
  }

  async _savePrompt() {
    this._saving = true
    // Empty string → clear custom prompt → restore default
    const payload = {system_prompt_ai: this._promptValue}
    const data = await this.appState.apiPut('/api/trees/-', payload)
    this._saving = false

    if ('error' in data) {
      fireEvent(this, 'grampsjs:error', {message: data.error})
    } else {
      this._isDirty = false
      this._hasDraft = false
      this._saved = true
      localStorage.removeItem(DRAFT_KEY)
      // Refresh data from server so status pill and config row update
      this._oldUrl = ''
      await this._updateData(false)
      setTimeout(() => {
        this._saved = false
      }, 3000)
    }
  }

  async _restoreDefault() {
    this._promptValue = ''
    this._isDirty = this._promptValue !== this._serverPrompt
    if (this._isDirty) {
      await this._savePrompt()
    }
  }

  _discardDraft() {
    localStorage.removeItem(DRAFT_KEY)
    this._hasDraft = false
    this._promptValue = this._serverPrompt
    this._isDirty = false
  }
}

window.customElements.define(
  'grampsjs-view-chat-settings',
  GrampsjsViewChatSettings
)
