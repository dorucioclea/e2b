'use client'

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import { create } from 'zustand'
import {
  Play,
  Loader,
} from 'lucide-react'

import { Tag } from '@/components/Tag'
import { CopyButton } from '@/components/CopyButton'
import { useUser, useApiKey } from '@/utils/useUser'
import { ProcessMessage } from '@e2b/sdk'

const languageNames: Record<string, string> = {
  js: 'JavaScript',
  ts: 'TypeScript',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  php: 'PHP',
  python: 'Python',
  ruby: 'Ruby',
  go: 'Go',
}

function getPanelTitle({
  title,
  language,
}: {
  title?: string
  language?: string
}) {
  if (title) {
    return title
  }
  if (language && language in languageNames) {
    return languageNames[language]
  }
  return 'Code'
}

function CodePanelHeader({ tag, label }) {
  if (!tag && !label) {
    return null
  }

  return (
    <div className="flex h-9 items-center gap-2 border-y border-b-white/7.5 border-t-transparent bg-white/2.5 bg-zinc-900 px-4 dark:border-b-white/5 dark:bg-white/1">
      {tag && (
        <div className="dark flex">
          <Tag variant="small">{tag}</Tag>
        </div>
      )}
      {tag && label && (
        <span className="h-0.5 w-0.5 rounded-full bg-zinc-500" />
      )}
      {label && (
        <span className="font-mono text-xs text-zinc-400">{label}</span>
      )}
    </div>
  )
}

function CodePanel({
  children,
  tag,
  label,
  code,
}: {
  children: React.ReactNode
  tag?: string
  label?: string
  code?: string
}) {
  let child = Children.only(children)

  if (isValidElement(child)) {
    tag = child.props.tag ?? tag
    label = child.props.label ?? label
    code = child.props.code ?? code
  }

  if (!code) {
    throw new Error(
      '`CodePanel` requires a `code` prop, or a child with a `code` prop.'
    )
  }

  return (
    <div className="group dark:bg-white/2.5">
      <CodePanelHeader tag={tag} label={label} />
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-xs text-white">{children}</pre>
        <CopyButton code={code} />
      </div>
    </div>
  )
}

function CodeGroupHeader({
  title,
  children,
  selectedIndex,
  onRunClick,
  isRunning,
  isRunnable = true,
}: {
  title: string
  children: React.ReactNode
  selectedIndex: number
  onRunClick?: (e: any) => void
  isRunnable: boolean
  isRunning?: boolean
}) {
  let hasTabs = Children.count(children) > 1

  if (!title && !hasTabs) {
    return null
  }

  return (
    <div className="flex min-h-[calc(theme(spacing.12)+1px)] flex-wrap items-center justify-between gap-x-4 border-b border-zinc-700 bg-zinc-800 px-4 dark:border-zinc-800 dark:bg-transparent">
      <div className="flex items-start space-x-4">
      {title && (
        <h3 className="mr-auto pt-3 text-xs font-semibold text-white">
          {title}
        </h3>
      )}
      {hasTabs && (
        <Tab.List className="-mb-px flex gap-4 text-xs font-medium">
          {Children.map(children, (child, childIndex) => (
            <Tab
              /* Set ID due to bug in Next https://github.com/vercel/next.js/issues/53110 */
              /* Should ne fixed after updating Next to > 13.4.12 */
              id={`code-tab-${childIndex}`}
              className={clsx(
                'border-b py-3 transition ui-not-focus-visible:outline-none',
                childIndex === selectedIndex
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300'
              )}
            >
              {getPanelTitle(isValidElement(child) ? child.props : {})}
            </Tab>
          ))}
        </Tab.List>
      )}
      </div>
      {isRunnable && (
        <>
          {isRunning ? (
            <Loader
              className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300 transition-all animate-spin"
              strokeWidth={2.5}
            />)
          :(
            <button
              className="group p-1 flex items-center space-x-2 bg-transparent rounded-md cursor-pointer transition-all"
              onClick={onRunClick}
            >
              <span
                className="text-xs font-medium relative top-[-0.5px] group-hover:text-zinc-300 text-zinc-400 transition-all"
              >
                Run Code
              </span>
              <Play
                className="h-4 w-4 text-emerald-400 group-hover:text-emerald-300 transition-all"
                strokeWidth={2.5}
              />
            </button>
          )}
        </>
      )}
    </div>
  )
}

