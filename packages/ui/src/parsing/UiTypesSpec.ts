import { z } from 'zod'
import { backgroundImages } from '../types/Images'
import {
    GroupSpec as FilterSpecGroup,
    InputSpec as FilterSpecInput,
    ModuleSpec as FilterSpecModule,
} from './FilterTypesSpec'

export const InputSpec = FilterSpecInput.extend({
    macroName: z.string().nonempty(),
    default: z.any().optional(),
}).catchall(z.any())

export type Input = z.infer<typeof InputSpec>

export const GroupSpec = FilterSpecGroup.extend({
    id: z.string().nonempty(),
    rs2f: z.string(),
})

export type Group = z.infer<typeof GroupSpec>

export const ModuleSpec = FilterSpecModule.extend({
    id: z.string().nonempty(),
    inputs: z.array(InputSpec).default([]),
    groups: z.array(GroupSpec).default([]),
    rs2f: z.string(),
})

export type Module = z.infer<typeof ModuleSpec>

export const BooleanInputDefaultSpec = z.boolean().optional().default(false)

// Concrete implementations for each input type
export const BooleanInputSpec = InputSpec.extend({
    type: z.literal('boolean'),
    default: BooleanInputDefaultSpec,
})

export const NumberInputDefaultSpec = z.number().optional()

export const NumberInputSpec = InputSpec.extend({
    type: z.literal('number'),
    default: NumberInputDefaultSpec,
})

export const StringListInputDefaultSpec = z
    .array(z.string())
    .optional()
    .default([])

export const StringListInputSpec = InputSpec.extend({
    type: z.literal('stringlist'),
    default: StringListInputDefaultSpec,
})

export const ListOptionSpec = z.object({
    label: z.string(),
    value: z.string(),
})

export type ListOption = z.infer<typeof ListOptionSpec>

export const EnumListInputDefaultSpec = z
    .array(z.string())
    .optional()
    .default([])

export const EnumListInputSpec = InputSpec.extend({
    type: z.literal('enumlist'),
    default: EnumListInputDefaultSpec,
    enum: z.array(ListOptionSpec.or(z.string())).min(1),
})

export const ArgbHexColorSpec = z
    .string()
    .startsWith('#')
    .min(7)
    .max(9)
    .optional()
    .catch('#FF000000')

export const IconSpec = z
    .object({
        type: z.enum(['none', 'current', 'file', 'sprite', 'itemId']),
    })
    .catchall(z.any())

export type Icon = z.infer<typeof IconSpec>

export const IconNoneSpec = IconSpec.extend({
    type: z.literal('none'),
})
export type IconNone = z.infer<typeof IconNoneSpec>

export const IconCurrentSpec = IconSpec.extend({
    type: z.literal('current'),
})
export type IconCurrent = z.infer<typeof IconCurrentSpec>

export const IconFileSpec = IconSpec.extend({
    type: z.literal('file'),
    filePath: z.string().optional(),
})
export type IconFile = z.infer<typeof IconFileSpec>

export const IconSpriteSpec = IconSpec.extend({
    type: z.literal('sprite'),
    spriteId: z.number().optional(),
    spriteIndex: z.number().optional(),
})
export type IconSprite = z.infer<typeof IconSpriteSpec>

export const IconItemIdSpec = IconSpec.extend({
    type: z.literal('itemId'),
    itemId: z.number().optional(),
})
export type IconItemId = z.infer<typeof IconItemIdSpec>

export const StyleConfigSpec = z.object({
    textColor: ArgbHexColorSpec.optional(),
    backgroundColor: ArgbHexColorSpec.optional(),
    borderColor: ArgbHexColorSpec.optional(),
    textAccent: z.number().min(1).max(4).optional(),
    textAccentColor: ArgbHexColorSpec.optional(),
    fontType: z.number().min(1).max(3).optional(),
    showLootbeam: z.boolean().optional(),
    lootbeamColor: ArgbHexColorSpec.optional(),
    showValue: z.boolean().optional(),
    showDespawn: z.boolean().optional(),
    notify: z.boolean().optional(),
    hideOverlay: z.boolean().optional(),
    highlightTile: z.boolean().optional(),
    menuTextColor: ArgbHexColorSpec.optional(),
    tileStrokeColor: ArgbHexColorSpec.optional(),
    tileFillColor: ArgbHexColorSpec.optional(),
    tileHighlightColor: ArgbHexColorSpec.optional(),
    sound: z.string().or(z.number()).optional(),
    menuSort: z.number().optional(),
    icon: IconSpec.optional(),
})

export type StyleConfig = z.infer<typeof StyleConfigSpec>

export const StyleInputSpec = InputSpec.extend({
    type: z.literal('style'),
    default: StyleConfigSpec.optional(),
    backgroundImage: z
        .enum(backgroundImages as [string, ...string[]])
        .optional(),
    exampleItem: z.string().optional(),
    exampleItemId: z.number().optional(),
})

export const TextInputDefaultSpec = z.string().optional().default('')
export const TextInputSpec = InputSpec.extend({
    type: z.literal('text'),
    default: TextInputDefaultSpec,
})

export type BooleanInput = z.infer<typeof BooleanInputSpec>
export type NumberInput = z.infer<typeof NumberInputSpec>
export type StringListInput = z.infer<typeof StringListInputSpec>
export type EnumListInput = z.infer<typeof EnumListInputSpec>
export type StyleInput = z.infer<typeof StyleInputSpec>
export type TextInput = z.infer<typeof TextInputSpec>

export type FilterId = string
export const FilterSpec = z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
    description: z.string().optional(),
    rs2fHash: z.string(),
    active: z.boolean().default(false),
    importedOn: z.string().datetime().default(new Date().toISOString()),
    updatedOn: z.string().datetime().optional(),
    source: z.string().url().optional(),
    modules: z.array(ModuleSpec),
    rs2f: z.string(),
})

export type Filter = z.infer<typeof FilterSpec>

export const ListDiffSpec = z.object({
    added: z.array(z.string()),
    removed: z.array(z.string()),
})

export type ListDiff = z.infer<typeof ListDiffSpec>
export const DEFAULT_FILTER_CONFIGURATION = {
    enabledModules: {},
    inputConfigs: {},
}
export const FilterConfigurationSpec = z.object({
    enabledModules: z.record(z.string(), z.boolean()).optional().default({}),
    inputConfigs: z.record(z.string(), z.any()).optional().default({}),
    prefixRs2f: z.string().optional(),
    suffixRs2f: z.string().optional(),
})

export type FilterConfiguration = z.infer<typeof FilterConfigurationSpec>

export type MacroName = string
