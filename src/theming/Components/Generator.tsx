import {
  Button,
  Checkbox,
  Icon,
  Spacer,
  Stack,
  toStateClass
} from '@contember/ui'
import * as React from 'react'
import {
  CONTEMBER_THEMES,
  PREFIX,
  ThemeName,
  WHITE_SPACE
} from "../Config"
import { copyTextToClipboard, cssToSASS, indentText } from "../Helpers"
import { scaleGradient, scaleToColorWeightMap, scaleToCSSProperties } from "../Scale"
import { ColorInput } from './ColorInput'
import { Scale } from "./Scale"
import { useColorMode } from '@docusaurus/theme-common'

type ThemeChangeCallback = (name: ThemeName, colors: [string, string, string] | null) => void

function useColorInputProps(name: ThemeName, colors: [string, string, string], onChange: ThemeChangeCallback) {
  const initial = React.useRef(colors)

  const [lightHex, setLightHex] = React.useState(colors[0])
  const [middleHex, setMiddleHex] = React.useState(colors[1])
  const [hex, setHex] = React.useState(colors[2])

  // const scale = React.useMemo(() => scaleGradient(lightHex, middleHex, hex), [
  //   lightHex,
  //   middleHex,
  //   hex,
  // ])

  React.useEffect(() => {
    const [initialLightHex, initialMiddleHex, initialHex ] = initial.current
    const similarWithInitial =
      initialLightHex === lightHex
      && initialMiddleHex === middleHex
      && initialHex === hex

    onChange(
      name,
      similarWithInitial ? null : [lightHex, middleHex, hex],
    )
  }, [
    lightHex,
    middleHex,
    hex,
  ])

  const onReset = React.useCallback(() => {
    setLightHex(colors[0])
    setMiddleHex(colors[1])
    setHex(colors[2])
  }, [])

  return React.useMemo(() => ({
    hex,
    lightHex,
    middleHex,
    onReset,
    setHex,
    setLightHex,
    setMiddleHex,
  }), [
    hex,
    lightHex,
    middleHex,
  ])
}

const Theme = ({
  colors,
  dirty,
  editing,
  name,
  onChange,
  onEditFactory,
}: {
  colors: [string, string, string],
  dirty: boolean,
  editing?: boolean,
  name: ThemeName,
  onChange: ThemeChangeCallback,
  onEditFactory: (name: ThemeName) => () => void,
}) => {
  const { onReset, ...colorInputProps } = useColorInputProps(name, colors, onChange)
  const onEdit = React.useCallback(onEditFactory(name), [name])
  const onClose = React.useCallback(onEditFactory(null), [name])

  return <Scale
    actions={<>
      {editing && <Button
        distinction="seamless"
        flow="circular"
        size="small"
        onClick={onReset}
        intent="default"
        bland
      >
        <Icon blueprintIcon={"undo"} />
      </Button>}
      <Button
        distinction="seamless"
        flow="circular"
        size="small"
        onClick={editing ? onClose : onEdit}
        intent="default"
        bland
      >
        <Icon blueprintIcon={editing ? "cross" : "edit"} />
      </Button>
    </>}
    elevated
    verbose
    name={name}
    className={toStateClass('dirty', dirty)}
  >
    {editing && <ColorInput
      {...colorInputProps}
    />}
  </Scale>
}

type DirtyThemesMap = {[ Property in ThemeName]: boolean }

const ThemeEditor = React.memo(({
  dirty,
  themeEntries,
  onThemesChange,
}: {
  dirty: DirtyThemesMap,
  themeEntries: [ThemeName, [string, string, string]][],
  onThemesChange: ThemeChangeCallback,
}) => {
  const [editingTheme, setEditingTheme] = React.useState<ThemeName>(null)
  const onEditFactory = React.useCallback((name: ThemeName | null) => () => {
    setEditingTheme(name)
  }, [])

  return <div className="theming-generator-editor-scroll-wrapper">
    <Stack
      className="theming-generator-editor"
      direction="horizontal"
    >
      {themeEntries.map(([name, colors]) => <Theme
        dirty={dirty[name]}
        key={name}
        editing={editingTheme === name}
        name={name}
        colors={colors}
        onEditFactory={onEditFactory}
        onChange={onThemesChange}
      />)}
    </Stack>
  </div>
})
ThemeEditor.displayName = 'ThemeEditor'

export const Generator = React.memo(() => {
  const { colorMode } = useColorMode()
  const [verbose, setVerbose] = React.useState(false)

  const [themes, setThemes] = React.useState(CONTEMBER_THEMES)
  const themeEntries = React.useMemo(() => Object.entries(themes) as [ThemeName, [string, string, string]][], [themes])

  const dirtyThemes = React.useRef<DirtyThemesMap>({
    primary: false,
    secondary: false,
    tertiary: false,
    positive: false,
    success: false,
    warn: false,
    danger: false,
    default: false,
  })

  const onThemesChange = React.useCallback<ThemeChangeCallback>((name, colors) => {
    const nextThemes = { ...themes }

    if (Array.isArray(colors)) {
      nextThemes[name] = colors
    } else {
      nextThemes[name] = CONTEMBER_THEMES[name]
    }

    const themeIsDirty = nextThemes[name][0] !== CONTEMBER_THEMES[name][0]
      || nextThemes[name][1] !== CONTEMBER_THEMES[name][1]
      || nextThemes[name][2] !== CONTEMBER_THEMES[name][2]

    dirtyThemes.current[name] = themeIsDirty

    setThemes(nextThemes)
  }, [themes])

  const changedThemeEntries =React.useMemo(() => themeEntries.filter(([name]) => dirtyThemes.current[name]), [themeEntries])

  const cssResult =  changedThemeEntries.length === 0 ? '/* Edit theme colors to see changes */' : `:root {\n${changedThemeEntries
    .map(
      ([name, [lightHex, middleHex, hex ]]) =>
        `${WHITE_SPACE}/* ${name}: [${lightHex}, ${middleHex}, ${hex}] */\n${indentText(
          scaleToCSSProperties(
            `${PREFIX}-theme-${name}`,
            scaleToColorWeightMap(scaleGradient(lightHex, middleHex, hex))
          )
            .reverse()
            .join(";\n")
        )};\n`
    )
    .join("\n")}}\n`

  const copyCSSToClipboard = React.useCallback(async () => {
    await copyTextToClipboard(cssResult);
  }, [cssResult])

  const copySASSToClipboard = React.useCallback(async () => {
    await copyTextToClipboard(cssToSASS(cssResult));
  }, [cssResult]);

  return <Stack direction='vertical' className={`{'theming-generator'} scheme-${colorMode === 'dark' ? 'dark' : 'light'}`}>
    <ThemeEditor
      dirty={dirtyThemes.current}
      themeEntries={themeEntries}
      onThemesChange={onThemesChange}
    />
    <Stack align="center" direction="horizontal">
      <Button disabled={changedThemeEntries.length === 0} distinction="primary" onClick={copyCSSToClipboard}>Copy CSS</Button>
      <Button disabled={changedThemeEntries.length === 0} distinction="outlined" onClick={copySASSToClipboard}>Copy SASS</Button>
      {changedThemeEntries.length === 0 && <span className="theming-generator-hint">Edit the colors to copy CSS first</span>}
      <Spacer className="flex-grow" />
      <Checkbox value={verbose} onChange={setVerbose}>Verbose</Checkbox>
    </Stack>
    <style className={verbose ? 'is-visible-style' : null}>{cssResult}</style>
  </Stack>
})
Generator.displayName = 'Generator'
