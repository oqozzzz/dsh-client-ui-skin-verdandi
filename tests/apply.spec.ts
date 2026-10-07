import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { apply } from '../src/client/index.js'

class MockContext {
  private disposers: Array<() => void> = []
  constructor(private services: Record<string, unknown> = {}) {}
  get(name: string): unknown {
    return this.services[name]
  }
  effect(fn: () => () => void): void {
    this.disposers.push(fn())
  }
  disposeAll(): void {
    for (const dispose of this.disposers.splice(0)) dispose()
  }
}

/** Shells before 0.1.7: the header is the child of the session-header anchor. */
const LEGACY_HEADER = `<div data-slot="conversation.session.header" style="display:contents"><header>
  <div class="host_titleRow"><button role="tab" aria-selected="true">对话</button></div>
</header></div>`

describe('verdandi skin apply/dispose contract', () => {
  let ctx: MockContext
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="root">
        <div data-pane="sidebar">
          <button aria-label="新建会话">新会话</button>
          <button>任务看板</button>
          <button>SSH</button>
          <button>技能中心</button>
          <button aria-label="搜索会话"></button>
          <div role="treeitem" aria-expanded="true">AI</div>
          <div role="treeitem" aria-selected="true">Current session</div>
        </div>
        <div data-pane="conversation">
          <div data-slot="conversation.header" style="display:contents"><header>
            <div data-slot="conversation.session.header" style="display:contents">
              <div class="host_titleRow">
                <button role="tab" aria-selected="true">对话</button>
                <button role="tab" aria-selected="false">轨迹</button>
              </div>
            </div>
          </header></div>
          <div data-phase="active"></div>
          <div data-chat-flow-kind="assistant-step"><div data-slot="conversation.chat.node">
            <div class="host-assistant-card"><div class="host_markdown_body"><p>Assistant response</p></div></div>
          </div></div>
          <div data-chat-flow-kind="system-prompt" data-chat-flow-key="system-prompt">
            <div data-slot="conversation.chat.node">
              <div class="host_context_row">
                <button class="host_context_title">系统提示词</button>
                <div data-system-prompt-body>PROMPT</div>
              </div>
            </div>
          </div>
          <div data-chat-flow-kind="context" data-chat-flow-key="context">
            <div data-slot="conversation.chat.node">
              <div class="host_notice_row">
                <span data-context-source>工具变更</span>
                <span data-context-summary>+2 / -1</span>
              </div>
            </div>
          </div>
          <div data-composer-seat><div data-composer-card></div></div>
        </div>
        <aside data-pane="details"><div data-slot="details">详情点击消息流中的工具行查看详情</div></aside>
      </div>`
    ctx = new MockContext()
  })
  afterEach(() => {
    ctx.disposeAll()
  })

  it('sets the skin body attribute and removes it on dispose', () => {
    apply(ctx as never)
    expect(document.body.hasAttribute('data-dsh-verdandi')).toBe(true)
    ctx.disposeAll()
    expect(document.body.hasAttribute('data-dsh-verdandi')).toBe(false)
  })

  it('restores the previous body attribute value', () => {
    document.body.setAttribute('data-dsh-verdandi', 'previous')
    apply(ctx as never)
    expect(document.body.getAttribute('data-dsh-verdandi')).toBe('')
    ctx.disposeAll()
    expect(document.body.getAttribute('data-dsh-verdandi')).toBe('previous')
  })

  it('uses and disposes the official theme token extension when available', () => {
    const disposeTheme = vi.fn()
    const overrideTokens = vi.fn(() => disposeTheme)
    ctx = new MockContext({ theme: { overrideTokens } })

    apply(ctx as never)

    expect(overrideTokens).toHaveBeenCalledWith(
      '@hjbztlbr/dsh-client-ui-skin-verdandi',
      expect.objectContaining({
        '--dsw-alias-brand-primary': { light: '#8e2438', dark: '#e4cfa0' },
        '--dsw-alias-button-primary-fill': { light: '#8e2438', dark: '#e4cfa0' },
      }),
    )
    ctx.disposeAll()
    expect(disposeTheme).toHaveBeenCalledOnce()
  })

  it('removes legacy fixed decorations and mounts the character stage inside conversation', () => {
    document.querySelector('[data-pane="sidebar"]')?.insertAdjacentHTML(
      'beforeend',
      '<div data-verdandi-sidebar-card="" aria-hidden="true"></div>',
    )
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div data-verdandi-wedding=""></div><div data-verdandi-chrome="top"></div>',
    )
    apply(ctx as never)

    const sidebar = document.querySelector('[data-pane="sidebar"]')
    const conversation = document.querySelector('[data-pane="conversation"]')
    expect(sidebar?.querySelector('[data-verdandi-sidebar-card]')).toBeNull()
    expect(document.querySelector('[data-verdandi-wedding]')).toBeNull()
    expect(document.querySelector('[data-verdandi-chrome]')).toBeNull()
    expect(conversation?.querySelector(':scope > [data-verdandi-stage]')).not.toBeNull()
    expect(conversation?.querySelectorAll('[data-verdandi-figure]')).toHaveLength(2)
    expect(conversation?.querySelector("[data-verdandi-figure='left']")).not.toBeNull()
    expect(conversation?.querySelector("[data-verdandi-figure='right']")).not.toBeNull()
    expect(conversation?.querySelector("[data-verdandi-stage] > [data-verdandi-decoration='hero-supply']")).toBeNull()
    expect((conversation?.querySelector('[data-verdandi-stage]') as HTMLElement | null)?.style.getPropertyPriority('display')).toBe('important')
    expect(conversation?.getAttribute('data-verdandi-phase')).toBe('active')
    expect(conversation?.getAttribute('data-verdandi-view')).toBe('chat')
    expect(document.body.hasAttribute('data-verdandi-workspace')).toBe(true)
    expect(sidebar?.querySelector(":scope > [data-verdandi-decoration='sidebar-portrait']")).not.toBeNull()
    expect(sidebar?.querySelector(":scope > [data-verdandi-decoration='sidebar-sacred-tree']")).not.toBeNull()
    expect(sidebar?.querySelector(":scope > [data-verdandi-decoration='sidebar-rail-avatar']")).not.toBeNull()
    expect(sidebar?.querySelector(":scope > [data-verdandi-decoration='sidebar-veil-corners-top']")).not.toBeNull()
    expect(sidebar?.querySelector(":scope > [data-verdandi-decoration='sidebar-veil-corners-bottom']")).not.toBeNull()
    expect(conversation?.querySelector(":scope > [data-verdandi-decoration='workspace-lace']")).not.toBeNull()
    expect(conversation?.querySelector("header > [data-verdandi-decoration='header-veil']")).not.toBeNull()
    expect(conversation?.querySelector("header > [data-verdandi-decoration='header-namecard']")).not.toBeNull()
    expect(conversation?.querySelector("header > [data-verdandi-decoration='header-bridal-corners']")).not.toBeNull()
    expect(conversation?.querySelector("header > [data-verdandi-decoration='header-veil-corners']")).not.toBeNull()
    expect(conversation?.querySelector("header > [data-verdandi-decoration='header-vow-crest']")).not.toBeNull()
    expect(conversation?.querySelector("[data-composer-card] > [data-verdandi-decoration='composer-seal']")).not.toBeNull()
    expect(conversation?.querySelector("[data-composer-card] > [data-verdandi-decoration='composer-bridal-corners']")).not.toBeNull()
    expect(conversation?.querySelector("[data-composer-card] > [data-verdandi-decoration='composer-veil-inner']")).not.toBeNull()
    expect(conversation?.querySelector("[data-composer-card] > [data-verdandi-decoration='hero-chibi-left']")).not.toBeNull()
    expect(conversation?.querySelector("[data-composer-card] > [data-verdandi-decoration='hero-chibi-right']")).not.toBeNull()
    expect(document.querySelector("[data-pane='details'][data-verdandi-details-empty]")).not.toBeNull()
    expect(document.querySelector("[data-pane='details'] > [data-verdandi-decoration='details-record']")).not.toBeNull()
    expect(conversation?.querySelector("[class*='_markdown_'] > [data-verdandi-decoration='assistant-avatar']")).not.toBeNull()

    ctx.disposeAll()
    expect(document.querySelector('[data-verdandi-sidebar-card]')).toBeNull()
    expect(document.querySelector('[data-verdandi-stage]')).toBeNull()
    expect(document.querySelector('[data-verdandi-decoration]')).toBeNull()
  })

  it('selects the trajectory view without tagging host timeline content', () => {
    const conversation = document.querySelector('[data-pane="conversation"]')
    conversation?.querySelector('[role="tab"][aria-selected="true"]')?.setAttribute('aria-selected', 'false')
    const traceTab = Array.from(conversation?.querySelectorAll('[role="tab"]') ?? [])
      .find((tab) => tab.textContent === '轨迹')
    traceTab?.setAttribute('aria-selected', 'true')
    conversation?.insertAdjacentHTML(
      'beforeend',
      '<section aria-label="Trajectory timeline">No timing data</section>',
    )

    apply(ctx as never)

    expect(conversation?.getAttribute('data-verdandi-view')).toBe('trace')
    expect(conversation?.querySelector("[aria-label='Trajectory timeline']")?.textContent).toBe('No timing data')
    expect(conversation?.querySelector('[data-verdandi-trace-empty]')).toBeNull()
  })

  it('slips the system-prompt row and releases it on dispose', () => {
    apply(ctx as never)

    // Only the marker-driven rows need a runtime hook; the rest of the slip
    // family is addressed by CSS-stable host attributes and class suffixes.
    expect(document.querySelector('.host_context_row')?.getAttribute('data-verdandi-slip')).toBe('context')
    expect(document.querySelector('.host-assistant-card')?.hasAttribute('data-verdandi-slip')).toBe(false)
    // The context / tool-change notice carries no stable class either: only its
    // disclosure's two semantic attributes, which the marker list now includes.
    expect(document.querySelector('.host_notice_row')?.getAttribute('data-verdandi-slip')).toBe('context')

    ctx.disposeAll()
    expect(document.querySelector('[data-verdandi-slip]')).toBeNull()
  })

  it('marks the header through the 0.1.7 slot and still resolves the older one', () => {
    // 0.1.7 puts the header inside `[data-slot='conversation.header']` and keeps
    // `conversation.session.header` for the display:contents anchor inside it, so
    // the old `…session.header] > header` child no longer exists and every
    // `[data-verdandi-header]` rule was dead.
    apply(ctx as never)

    const inner = document.querySelector('header')
    expect(inner?.hasAttribute('data-verdandi-header')).toBe(true)
    expect(inner?.querySelector("[data-verdandi-decoration='header-veil']")).not.toBeNull()

    // Older shells: the header is the child of the session-header anchor itself.
    // The legacy tree is parsed, not moved node by node: jsdom stops indexing a
    // subtree that was detached inside a `display: contents` parent.
    const conversation = document.querySelector('[data-pane="conversation"]')
    expect(conversation).not.toBeNull()
    conversation!.innerHTML = LEGACY_HEADER

    // A fresh context, like a second mount against the older shell's DOM.
    ctx = new MockContext()
    apply(ctx as never)
    const legacyHeader = conversation?.querySelector('header')
    expect(legacyHeader?.hasAttribute('data-verdandi-header')).toBe(true)
    expect(legacyHeader?.querySelector("[data-verdandi-decoration='header-veil']")).not.toBeNull()
    ctx.disposeAll()
  })

  it('adds semantic hooks without replacing host controls', () => {
    apply(ctx as never)

    expect(document.querySelector('button[data-verdandi-new-session]')?.textContent).toBe('新会话')
    expect(Array.from(document.querySelectorAll('button[data-verdandi-nav-entry]')).map((button) => button.textContent)).toEqual([
      '任务看板',
      'SSH',
      '技能中心',
    ])
    expect(document.querySelector('button[data-verdandi-sidebar-action]')?.getAttribute('aria-label')).toBe('搜索会话')
    expect(document.querySelector('[data-verdandi-header]')).not.toBeNull()

    ctx.disposeAll()
    expect(document.querySelector('[data-verdandi-new-session]')).toBeNull()
    expect(document.querySelector('[data-verdandi-header]')).toBeNull()
  })

  it('restores pre-existing asset properties on dispose', () => {
    document.body.style.setProperty('--vd-art-character-right', 'url(previous.png)')
    document.body.style.setProperty('--vd-art-sidebar-bridal', 'url(previous-sidebar.png)')
    apply(ctx as never)
    expect(document.body.style.getPropertyValue('--vd-art-character-right')).toContain('data:image/webp')
    expect(document.body.style.getPropertyValue('--vd-art-sidebar-bridal')).toContain('data:image/webp')

    ctx.disposeAll()
    expect(document.body.style.getPropertyValue('--vd-art-character-right')).toBe('url(previous.png)')
    expect(document.body.style.getPropertyValue('--vd-art-sidebar-bridal')).toBe('url(previous-sidebar.png)')
    expect(document.querySelector('[data-pane="conversation"]')?.hasAttribute('data-verdandi-phase')).toBe(false)
    expect(document.querySelector('[data-pane="conversation"]')?.hasAttribute('data-verdandi-view')).toBe(false)
  })
})

/**
 * Shells from dsh 0.2: `data-pane` is gone and the panes are `display: contents`
 * slot wrappers, so the skin must walk down to the first real box and tag that.
 * The wrapper nesting mirrors the 0.2.0-rc.2 runtime capture.
 */
const DSH02_SHELL = `
  <div id="root">
    <div data-slot="sidebar" style="display: contents"><div class="host_sidebar_root">
      <button aria-label="新建会话"></button>
      <button class="host_newSession">新会话 Ctrl+N</button>
      <button>插件</button>
      <button>自动化任务</button>
      <button aria-label="搜索会话"></button>
      <div data-slot="sidebar.settings"><button>设置</button></div>
    </div></div>
    <div data-slot="main"><div data-slot="main.conversation" style="display: contents"><div class="host_conversation_root">
      <div data-slot="conversation.header" style="display: contents"><header>
        <div data-slot="conversation.session.header" style="display: contents">
          <div class="host_titleRow">
            <button role="tab" aria-selected="true">对话</button>
            <button role="tab" aria-selected="false">轨迹</button>
          </div>
        </div>
      </header></div>
      <div data-phase="active"></div>
      <div data-chat-flow-kind="assistant-step"><div data-slot="conversation.chat.node">
        <div class="host_markdown_body"><p>Assistant response</p></div>
      </div></div>
      <div data-composer-seat><div data-composer-card></div></div>
    </div></div></div>
    <div data-slot="rightbar" style="display: contents"><div class="host_rightbar_session" style="display: contents"><div data-slot="rightbar.session" style="display: contents"><div class="host_rightbar_panel">空面板</div></div></div></div>
  </div>`

describe('verdandi skin on the dsh 0.2 shell', () => {
  let ctx: MockContext
  beforeEach(() => {
    document.body.innerHTML = DSH02_SHELL
    ctx = new MockContext()
  })
  afterEach(() => {
    ctx.disposeAll()
  })

  it('tags the real pane boxes through the display: contents wrappers', () => {
    apply(ctx as never)

    expect(document.querySelector('[data-verdandi-pane="sidebar"]')?.className).toBe('host_sidebar_root')
    expect(document.querySelector('[data-verdandi-pane="conversation"]')?.className).toBe('host_conversation_root')
    expect(document.querySelector('[data-verdandi-pane="details"]')?.className).toBe('host_rightbar_panel')
    // No wrapper ever carries the tag: CSS positioning needs a real box.
    for (const wrapper of document.querySelectorAll('[data-slot]')) {
      expect(wrapper.hasAttribute('data-verdandi-pane')).toBe(false)
    }

    ctx.disposeAll()
    expect(document.querySelector('[data-verdandi-pane]')).toBeNull()
  })

  it('mounts stage and decorations on the 0.2 boxes and marks the 0.2 nav', () => {
    apply(ctx as never)

    const conversation = document.querySelector('[data-verdandi-pane="conversation"]')
    const sidebar = document.querySelector('[data-verdandi-pane="sidebar"]')
    expect(conversation?.querySelector(':scope > [data-verdandi-stage]')).not.toBeNull()
    expect(conversation?.getAttribute('data-verdandi-phase')).toBe('active')
    expect(sidebar?.querySelector(":scope > [data-verdandi-decoration='sidebar-portrait']")).not.toBeNull()
    expect(sidebar?.querySelector(":scope > [data-verdandi-decoration='sidebar-sacred-tree']")).not.toBeNull()
    expect(sidebar?.querySelector(":scope > [data-verdandi-decoration='sidebar-veil-corners-top']")).not.toBeNull()
    expect(conversation?.querySelector(":scope > [data-verdandi-decoration='workspace-lace']")).not.toBeNull()
    expect(conversation?.querySelector("header > [data-verdandi-decoration='header-veil']")).not.toBeNull()
    expect(document.querySelector("[data-composer-card] > [data-verdandi-decoration='composer-seal']")).not.toBeNull()
    // 0.2 renamed the nav entries; both the class-suffix and text hooks resolve.
    expect(Array.from(document.querySelectorAll('button[data-verdandi-nav-entry]')).map((button) => button.textContent)).toEqual([
      '插件',
      '自动化任务',
    ])
    expect(document.querySelector('button[data-verdandi-new-session]')?.className).toContain('host_newSession')
    expect(document.querySelector('button[data-verdandi-sidebar-action]')?.getAttribute('aria-label')).toBe('搜索会话')
    expect(document.querySelector('[data-verdandi-header]')).not.toBeNull()
    // The 0.2 empty-details copy matches the widened empty-state probe.
    expect(document.querySelector("[data-verdandi-pane='details']")?.getAttribute('data-verdandi-details-empty')).toBe('')
  })
})
