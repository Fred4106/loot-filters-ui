import ExpandMore from '@mui/icons-material/ExpandMore'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Badge,
    Grid2,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material'
import React, { CSSProperties, useEffect, useState } from 'react'
import { groupBy, isObject } from 'underscore'
import { colors, MuiRsTheme } from '../../styles/MuiTheme'

import { ExpandLess } from '@mui/icons-material'
import SettingsIcon from '@mui/icons-material/Settings'
import { useSearchParams } from 'react-router-dom'
import { parseModules } from '../../parsing/parse'
import {
    BooleanInput,
    DEFAULT_FILTER_CONFIGURATION,
    EnumListInput,
    Filter,
    FilterConfiguration,
    FilterId,
    Input,
    Module,
    NumberInput,
    StringListInput,
    StyleConfigSpec,
    StyleInput,
    TextInput,
} from '../../parsing/UiTypesSpec'
import { useFilterConfigStore } from '../../store/filterConfigurationStore'
import { useFilterStore } from '../../store/filterStore'
import { countConfigChanges } from '../../utils/configUtils'
import { BackgroundSelector } from '../BackgroundSelector'
import { GitHubFlavoredMarkdown } from '../GitHubFlavoredMarkdown'
import { BooleanInputComponent } from '../inputs/BooleanInputComponent'
import { DisplayConfigurationInput } from '../inputs/DisplayConfigurationInput'
import { EnumInputComponent } from '../inputs/EnumInputComponent'
import { NumberInputComponent } from '../inputs/NumberInputComponent'
import { StringListInputComponent } from '../inputs/StringListInputComponent'
import { TextInputComponent } from '../inputs/TextInputComponent'
import { ItemLabelPreview } from '../Previews'

const MAX_GROUPCOUNT_AUTOEXPAND = 3

const InputComponent: React.FC<{
    config: FilterConfiguration
    module: Module
    input: Input
    readonly: boolean
    persist: (value: any, macroName: string) => void
}> = ({ config, module, input, readonly, persist }) => {
    switch (input.type) {
        case 'number':
            const numberInput = input as NumberInput
            return (
                <NumberInputComponent
                    config={config}
                    input={numberInput}
                    readonly={readonly}
                    onChange={(value) => {
                        persist(value, input.macroName)
                    }}
                />
            )
        case 'boolean':
            return (
                <BooleanInputComponent
                    input={input as BooleanInput}
                    config={config}
                    readonly={readonly}
                    onChange={(value) => {
                        persist(value, input.macroName)
                    }}
                />
            )
        case 'enumlist':
            const enumListInput = input as EnumListInput
            return (
                <EnumInputComponent
                    config={config}
                    input={enumListInput}
                    readonly={readonly}
                    onChange={(diff) => {
                        persist(diff, input.macroName)
                    }}
                />
            )
        case 'stringlist':
            return (
                <StringListInputComponent
                    config={config}
                    input={input as StringListInput}
                    readonly={readonly}
                    onChange={(diff) => {
                        if (!isObject(diff)) {
                            console.error(
                                'onChange something bad happened',
                                diff,
                                input.macroName
                            )
                        }
                        persist(diff, input.macroName)
                    }}
                />
            )
        case 'style':
            return (
                <DisplayConfigurationInput
                    config={config}
                    onChange={(style) => {
                        persist(style, input.macroName)
                    }}
                    readonly={readonly}
                    module={module}
                    input={input as StyleInput}
                />
            )
        case 'text':
            const textInput = input as TextInput
            return (
                <TextInputComponent
                    config={config}
                    input={textInput}
                    readonly={readonly}
                    onChange={(str) => {
                        persist(str, input.macroName)
                    }}
                />
            )
        default:
            return (
                <Typography variant="h6" color="secondary">
                    Unsupported input type:{' '}
                    <span style={{ color: colors.rsOrange }}>{input.type}</span>
                </Typography>
            )
    }
}

