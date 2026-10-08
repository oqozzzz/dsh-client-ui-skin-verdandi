/**
 * Verdandi / White Vow presentation skin.
 *
 * The runtime owns only reversible data attributes, a decorative stage inside
 * the conversation pane, and layout measurements used by that stage. It does
 * not register services or participate in model requests.
 */
import type { Context } from '@deepseek-ai/cordis'
import {
  DETAILS_ART_DARK,
  DETAILS_ART_LIGHT,
  SWORD_CREST,
} from './art.js'
import {
  BRIDAL_FLORAL_CORNER,
  BRIDAL_VEIL_CORNER,
  CHILDHOOD_RECORD,
  HERO_CHIBI_LEFT,
  HERO_CHIBI_RIGHT,
  OFFICIAL_SACRED_TREE,
  Q_AVATAR,
  RING_TAG,
  SEQUENCE_SWORD,
  SIDEBAR_BRIDAL_CG,
  STAGE_FIGURE_LEFT,
  STAGE_FIGURE_RIGHT,
  VOW_AVATAR_FRAME,
  VOW_FOLDER_ICON,
  VOW_NAMECARD,
  VOW_RINGS,
  WEDDING_AVATAR,
  WORKSPACE_SCENE_DARK,
  WORKSPACE_SCENE_LIGHT,
} from './stage-art.generated.js'
import {
  COMPOSER_LACE,
  HEADER_VEIL,
  INVITATION_LACE,
  SIDEBAR_FRAME,
  VOW_SEAL,
} from './ornaments.js'
import css from './verdandi.module.css'

const SKIN_ATTR = 'data-dsh-verdandi'
const WORKSPACE_ATTR = 'data-verdandi-workspace'
const MODAL_ATTR = 'data-verdandi-modal-open'
const SIDEBAR_SIZE_ATTR = 'data-verdandi-sidebar-size'
const CONVERSATION_PHASE_ATTR = 'data-verdandi-phase'
const CONVERSATION_VIEW_ATTR = 'data-verdandi-view'
const DETAILS_EMPTY_ATTR = 'data-verdandi-details-empty'
const SLIP_ATTR = 'data-verdandi-slip'
const RUNNING_ATTR = 'data-verdandi-running'
/**
 * The session header strip, in probe order. dsh 0.1.7 renders
 * `<div data-slot='conversation.header' style='display:contents'><header>` and
 * keeps `conversation.session.header` for the `display:contents` anchor that
 * holds the title row and the tabs inside that header, so the old
 * `[data-slot='conversation.session.header'] > header` child no longer exists.
 * The three candidates are probed one at a time rather than as one comma list:
 * a list resolves by document order, which picks the earlier anchor over its own
 * header, and the anchor carries neither its own paint nor a box.
 */
const HEADER_SELECTORS = [
  "[data-slot='conversation.header'] > header",
  "[data-slot='conversation.session.header'] > header",
  "[data-slot='conversation.session.header']:has(> header)",
] as const
/**
 * Pane anchors, in probe order. dsh 0.1.x marks each pane with `data-pane`;
 * 0.2 dropped that attribute and renders panes as `display: contents` slot
 * wrappers (`sidebar` / `main.conversation` / `rightbar`), so the probe walks
 * down to the first real box before the skin tags it with `data-verdandi-pane`.
 * Verified live on 0.2.0-rc.2: the wrappers generate no box, and every pane
 * rule in the stylesheet targets the tagged box.
 */
const PANE_ATTR = 'data-verdandi-pane'
const PANE_SELECTORS = {
  sidebar: ["[data-pane='sidebar']", "[data-slot='sidebar']"],
  conversation: ["[data-pane='conversation']", "[data-slot='main.conversation']", "[data-slot='main']"],
  details: ["[data-pane='details']", "[data-slot='rightbar']"],
} as const
/**
 * Proof that a resolved conversation box really is the chat workspace. dsh 0.2
 * swaps other panels (the plugin manager page, for one) into the same `main`
 * slot the chat lives in, so the descent can land on a panel that is not the
 * transcript; painting the chat surface's overflow clip onto those panels
 * breaks them. Any of these anchors — the phase marker both the chat and the
 * new-session hero carry — proves the box is the chat surface.
 */
const CHAT_ANCHOR_SELECTOR = [
  '[data-phase]',
  '[data-composer-seat]',
  "[data-slot='conversation.header']",
  "[data-slot='conversation.session.header']",
  '[data-chat-flow-kind]',
].join(', ')
/**
 * 0.2 tenants of the `main` slot that are not the transcript (the plugin
 * manager page, the automations page) still get the skinned backdrop — the
 * scenic background and the ink tokens — through this attribute. They never
 * get the chat surface's overflow clip, positioning or stage, so host
 * scrolling inside them stays native.
 */
const PANEL_ATTR = 'data-verdandi-panel'
const STAGE_SELECTOR = '[data-verdandi-stage]'
const DECORATION_SELECTOR = '[data-verdandi-decoration]'
const LEGACY_SELECTOR = '[data-verdandi-sidebar-card], [data-verdandi-wedding], [data-verdandi-chrome]'
const THEME_SOURCE = '@hjbztlbr/dsh-client-ui-skin-verdandi'
/**
 * Skin settings live in the host settings dialog as a `settings.section` slot
 * registration (the same channel the rail-tones plugin uses), not in a floating
 * control. The one option today is the veil strength; it persists through
 * localStorage and is seeded onto the body inline style on every attach.
 */