function CodeGroupPanels({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CodePanel>) {
  let hasTabs = Children.count(children) > 1

  if (hasTabs) {
    return (
      <Tab.Panels>
        {/* Set ID due to bug in Next https://github.com/vercel/next.js/issues/53110 */}
        {/* Should ne fixed after updating Next to > 13.4.12 */}
        {Children.map(children, (child, childIndex) => (
          <Tab.Panel id={`code-tab-${childIndex}`}>
            <CodePanel {...props}>{child}</CodePanel>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    )
  }

  return <CodePanel {...props}>{children}</CodePanel>
}

function usePreventLayoutShift() {
  let positionRef = useRef<HTMLElement>(null)
  let rafRef = useRef<number>()

  useEffect(() => {
    return () => {
      if (typeof rafRef.current !== 'undefined') {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return {
    positionRef,
    preventLayoutShift(callback: () => void) {
      if (!positionRef.current) {
        return
      }

      let initialTop = positionRef.current.getBoundingClientRect().top

      callback()

      rafRef.current = window.requestAnimationFrame(() => {
        let newTop =
          positionRef.current?.getBoundingClientRect().top ?? initialTop
        window.scrollBy(0, newTop - initialTop)
      })
    },
  }
}

const usePreferredLanguageStore = create<{
  preferredLanguages: Array<string>
  addPreferredLanguage: (language: string) => void
}>()((set) => ({
  preferredLanguages: [],
  addPreferredLanguage: (language) =>
    set((state) => ({
      preferredLanguages: [
        ...state.preferredLanguages.filter(
          (preferredLanguage) => preferredLanguage !== language
        ),
        language,
      ],
    })),
}))

function useTabGroupProps(availableLanguages: Array<string>) {
  let { preferredLanguages, addPreferredLanguage } = usePreferredLanguageStore()
  let [selectedIndex, setSelectedIndex] = useState(0)
  let activeLanguage = [...availableLanguages].sort(
    (a, z) => preferredLanguages.indexOf(z) - preferredLanguages.indexOf(a)
  )[0]
  let languageIndex = availableLanguages.indexOf(activeLanguage)
  let newSelectedIndex = languageIndex === -1 ? selectedIndex : languageIndex
  if (newSelectedIndex !== selectedIndex) {
    setSelectedIndex(newSelectedIndex)
  }

  let { positionRef, preventLayoutShift } = usePreventLayoutShift()

  return {
    as: 'div' as const,
    ref: positionRef,
    selectedIndex,
    onChange: (newSelectedIndex: number) => {
      preventLayoutShift(() =>
        addPreferredLanguage(availableLanguages[newSelectedIndex])
      )
    },
  }
}

const CodeGroupContext = createContext(false)

export function CodeGroup({
  children,
  title,
  isRunnable = true,
  ...props
}: React.ComponentPropsWithoutRef<typeof CodeGroupPanels> & { title: string, isRunnable: boolean }) {
  const { jsPlayground, pythonPlayground } = useUser()
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const apiKey = useApiKey()
  let languages =
    Children.map(children, (child) =>
      getPanelTitle(isValidElement(child) ? child.props : {})
    ) ?? []
  let tabGroupProps = useTabGroupProps(languages)
  let hasTabs = Children.count(children) > 1

  let containerClassName =
    'not-prose my-6 overflow-hidden rounded-2xl bg-zinc-900 shadow-md dark:ring-1 dark:ring-white/10'

  function appendOutput(out: ProcessMessage) {
    console.log(out)
    setOutput(current => current += `\n${out.line}`)
  }

  async function handleRunClick() {
    // TODO: Prompt user to sign up
    // if (!playground) {
    //   console.log('No user!')
    //   return
    // }

    setOutput('')
    setIsRunning(true)

    const language = languages[tabGroupProps.selectedIndex]
    const code = children[tabGroupProps.selectedIndex].props.code

    let runtime = `E2B_API_KEY=${apiKey}`

    if (language === 'JavaScript') {
      runtime += ' node'
      const filename = '/code/index.js'
      console.log('Running code', language, code, filename, runtime)
      await jsPlayground.filesystem.write(filename, code)
      jsPlayground.process.start({ cmd: `${runtime} ${filename}`, onStdout: appendOutput, onStderr: appendOutput, onExit: () => setIsRunning(false) })
    } else if (language === 'Python') {
      runtime += ' python3'
      const filename = '/main.py'
      await pythonPlayground.filesystem.write(filename, code)
      pythonPlayground.process.start({ cmd: `${runtime} ${filename}`, onStdout: appendOutput, onStderr: appendOutput, onExit: () => setIsRunning(false) })
    } else {
      throw new Error('Unsupported runtime for playground')
    }
  }
  let header = (
    <CodeGroupHeader
      isRunnable={isRunnable}
      isRunning={isRunning}
      title={title}
      selectedIndex={tabGroupProps.selectedIndex}
      onRunClick={handleRunClick}
    >
      {children}
    </CodeGroupHeader>
  )
  let panels = <CodeGroupPanels {...props}>{children}</CodeGroupPanels>

  return (
    <CodeGroupContext.Provider value={true}>
      {hasTabs ? (
        <Tab.Group {...tabGroupProps} className={containerClassName}>
          {header}
          {panels}
          <div className="max-h-[200px] bg-zinc-800 font-mono py-1 px-4 flex flex-col items-start justify-start">
            <span className="text-zinc-500 text-xs font-mono">Output</span>
            <pre className="w-full h-full overflow-auto text-xs text-white whitespace-pre">{output}</pre>
          </div>
        </Tab.Group>
      ) : (
        <div className={containerClassName}>
          {header}
          {panels}
        </div>
      )}
    </CodeGroupContext.Provider>
  )
}

export function Code({
  children,
  ...props
}: React.ComponentPropsWithoutRef<'code'>) {
  /* <DYNAMIC-API-REPLACEMENT> */
  // let apiKey = useApiKey()
  // if (children.replace && apiKey) children = children.replace(`{{API_KEY}}`, `${apiKey}`)
  /* </DYNAMIC-API-REPLACEMENT> */

  let isGrouped = useContext(CodeGroupContext)

  if (isGrouped) {
    if (typeof children !== 'string') {
      throw new Error(
        '`Code` children must be a string when nested inside a `CodeGroup`.'
      )
    }
    return <code {...props} dangerouslySetInnerHTML={{ __html: children }} />
  }

  return <code {...props}>{children}</code>
}

export function Pre({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CodeGroup>) {
  let isGrouped = useContext(CodeGroupContext)

  if (isGrouped) {
    return children
  }

  return <CodeGroup {...props}>{children}</CodeGroup>
}