const InputGroup: React.FC<{
    key: number
    config: FilterConfiguration
    module: Module
    inputs: Input[]
    readonly: boolean
    onChange: (config: FilterConfiguration) => void
}> = ({ key, config, module, inputs, readonly, onChange }) => {
    const sorted = inputs.sort((a: Input, b: Input) => sizeOf(a) - sizeOf(b))
    return (
        <Grid2 key={key} container spacing={2}>
            {sorted.map((input, index) => (
                <Grid2 key={index} size={sizeOf(input)}>
                    <InputComponent
                        config={config}
                        module={module}
                        input={input}
                        readonly={readonly}
                        persist={(value, macroName) => {
                            const existing = config.inputConfigs?.[macroName]
                            const newConf = isObject(value)
                                ? { ...(existing ?? {}), ...value }
                                : value

                            onChange({
                                ...config,
                                inputConfigs: {
                                    ...config.inputConfigs,
                                    [macroName]: newConf,
                                },
                            })
                        }}
                    />
                </Grid2>
            ))}
        </Grid2>
    )
}

const sizeOf = (input: Input) => {
    switch (input.type) {
        case 'number':
            return 4
        case 'boolean':
            return 2
        case 'style':
            return 16
        default:
            return 4
    }
}

const getPreviews = ({ module }: { module: Module }) => {
    const styleInputs: StyleInput[] = module.inputs.filter(
        (input) => input.type === 'style'
    ) as StyleInput[]

    const activeFilterId = useFilterStore(
        (state) =>
            Object.keys(state.filters).find((id) => state.filters[id].active)!!
    )
    const configForModule = useFilterConfigStore(
        (state) => state.filterConfigurations?.[activeFilterId]?.inputConfigs
    )

    const visibleStyleInputs = styleInputs.filter((input) => {
        const config = StyleConfigSpec.optional()
            .default({})
            .parse(configForModule?.[input.macroName])
        return !(config?.hideOverlay ?? input.default?.hideOverlay ?? false)
    })

    return visibleStyleInputs.slice(0, 4).map((input) => {
        const macroName = (input as StyleInput).macroName
        return (
            <ItemLabelPreview
                key={macroName}
                itemName={input.label}
                input={input}
            />
        )
    })
}