const SETTINGS_SECTION_ID = 'ui-skin-verdandi'
const VEIL_STORAGE_KEY = 'verdandi:veil-strength'
const SETTINGS_RETRY_MS = 400
const SETTINGS_MAX_TRIES = 60
const OWNED_HOOKS = [
  'data-verdandi-header',
  'data-verdandi-new-session',
  'data-verdandi-nav-entry',
  'data-verdandi-sidebar-action',
  PANE_ATTR,
  PANEL_ATTR,
  RUNNING_ATTR,
  DETAILS_EMPTY_ATTR,
] as const

/**
 * Markers for transcript rows the host renders as bare metadata over the scenic
 * workspace. The context/tool-change notice keeps its own class hash on the row
 * root, so it is hooked through the disclosure's two semantic attributes; the
 * system prompt only exposes its body, which is why every marker is resolved
 * through the node seat below.
 */
const SLIP_MARKER_SELECTOR = "[data-system-prompt-body], [data-context-source], [data-context-summary]"

type ThemeTokenPair = {
  light: string
  dark: string
}

type ThemeRuntimeLike = {
  overrideTokens(source: string, tokens: Record<string, ThemeTokenPair>): () => void
}

const THEME_TOKENS: Record<string, ThemeTokenPair> = {
  '--dsw-alias-brand-primary': { light: '#8e2438', dark: '#e4cfa0' },
  '--dsw-alias-button-primary-fill': { light: '#8e2438', dark: '#e4cfa0' },
  '--dsw-alias-button-primary-fill-active': { light: '#651a2b', dark: '#c6a767' },
  '--dsw-alias-button-primary-fill-hover': { light: '#752033', dark: '#f0ddb1' },
  '--dsw-alias-label-primary-inverted': { light: '#fffdfb', dark: '#25151b' },
}

const ASSET_PROPERTIES = {
  '--vd-art-sidebar-bridal': SIDEBAR_BRIDAL_CG,
  '--vd-art-workspace-light': WORKSPACE_SCENE_LIGHT,
  '--vd-art-workspace-dark': WORKSPACE_SCENE_DARK,
  '--vd-art-sword-crest': SWORD_CREST,
  '--vd-art-header-veil': HEADER_VEIL,
  '--vd-art-sidebar-frame': SIDEBAR_FRAME,
  '--vd-art-invitation-lace': INVITATION_LACE,
  '--vd-art-vow-seal': VOW_SEAL,
  '--vd-art-composer-lace': COMPOSER_LACE,
  '--vd-art-character-left': STAGE_FIGURE_LEFT,
  '--vd-art-character-right': STAGE_FIGURE_RIGHT,
  '--vd-art-official-sacred-tree': OFFICIAL_SACRED_TREE,
  '--vd-art-vow-avatar-frame': VOW_AVATAR_FRAME,
  '--vd-art-wedding-avatar': WEDDING_AVATAR,
  '--vd-art-vow-rings': VOW_RINGS,
  '--vd-art-ring-tag': RING_TAG,
  '--vd-art-vow-namecard': VOW_NAMECARD,
  '--vd-art-hero-chibi-left': HERO_CHIBI_LEFT,
  '--vd-art-hero-chibi-right': HERO_CHIBI_RIGHT,
  '--vd-art-childhood-record': CHILDHOOD_RECORD,
  '--vd-art-sequence-sword': SEQUENCE_SWORD,
  '--vd-art-q-avatar': Q_AVATAR,
  '--vd-art-bridal-floral-corner': BRIDAL_FLORAL_CORNER,
  '--vd-art-bridal-veil-corner': BRIDAL_VEIL_CORNER,
  '--vd-art-vow-folder': VOW_FOLDER_ICON,
  '--vd-art-details-light': DETAILS_ART_LIGHT,
  '--vd-art-details-dark': DETAILS_ART_DARK,
} as const

const layoutProperties = [
  '--vd-character-floor',
  '--vd-conversation-header-height',
] as const

function firstElement<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector)
}

function headerElement(root: ParentNode | null): HTMLElement | null {
  if (!root) return null
  for (const selector of HEADER_SELECTORS) {
    const header = root.querySelector<HTMLElement>(selector)
    if (header) return header
  }
  return null
}

/**
 * Resolve a pane's real box for `name`, or null while the shell shows neither
 * generation's anchor. The 0.2 wrapper is `display: contents`, so the walk
 * descends to the first element that actually generates a box; 0.1 panes are
 * real boxes and come back unchanged. jsdom computes `block` for unstyled
 * divs, so the walk is a no-op in the tests' 0.1-shaped fixtures.
 */
function paneElement(name: keyof typeof PANE_SELECTORS): HTMLElement | null {
  for (const selector of PANE_SELECTORS[name]) {
    const wrapper = document.querySelector<HTMLElement>(selector)
    if (!wrapper) continue
    let box = wrapper
    for (let depth = 0; depth < 4; depth += 1) {
      const display = typeof window !== 'undefined' && typeof window.getComputedStyle === 'function'
        ? window.getComputedStyle(box).display
        : ''
      if (display !== 'contents') break
      const next = box.firstElementChild
      if (!(next instanceof HTMLElement)) break
      box = next
    }
    return box
  }
  return null
}

/**
 * Resolve the conversation tenant of the 0.2 `main` slot (or the 0.1 pane).
 * A box that carries the chat anchors is the transcript and gets the full
 * conversation surface; a box without them is a swapped-in panel and gets
 * only the skinned backdrop through `data-verdandi-panel`.
 */
function resolveConversationPane(): { chat: HTMLElement | null; panel: HTMLElement | null } {
  for (const selector of PANE_SELECTORS.conversation) {
    const wrapper = document.querySelector<HTMLElement>(selector)
    if (!wrapper) continue
    let box = wrapper
    for (let depth = 0; depth < 4; depth += 1) {
      const display = typeof window !== 'undefined' && typeof window.getComputedStyle === 'function'
        ? window.getComputedStyle(box).display
        : ''
      if (display !== 'contents') break
      const next = box.firstElementChild
      if (!(next instanceof HTMLElement)) break
      box = next
    }
    if (box.querySelector(CHAT_ANCHOR_SELECTOR)) return { chat: box, panel: null }
    return { chat: null, panel: box }
  }
  return { chat: null, panel: null }
}

/** Attribute write that stays idle when the value already matches. */
function setAttrIfChanged(element: Element, name: string, value: string): void {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value)
}

/**
 * Tag the resolved pane boxes with `data-verdandi-pane`. The stylesheet is
 * generated against these skin-owned attributes, so one rule set addresses
 * both shell generations and dispose only ever removes skin attributes.
 */
function decoratePanes(): {
  sidebar: HTMLElement | null
  conversation: HTMLElement | null
  details: HTMLElement | null
} {
  const sidebar = paneElement('sidebar')
  const { chat: conversation, panel } = resolveConversationPane()
  const details = paneElement('details')
  if (sidebar) setAttrIfChanged(sidebar, PANE_ATTR, 'sidebar')
  if (conversation) setAttrIfChanged(conversation, PANE_ATTR, 'conversation')
  if (details) setAttrIfChanged(details, PANE_ATTR, 'details')
  if (panel) setAttrIfChanged(panel, PANEL_ATTR, '')
  // Sweep tags that no longer resolve, and pane-scoped state left behind by a
  // previous (possibly wrong) tag, without re-writing live ones: every idle
  // write is a mutation record the host's own observers have to digest.
  const currentPanes = new Set([sidebar, conversation, details])
  for (const tagged of document.querySelectorAll<HTMLElement>(`[${PANE_ATTR}]`)) {
    if (!currentPanes.has(tagged)) tagged.removeAttribute(PANE_ATTR)
  }
  for (const tagged of document.querySelectorAll<HTMLElement>(`[${PANEL_ATTR}]`)) {
    if (tagged !== panel) tagged.removeAttribute(PANEL_ATTR)
  }
  for (const stale of document.querySelectorAll<HTMLElement>(`[${CONVERSATION_PHASE_ATTR}]`)) {
    if (stale !== conversation) {
      for (const property of layoutProperties) stale.style.removeProperty(property)
      stale.removeAttribute(CONVERSATION_PHASE_ATTR)
      stale.removeAttribute(CONVERSATION_VIEW_ATTR)
    }
  }
  return { sidebar, conversation, details }
}

function isRendered(element: HTMLElement | null): element is HTMLElement {
  if (!element || element.hidden || element.getAttribute('aria-hidden') === 'true') return false
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden'
}

function removeLegacyNodes(): void {
  for (const node of document.querySelectorAll<HTMLElement>(LEGACY_SELECTOR)) node.remove()
}

function ensureDecoration(parent: HTMLElement | null, part: string): HTMLElement | null {
  if (!parent) return null
  let decoration = parent.querySelector<HTMLElement>(`:scope > [data-verdandi-decoration='${part}']`)
  if (decoration) return decoration

  decoration = document.createElement('div')
  decoration.dataset.verdandiDecoration = part
  decoration.setAttribute('aria-hidden', 'true')
  parent.append(decoration)
  return decoration
}

function ensureWeddingDecorations(
  sidebar: HTMLElement | null,
  conversation: HTMLElement | null,
  details: HTMLElement | null,
): void {
  const sidebarRoot = sidebar?.querySelector<HTMLElement>("[data-slot='sidebar']") ?? sidebar
  ensureDecoration(sidebarRoot, 'sidebar-portrait')
  ensureDecoration(sidebarRoot, 'sidebar-sacred-tree')
  ensureDecoration(sidebarRoot, 'sidebar-rail-avatar')
  ensureDecoration(sidebarRoot, 'sidebar-veil-corners-top')
  ensureDecoration(sidebarRoot, 'sidebar-veil-corners-bottom')
  ensureDecoration(conversation, 'workspace-lace')
  const header = headerElement(conversation)
  ensureDecoration(header, 'header-veil')
  ensureDecoration(header, 'header-namecard')
  ensureDecoration(header, 'header-bridal-corners')
  ensureDecoration(header, 'header-veil-corners')
  ensureDecoration(header, 'header-vow-crest')

  const composer = conversation?.querySelector<HTMLElement>('[data-composer-card]') ?? null
  ensureDecoration(composer, 'composer-seal')
  ensureDecoration(composer, 'composer-bridal-corners')
  ensureDecoration(composer, 'composer-veil-inner')
  ensureDecoration(composer, 'hero-chibi-left')
  ensureDecoration(composer, 'hero-chibi-right')
  ensureDecoration(details, 'details-record')

  // One avatar per assistant node, on the node's own body only. dsh 0.1.7 renders
  // the reasoning block (`[class*='thinkBody']`) and the folded work-steps group
  // (`[data-step-process-body]`) inside the transcript as well, and both contain
  // markdown of their own; decorating those puts a second and third avatar inside
  // the expanded blocks, where the skin never meant to draw one.
  for (const markdown of conversation?.querySelectorAll<HTMLElement>(
    "[data-chat-flow-kind='assistant-step'] [data-slot='conversation.chat.node'] [class*='_markdown_']",
  ) ?? []) {
    if (markdown.closest("[class*='thinkBody'], [data-step-process-body]")) continue
    ensureDecoration(markdown, 'assistant-avatar')
  }
}