const ModuleSection: React.FC<{
    activeFilterId: FilterId
    expanded: boolean
    setExpanded: (expanded: boolean) => void
    module: Module
    readonly: boolean
    config: FilterConfiguration
    onChange: (config: FilterConfiguration) => void
    clearConfiguration: (filterId: FilterId, macroNames: string[]) => void
    setEnabledModule: (
        filterId: FilterId,
        moduleId: string,
        enabled: boolean
    ) => void
    showSettings: boolean
}> = ({
    activeFilterId,
    expanded,
    setExpanded,
    module,
    readonly,
    config,
    onChange,
    clearConfiguration,
    setEnabledModule,
    showSettings,
}) => {
    const groupedInputs = groupBy(
        module.inputs.map((input) => ({
            ...input,
            group: input.group ?? '',
        })),
        'group'
    )

    const defaultGroup = groupedInputs[''] || []
    delete groupedInputs['']

    const groupCount = Object.keys(groupedInputs).length

    const moduleEnabledDefaultValue = module.enabled

    const configuredEnableValue = config.enabledModules?.[module.id]

    const enabled = configuredEnableValue ?? moduleEnabledDefaultValue

    const showPreviews = useMediaQuery(MuiRsTheme.breakpoints.up('sm'))
    const previews = getPreviews({ module })

    const moduleMacronames = module.inputs.map((input) => input.macroName)

    const configCount = countConfigChanges(config, moduleMacronames)

    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
    return (
        <>
            <Menu
                anchorEl={menuAnchor}
                open={!!menuAnchor}
                onClose={() => setMenuAnchor(null)}
            >
                <MenuItem
                    onClick={() => {
                        clearConfiguration(
                            activeFilterId,
                            module.inputs
                                .map(
                                    (input) =>
                                        input.macroName as
                                            | string
                                            | {
                                                  includes: string
                                                  excludes: string
                                              }
                                )
                                .reduce<string[]>((acc, macroName) => {
                                    if (typeof macroName === 'string') {
                                        return [...acc, macroName]
                                    } else {
                                        return [
                                            ...acc,
                                            macroName.includes,
                                            macroName.excludes,
                                        ]
                                    }
                                }, [])
                        )
                    }}
                >
                    Reset Module
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setEnabledModule(activeFilterId, module.id, !enabled)
                    }}
                >
                    {enabled ? 'Disable Module' : 'Enable'}
                </MenuItem>
            </Menu>
            <Accordion
                slotProps={{ transition: { unmountOnExit: true } }}
                expanded={expanded && enabled}
                onChange={() => setExpanded(!expanded)}
                sx={{
                    '&::before': {
                        backgroundColor: colors.rsDarkBrown,
                    },
                    filter: !enabled ? 'grayscale(0.75)' : 'none',
                }}
            >
                <AccordionSummary
                    component="div"
                    expandIcon={<ExpandMore />}
                    sx={{
                        '& .MuiAccordionSummary-content': {
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                        },
                        flexDirection: 'row-reverse',
                        gap: '16px',
                    }}
                >
                    <Stack>
                        <Typography variant="h4" color="primary">
                            {module.name}
                        </Typography>
                        {module?.subtitle && (
                            <Typography
                                variant="h6"
                                component="span"
                                color="secondary"
                            >
                                {module?.subtitle}
                            </Typography>
                        )}
                    </Stack>
                    {showPreviews && (
                        <Stack
                            direction="row"
                            sx={{
                                flex: '1',
                                flexWrap: 'wrap',
                                justifyContent: 'flex-end',
                                gap: '8px',
                                alignItems: 'center',
                            }}
                        >
                            {previews}
                        </Stack>
                    )}

                    {showSettings ? (
                        <Tooltip
                            title={
                                configCount
                                    ? `${configCount} settings changed`
                                    : ''
                            }
                        >
                            <IconButton
                                onClick={(
                                    e: React.MouseEvent<HTMLButtonElement>
                                ) => {
                                    e.stopPropagation()
                                    setMenuAnchor(e.currentTarget)
                                }}
                            >
                                <Badge
                                    badgeContent={configCount}
                                    color="secondary"
                                >
                                    <SettingsIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    ) : null}
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={2} direction="column">
                        <Stack
                            sx={{ display: 'block' }}
                            direction="row"
                            justifyContent="flex-end"
                        >
                            <GitHubFlavoredMarkdown
                                gfmd={module.description ?? ''}
                            />
                        </Stack>
                        <InputGroup
                            key={-1}
                            config={config}
                            module={module}
                            inputs={defaultGroup}
                            readonly={readonly}
                            onChange={onChange}
                        />
                        {Object.entries(groupedInputs).map(
                            ([group, inputs], index) => {
                                const groupName = group || 'Default Group'
                                const groupDescription = module.groups.find(
                                    (g) => g.name === groupName
                                )?.description

                                return (
                                    <Accordion
                                        disableGutters={true}
                                        defaultExpanded={
                                            groupCount <=
                                            MAX_GROUPCOUNT_AUTOEXPAND
                                        }
                                        sx={{
                                            '::before': { display: 'none' },
                                        }}
                                    >
                                        <AccordionSummary
                                            component="div"
                                            expandIcon={<ExpandMore />}
                                            sx={{
                                                flexDirection: 'row-reverse',
                                                backgroundColor:
                                                    colors.rsLighterBrown,
                                            }}
                                        >
                                            <Typography>{group}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails
                                            sx={{
                                                border: 2,
                                                borderColor:
                                                    colors.rsLighterBrown,
                                            }}
                                        >
                                            <GitHubFlavoredMarkdown
                                                gfmd={groupDescription ?? ''}
                                            />
                                            <InputGroup
                                                key={index}
                                                config={config}
                                                module={module}
                                                inputs={inputs}
                                                readonly={readonly}
                                                onChange={onChange}
                                            />
                                        </AccordionDetails>
                                    </Accordion>
                                )
                            }
                        )}
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </>
    )
}