/**
 * Mount the character stage inside `conversation`, adopting `retained` when
 * the host has just swapped the transcript root out from under the previous
 * stage (dsh 0.2 rebuilds that root on every session switch). Re-inserting
 * the same node keeps its phase, width and decoded artwork state, so the
 * figures no longer flash from full size down to their seated scale on each
 * switch; a freshly built stage would re-run both the scale transition and
 * the image decode.
 */
function ensureCharacterStage(conversation: HTMLElement, retained: HTMLElement | null): HTMLElement {
  let stage = conversation.querySelector<HTMLElement>(`:scope > ${STAGE_SELECTOR}`)
  if (
    stage
    && stage.querySelector("[data-verdandi-figure='left']")
    && stage.querySelector("[data-verdandi-figure='right']")
  ) {
    return stage
  }

  for (const stale of document.querySelectorAll<HTMLElement>(STAGE_SELECTOR)) {
    if (stale !== stage && stale !== retained) {
      stale.dataset.verdandiDiscard = ''
      stale.remove()
    }
  }

  if (
    retained
    && retained.isConnected === false
    && retained.querySelector("[data-verdandi-figure='left']")
    && retained.querySelector("[data-verdandi-figure='right']")
  ) {
    conversation.prepend(retained)
    return retained
  }
  if (retained) retained.dataset.verdandiDiscard = ''
  retained?.remove()

  stage = document.createElement('div')
  stage.dataset.verdandiStage = ''
  stage.className = css.characterStage ?? 'verdandiCharacterStage'
  stage.setAttribute('aria-hidden', 'true')

  const leftFigure = document.createElement('div')
  leftFigure.dataset.verdandiFigure = 'left'
  leftFigure.className = `${css.characterFigure ?? 'verdandiCharacterFigure'} ${css.figureLeft ?? 'verdandiFigureLeft'}`

  const rightFigure = document.createElement('div')
  rightFigure.dataset.verdandiFigure = 'right'
  rightFigure.className = `${css.characterFigure ?? 'verdandiCharacterFigure'} ${css.figureRight ?? 'verdandiFigureRight'}`

  stage.append(leftFigure, rightFigure)
  conversation.prepend(stage)
  return stage
}

function clearOwnedHooks(): void {
  for (const attribute of OWNED_HOOKS) {
    for (const element of document.querySelectorAll<HTMLElement>(`[${attribute}]`)) {
      element.removeAttribute(attribute)
    }
  }
}

/**
 * Resolve the row element that should carry a slip for `marker`.
 *
 * The host wraps every chat node in a stable seat, and the seat is the
 * innermost element guaranteed to contain the marker, so the slip never spans
 * more than one row. `data-slot` is preferred over `data-chat-flow-key`
 * because the seat is nested inside the flow item.
 * @param marker - Element that identifies the row, e.g. a system-prompt body.
 * @returns The nearest containing row element, or null outside the chat seat.
 */
function slipRowFor(marker: HTMLElement): HTMLElement | null {
  const seat = marker.closest<HTMLElement>("[data-slot='conversation.chat.node']")
  if (seat) {
    const root = seat.firstElementChild
    if (root instanceof HTMLElement && root.contains(marker)) return root
    return seat
  }
  return marker.closest<HTMLElement>('[data-chat-flow-key]')
}

/**
 * Tag the transcript rows that have no CSS-stable hook with the slip attribute.
 * Rows the stylesheet can target directly (turn error, compaction, process,
 * tail) are left untouched, so only this marker list needs runtime work.
 * @param conversation - Visible conversation pane, or null when unrendered.
 */
function decorateLegibilityRows(conversation: HTMLElement | null): void {
  const rows = new Set<HTMLElement>()
  for (const marker of conversation?.querySelectorAll<HTMLElement>(SLIP_MARKER_SELECTOR) ?? []) {
    const row = slipRowFor(marker)
    if (row) rows.add(row)
  }

  for (const tagged of conversation?.querySelectorAll<HTMLElement>(`[${SLIP_ATTR}]`) ?? []) {
    if (!rows.has(tagged)) tagged.removeAttribute(SLIP_ATTR)
  }
  for (const row of rows) {
    if (row.getAttribute(SLIP_ATTR) !== 'context') row.setAttribute(SLIP_ATTR, 'context')
  }
}

const NAV_MARK_ATTR = 'data-verdandi-nav-entry'
const NEW_SESSION_MARK_ATTR = 'data-verdandi-new-session'
const SIDEBAR_ACTION_ATTR = 'data-verdandi-sidebar-action'

function decorateStableRegions(): void {
  const header = headerElement(document)
  if (header) setAttrIfChanged(header, 'data-verdandi-header', '')
  for (const stale of document.querySelectorAll('[data-verdandi-header]')) {
    if (stale !== header) stale.removeAttribute('data-verdandi-header')
  }

  const panes = decoratePanes()
  const details = panes.details
  const detailsText = (details?.textContent ?? '').replace(/\s+/g, ' ').trim()
  const detailsEmpty = /点击消息流中的工具行查看详情|select.+tool.+row.+details|空面板|请先选择会话/i.test(detailsText)
  if (details) {
    if (detailsEmpty) setAttrIfChanged(details, DETAILS_EMPTY_ATTR, '')
    else details.removeAttribute(DETAILS_EMPTY_ATTR)
  } else {
    for (const stale of document.querySelectorAll(`[${DETAILS_EMPTY_ATTR}]`)) stale.removeAttribute(DETAILS_EMPTY_ATTR)
  }

  const sidebar = panes.sidebar
  if (!sidebar) return

  // Guarded writes only: in steady state this loop performs zero DOM
  // mutations, so the host's own subtree observers are never fed records by
  // the skin (the 0.2 sidebar re-measures its virtual list on mutation
  // bursts, and blind rewrites kept poking it ~9 times a second).
  const marked = new Set<Element>()
  for (const button of sidebar.querySelectorAll<HTMLButtonElement>('button')) {
    const label = `${button.getAttribute('aria-label') ?? ''} ${button.textContent ?? ''}`.trim()
    const text = (button.textContent ?? '').trim()

    // dsh 0.1.7 wraps the label in `newSessionLabel` / `newSessionContent` and
    // appends a shortcut hint, so the button text is no longer the bare label.
    // Match the stable class suffix first and keep the text rule for older shells.
    // 0.2 renames the nav entries (插件 / 自动化任务 replace 任务看板 / SSH / 技能中心);
    // both sets stay tagged so the crimson nav treatment addresses either shell.
    if (/newSession/i.test(button.className) || /^(新会话|New session)$/i.test(text)) {
      setAttrIfChanged(button, NEW_SESSION_MARK_ATTR, '')
      marked.add(button)
    }
    if (/^(任务看板|Task board|SSH|技能中心|Skill center|插件|Plugins|自动化任务|Automations|Automated tasks)$/i.test(text)) {
      setAttrIfChanged(button, NAV_MARK_ATTR, '')
      marked.add(button)
    }
    if (/搜索会话|Search sessions|视图选项|View options|添加工作区|Add workspace/i.test(label)) {
      setAttrIfChanged(button, SIDEBAR_ACTION_ATTR, '')
      marked.add(button)
    }
  }
  for (const attr of [NEW_SESSION_MARK_ATTR, NAV_MARK_ATTR, SIDEBAR_ACTION_ATTR]) {
    for (const tagged of document.querySelectorAll(`[${attr}]`)) {
      if (!marked.has(tagged)) tagged.removeAttribute(attr)
    }
  }
}

/**
 * Mark the turn-process control while its turn is actually running.
 *
 * dsh 0.1.7 moved the live status into that control and switches its label copy
 * with the turn state (running / worked / took / failed), so the skin's copy
 * swap has to be scoped by state instead of by the removed `_turnStatus` class.
 * Only the running label is marked, so the finished states keep the host wording.
 * @param conversation - Visible conversation pane, or null when unrendered.
 */
function markRunningStatus(conversation: HTMLElement | null): void {
  const running = conversation
    ? [...conversation.querySelectorAll<HTMLElement>('[data-turn-process]')].filter((node) => {
      const text = (node.querySelector("[class*='_label']")?.textContent ?? '').trim()
      return /^(深度求索中|Deep diving)/i.test(text)
    })
    : []

  for (const marked of document.querySelectorAll<HTMLElement>(`[${RUNNING_ATTR}]`)) {
    if (!running.includes(marked)) marked.removeAttribute(RUNNING_ATTR)
  }
  for (const node of running) setAttrIfChanged(node, RUNNING_ATTR, '')
}

function setSidebarSize(body: HTMLElement, sidebar: HTMLElement | null): void {
  const width = sidebar?.getBoundingClientRect().width || sidebar?.offsetWidth || 0
  if (width > 0 && width < 96) setAttrIfChanged(body, SIDEBAR_SIZE_ATTR, 'rail')
  else if (width > 0 && width < 260) setAttrIfChanged(body, SIDEBAR_SIZE_ATTR, 'narrow')
  else setAttrIfChanged(body, SIDEBAR_SIZE_ATTR, 'wide')
}

function measureConversation(conversation: HTMLElement): void {
  const conversationRect = conversation.getBoundingClientRect()
  const header = headerElement(conversation)
  const composer = conversation.querySelector<HTMLElement>(
    "[data-composer-seat], [data-slot='conversation.input.dock'], [data-slot='conversation.composer']",
  )

  const headerRect = header?.getBoundingClientRect()
  const composerRect = composer?.getBoundingClientRect()
  const headerHeight = headerRect && headerRect.height > 0
    ? Math.max(0, headerRect.bottom - conversationRect.top)
    : 76
  const floor = composerRect && composerRect.height > 0
    ? Math.max(18, conversationRect.bottom - composerRect.top + 8)
    : 154

  // Idle-measuring: identical values are not rewritten, so the pane's style
  // attribute stops churning once the layout has settled.
  const headerValue = `${Math.round(headerHeight)}px`
  const floorValue = `${Math.round(floor)}px`
  if (conversation.style.getPropertyValue('--vd-conversation-header-height') !== headerValue) {
    conversation.style.setProperty('--vd-conversation-header-height', headerValue)
  }
  if (conversation.style.getPropertyValue('--vd-character-floor') !== floorValue) {
    conversation.style.setProperty('--vd-character-floor', floorValue)
  }
}