export const CustomizeTab: React.FC<{
    filter: Filter | null
    config: FilterConfiguration | null
    onChange: (config: FilterConfiguration) => void
    clearConfiguration: (filterId: FilterId, macroNames: string[]) => void
    setEnabledModule: (
        filterId: FilterId,
        moduleId: string,
        enabled: boolean
    ) => void
    extraComponent?: React.ReactNode
    readonly: boolean
    sx?: CSSProperties
    showSettings?: boolean
}> = ({
    filter,
    config,
    onChange,
    clearConfiguration,
    setEnabledModule,
    extraComponent,
    readonly,
    sx,
    showSettings = true,
}) => {
    const [searchParams] = useSearchParams()
    const expandByDefault = searchParams.get('expanded') === 'true'

    const [expandedModules, setExpandedModules] = useState<
        Record<string, boolean>
    >(
        expandByDefault
            ? Object.fromEntries(
                  filter?.modules.map((module) => [module.name, true]) ?? []
              )
            : {}
    )

    const setAllExpanded = (expanded: boolean) => {
        const newExpandedModules: Record<string, boolean> = {}
        filter?.modules.forEach((module) => {
            newExpandedModules[module.name] = expanded
        })
        setExpandedModules(newExpandedModules)
    }

    useEffect(() => {
        const handleExpandAll = (event: CustomEvent) => {
            setAllExpanded(event.detail)
        }

        window.addEventListener('expandAll', handleExpandAll as EventListener)
        return () => {
            window.removeEventListener(
                'expandAll',
                handleExpandAll as EventListener
            )
        }
    }, [filter])

    if (!filter) {
        return (
            <Typography variant="h4" color="primary">
                No filter selected
            </Typography>
        )
    }

    const modules = [
        ...(parseModules(config?.prefixRs2f || '')?.modules || []),
        ...filter.modules,
        ...(parseModules(config?.suffixRs2f || '')?.modules || []),
    ]

    return (
        <div style={{ ...sx }}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    marginBottom: '1rem',
                }}
            >
                {extraComponent}
                <div
                    style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '1rem',
                        alignItems: 'center',
                    }}
                >
                    <BackgroundSelector />
                    <ToggleButtonGroup
                        size="small"
                        exclusive={false}
                        sx={{ height: 'fit-content' }}
                    >
                        <ToggleButton
                            value="expand"
                            onClick={() => {
                                const event = new CustomEvent('expandAll', {
                                    detail: true,
                                })
                                window.dispatchEvent(event)
                            }}
                        >
                            <ExpandMore />
                        </ToggleButton>
                        <ToggleButton
                            value="collapse"
                            onClick={() => {
                                const event = new CustomEvent('expandAll', {
                                    detail: false,
                                })
                                window.dispatchEvent(event)
                            }}
                        >
                            <ExpandLess />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>
            </div>
            <Stack>
                {modules
                    .filter((m) => !m.hidden)
                    .map((module, index: number) => (
                        <ModuleSection
                            key={index}
                            readonly={readonly}
                            activeFilterId={filter.id}
                            module={module}
                            showSettings={showSettings}
                            config={config ?? DEFAULT_FILTER_CONFIGURATION}
                            onChange={onChange}
                            clearConfiguration={clearConfiguration}
                            setEnabledModule={setEnabledModule}
                            expanded={expandedModules[module.name] ?? false}
                            setExpanded={(expanded) =>
                                setExpandedModules((prev) => ({
                                    ...prev,
                                    [module.name]: expanded,
                                }))
                            }
                        />
                    ))}
            </Stack>
        </div>
    )
}