function setStageWidth(stage: HTMLElement, conversation: HTMLElement): void {
  const width = conversation.getBoundingClientRect().width || conversation.offsetWidth || 0
  const band = width >= 1360 ? 'wide' : width >= 840 ? 'medium' : 'compact'
  const display = width >= 840 ? 'block' : 'none'
  if (stage.dataset.verdandiWidth !== band) stage.dataset.verdandiWidth = band
  // The host's alternate work surfaces apply an important aria-hidden rule to
  // decorative children. This is our own node, so an owned inline declaration
  // is the narrowest reliable way to keep it visible on usable widths.
  if (stage.style.getPropertyValue('display') !== display || stage.style.getPropertyPriority('display') !== 'important') {
    stage.style.setProperty('display', display, 'important')
  }
}

function setConversationView(conversation: HTMLElement): 'chat' | 'trace' {
  const selectedTab = conversation.querySelector<HTMLElement>(
    "[data-verdandi-header] [role='tab'][aria-selected='true']",
  )
  const label = (selectedTab?.textContent ?? '').trim()
  const view = /^(轨迹|Trace)$/i.test(label) ? 'trace' : 'chat'
  setAttrIfChanged(conversation, CONVERSATION_VIEW_ATTR, view)
  return view
}

function restoreAttribute(element: HTMLElement, name: string, previous: string | null): void {
  if (previous === null) element.removeAttribute(name)
  else element.setAttribute(name, previous)
}

/** Persisted veil strength, clamped to 0–1; 1 (the designed fog) on any doubt. */
function readVeilStrength(): number {
  try {
    const raw = localStorage.getItem(VEIL_STORAGE_KEY)
    if (raw === null) return 1
    const value = Number(raw)
    if (!Number.isFinite(value)) return 1
    return Math.min(1, Math.max(0, value))
  } catch {
    return 1
  }
}

function applyVeilStrength(body: HTMLElement, strength: number): void {
  const scaled = strength.toFixed(2)
  if (body.style.getPropertyValue('--vd-veil-strength') !== scaled) {
    body.style.setProperty('--vd-veil-strength', scaled)
  }
}

/** Minimal shape of the shell's slot service (proven against 0.2.0-rc.2). */
type SettingsSlots = {
  inject(slot: string, onDeclared: () => void): void
  register(declaration: Record<string, unknown>, component: unknown): void
}

/** The slice of React the settings card needs; served by the platform module table. */
type ReactModule = {
  createElement(
    type: string,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ): unknown
  useState<T>(initial: T | (() => T)): [T, (value: T) => void]
}

/**
 * The loader hands the client factory the platform require as its parameter —
 * in the built CJS bundle `require` binds to that parameter, so an aliased
 * call stays a runtime lookup (a direct `require('react')` literal would be
 * resolved at build time, and react is deliberately not installed here).
 */
function acquireReact(): ReactModule | null {
  try {
    const runtimeRequire = typeof require === 'function' ? require : null
    const mod = (runtimeRequire?.('react') ?? null) as ReactModule | null
    if (mod && typeof mod.createElement === 'function' && typeof mod.useState === 'function') return mod
  } catch {
    /* platform table without react: the settings card is skipped */
  }
  return null
}

/* Card furniture mirrors the rail-tones settings section, so both plugin
   cards read as one dialog. Colors lean on the host's alias tokens. */
const SETTINGS_CARD_STYLE: Record<string, string> = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  padding: '14px 16px',
  border: '1px solid var(--dsw-alias-border-secondary, rgba(127, 127, 127, 0.24))',
  borderRadius: '12px',
  fontSize: '13px',
  lineHeight: '1.5',
  color: 'inherit',
}
const SETTINGS_ROW_STYLE: Record<string, string> = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '16px',
}
const SETTINGS_TEXT_STYLE: Record<string, string> = { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '0' }
const SETTINGS_TITLE_STYLE: Record<string, string> = { fontSize: '13px', fontWeight: '600' }
const SETTINGS_DESC_STYLE: Record<string, string> = { fontSize: '12px', opacity: '0.66' }
const SETTINGS_CONTROL_STYLE: Record<string, string> = { display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' }
const SETTINGS_SLIDER_STYLE: Record<string, string> = { width: '140px', accentColor: 'var(--dsw-alias-brand-primary, #4d6bfe)' }
const SETTINGS_VALUE_STYLE: Record<string, string> = { fontSize: '12px', opacity: '0.66', minWidth: '36px', textAlign: 'right' }

/**
 * Mount the skin's settings section in the host settings dialog and wire its
 * behavior. Returns the teardown: the retry timer removal, so dispose leaves
 * no pending registration attempt behind. The slider drives
 * `--vd-veil-strength` (0–1) on the body inline style — the stylesheet scales
 * every veil color from it — and persists through localStorage for the next
 * session.
 *
 * Both `ctx.slots` and the platform React may not be there yet when this runs
 * (the skin attaches before the shell declares its slots owner), so inject and
 * register each retry on a bounded budget and the whole attempt is skipped
 * quietly when the environment cannot support it — the skin itself never
 * depends on the settings card.
 */
function registerSettingsSection(ctx: Context): () => void {
  const slots = (ctx as unknown as { slots?: SettingsSlots }).slots
  if (!slots || typeof slots.inject !== 'function' || typeof slots.register !== 'function') return () => {}
  const React = acquireReact()
  if (!React) return () => {}
  const h = React.createElement

  const VerdandiSettingsCard = () => {
    const [percent, setPercent] = React.useState(() => Math.round(readVeilStrength() * 100))
    const onRange = (event: { target: { value: string } }) => {
      const next = Math.round(Number(event.target.value)) || 0
      setPercent(next)
      applyVeilStrength(document.body, next / 100)
      try {
        localStorage.setItem(VEIL_STORAGE_KEY, String(next / 100))
      } catch {
        /* storage unavailable: the setting just won't survive a reload */
      }
    }
    return h('div', { style: SETTINGS_CARD_STYLE }, [
      h('div', { key: 'row', style: SETTINGS_ROW_STYLE }, [
        h('div', { key: 'text', style: SETTINGS_TEXT_STYLE }, [
          h('div', { key: 'title', style: SETTINGS_TITLE_STYLE }, '雾化浓度'),
          h('div', { key: 'desc', style: SETTINGS_DESC_STYLE }, '插件 / 自动化任务 / 轨迹页的背景雾化：0% 完全透出画稿，100% 几乎完全遮住。'),
        ]),
        h('div', { key: 'control', style: SETTINGS_CONTROL_STYLE }, [
          h('input', {
            key: 'slider',
            type: 'range',
            min: 0,
            max: 100,
            step: 1,
            value: percent,
            'aria-label': '雾化浓度',
            onChange: onRange,
            style: SETTINGS_SLIDER_STYLE,
          }),
          h('span', { key: 'value', style: SETTINGS_VALUE_STYLE }, `${percent}%`),
        ]),
      ]),
    ])
  }

  let timer: ReturnType<typeof setTimeout> | null = null
  let tries = 0
  let registered = false
  const attempt = (): boolean => {
    if (registered) return true
    tries += 1
    try {
      slots.inject('settings.section', () => {
        if (registered) return
        try {
          slots.register(
            {
              name: 'settings.section',
              id: SETTINGS_SECTION_ID,
              order: 46,
              label: () => 'Verdandi 皮肤',
              inject: () => ({}),
            },
            VerdandiSettingsCard,
          )
          registered = true
        } catch {
          /* retried by the outer budget until it runs out */
        }
      })
    } catch {
      /* the slots owner has not declared the section yet: retried below */
    }
    return registered
  }
  const tick = () => {
    if (registered || attempt()) return
    if (tries >= SETTINGS_MAX_TRIES) return
    timer = setTimeout(tick, SETTINGS_RETRY_MS)
  }
  tick()

  return () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }
}

export function apply(ctx: Context): void {
  const body = document.body
  const theme = ctx.get('theme') as ThemeRuntimeLike | undefined
  if (typeof theme?.overrideTokens === 'function') {
    ctx.effect(
      () => theme.overrideTokens(THEME_SOURCE, THEME_TOKENS),
      'ui-skin-verdandi: official theme token layer',
    )
  }
  const previousAttributes = new Map<string, string | null>([
    [SKIN_ATTR, body.getAttribute(SKIN_ATTR)],
    [WORKSPACE_ATTR, body.getAttribute(WORKSPACE_ATTR)],
    [MODAL_ATTR, body.getAttribute(MODAL_ATTR)],
    [SIDEBAR_SIZE_ATTR, body.getAttribute(SIDEBAR_SIZE_ATTR)],
  ])
  const previousAssetProperties = new Map<string, { value: string; priority: string }>()

  for (const [property, asset] of Object.entries(ASSET_PROPERTIES)) {
    previousAssetProperties.set(property, {
      value: body.style.getPropertyValue(property),
      priority: body.style.getPropertyPriority(property),
    })
    body.style.setProperty(property, `url(${JSON.stringify(asset)})`)
  }
  const previousVeilStrength = body.style.getPropertyValue('--vd-veil-strength')
  applyVeilStrength(body, readVeilStrength())
  const disposeSettingsRetries = registerSettingsSection(ctx)
  body.setAttribute(SKIN_ATTR, '')
  removeLegacyNodes()

  let resizeObserver: ResizeObserver | null = null
  let observed = new Set<Element>()
  let animationFrame = 0
  // The stage survives host transcript swaps: dsh 0.2 rebuilds the chat root
  // on every session switch, which used to take the stage — and the figures'
  // settled scale and decoded artwork — down with it.
  let retainedStage: HTMLElement | null = null
  const requestFrame = typeof window.requestAnimationFrame === 'function'
    ? window.requestAnimationFrame.bind(window)
    : (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 0)
  const cancelFrame = typeof window.cancelAnimationFrame === 'function'
    ? window.cancelAnimationFrame.bind(window)
    : window.clearTimeout.bind(window)

  const syncResizeTargets = (targets: Array<HTMLElement | null>) => {
    if (!resizeObserver) return
    const next = new Set<Element>(targets.filter((target): target is HTMLElement => Boolean(target)))
    next.add(body)
    for (const element of observed) if (!next.has(element)) resizeObserver.unobserve(element)
    for (const element of next) if (!observed.has(element)) resizeObserver.observe(element)
    observed = next
  }

  const sync = () => {
    animationFrame = 0
    removeLegacyNodes()
    decorateStableRegions()

    // decorateStableRegions has just tagged the resolved pane boxes, so the
    // skin-owned attribute addresses either shell generation from here on.
    const sidebar = firstElement<HTMLElement>("[data-verdandi-pane='sidebar']")
    const conversation = firstElement<HTMLElement>("[data-verdandi-pane='conversation']")
    const details = firstElement<HTMLElement>("[data-verdandi-pane='details']")
    const workspaceVisible = isRendered(conversation)

    if (workspaceVisible) {
      body.setAttribute(WORKSPACE_ATTR, '')
    } else if (body.hasAttribute(WORKSPACE_ATTR)) {
      body.removeAttribute(WORKSPACE_ATTR)
    }
    const modalOpen = Boolean(document.querySelector("[role='dialog'][aria-modal='true']"))
    if (modalOpen) body.setAttribute(MODAL_ATTR, '')
    else if (body.hasAttribute(MODAL_ATTR)) body.removeAttribute(MODAL_ATTR)
    setSidebarSize(body, sidebar)
    ensureWeddingDecorations(sidebar, workspaceVisible ? conversation : null, details)
    decorateLegibilityRows(workspaceVisible ? conversation : null)
    markRunningStatus(workspaceVisible ? conversation : null)

    if (workspaceVisible) {
      const stage = ensureCharacterStage(conversation, retainedStage)
      retainedStage = null
      const phase = conversation.querySelector<HTMLElement>('[data-phase]')?.getAttribute('data-phase') ?? 'active'
      setConversationView(conversation)
      if (stage.dataset.verdandiPhase !== phase) stage.dataset.verdandiPhase = phase
      setAttrIfChanged(conversation, CONVERSATION_PHASE_ATTR, phase)
      measureConversation(conversation)
      setStageWidth(stage, conversation)
    } else {
      const stage = document.querySelector<HTMLElement>(STAGE_SELECTOR)
      if (stage instanceof HTMLElement) retainedStage = stage
      for (const stale of document.querySelectorAll<HTMLElement>(STAGE_SELECTOR)) {
        if (stale !== retainedStage) stale.remove()
      }
      for (const pane of document.querySelectorAll<HTMLElement>("[data-verdandi-pane='conversation']")) {
        pane.removeAttribute(CONVERSATION_PHASE_ATTR)
        pane.removeAttribute(CONVERSATION_VIEW_ATTR)
      }
    }

    syncResizeTargets([
      sidebar,
      conversation,
      details,
      headerElement(conversation),
      conversation?.querySelector<HTMLElement>("[data-composer-seat], [data-slot='conversation.input.dock']") ?? null,
    ])
  }

  const scheduleSync = () => {
    if (animationFrame) return
    animationFrame = requestFrame(sync)
  }

  resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleSync)
  const mutationObserver = new MutationObserver((mutations) => {
    // Retain the stage no matter who detaches it. The 0.2 chat→chat session
    // switch rebuilds the transcript root while the workspace stays visible —
    // the path where nothing else stashes the stage — so the removal records
    // are the only reliable hook. A subtree removal lists only its root, so
    // removed subtrees are searched for the stage as well; deliberate skin
    // removals mark the node discarded and are never captured.
    for (const mutation of mutations) {
      for (const node of mutation.removedNodes) {
        if (!(node instanceof HTMLElement)) continue
        if (node.dataset.verdandiDiscard !== undefined) continue
        if (node.matches(STAGE_SELECTOR)) retainedStage = node
        else {
          const inside = node.querySelector<HTMLElement>(STAGE_SELECTOR)
          if (inside && inside.dataset.verdandiDiscard === undefined) retainedStage = inside
        }
      }
    }
    scheduleSync()
  })
  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-expanded', 'aria-selected', 'data-phase', 'hidden'],
  })
  window.addEventListener('resize', scheduleSync)
  window.visualViewport?.addEventListener('resize', scheduleSync)
  sync()

  ctx.effect(() => () => {
    mutationObserver.disconnect()
    resizeObserver?.disconnect()
    if (animationFrame) cancelFrame(animationFrame)
    window.removeEventListener('resize', scheduleSync)
    window.visualViewport?.removeEventListener('resize', scheduleSync)
    disposeSettingsRetries()
    if (previousVeilStrength) body.style.setProperty('--vd-veil-strength', previousVeilStrength)
    else body.style.removeProperty('--vd-veil-strength')

    // Pane-owned inline state goes first: the loop keys on the skin attribute
    // and clearOwnedHooks below strips it.
    for (const conversation of document.querySelectorAll<HTMLElement>(
      "[data-verdandi-pane='conversation']",
    )) {
      for (const property of layoutProperties) conversation.style.removeProperty(property)
      conversation.removeAttribute(CONVERSATION_PHASE_ATTR)
      conversation.removeAttribute(CONVERSATION_VIEW_ATTR)
    }

    clearOwnedHooks()
    retainedStage = null
    for (const decoration of document.querySelectorAll<HTMLElement>(DECORATION_SELECTOR)) decoration.remove()
    for (const slip of document.querySelectorAll<HTMLElement>(`[${SLIP_ATTR}]`)) slip.removeAttribute(SLIP_ATTR)
    for (const stage of document.querySelectorAll<HTMLElement>(STAGE_SELECTOR)) stage.remove()

    for (const [property, previous] of previousAssetProperties) {
      if (previous.value) body.style.setProperty(property, previous.value, previous.priority)
      else body.style.removeProperty(property)
    }
    for (const [attribute, previous] of previousAttributes) restoreAttribute(body, attribute, previous)
  }, 'ui-skin-verdandi: white-vow presentation')
}

/**
 * Cordis service dependencies. `slots` is what lets the skin register its
 * settings card into the host settings dialog; without the declaration the
 * shell never attaches the service and `ctx.slots` stays undefined (the skin
 * still works — the card is just skipped).
 */
export const inject = ['slots']
