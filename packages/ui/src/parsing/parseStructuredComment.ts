import { parse as parseYaml } from 'yaml'
import { ModuleSpec as FilterSpecModule, ThemeSpec as FilterSpecTheme } from './FilterTypesSpec'
import { Module, ModuleSpec, ThemeSpec } from './UiTypesSpec'

export const parseModule = (moduleId: string, comment: string): Module => {
    const declarationContent = comment.substring(
        comment.indexOf('\n'), // chop the structured declaration
        comment.indexOf('*/')
    )
    const module = parseYaml(declarationContent)
    return ModuleSpec.parse({
        ...FilterSpecModule.parse(module),
        id: moduleId,
        rs2f: '',
    })
}


export const parseTheme = (id: string, comment: string, ) => {
    const declarationContent = comment.substring(
        comment.indexOf('\n'), // chop the structured declaration
        comment.indexOf('*/')
    )
    const module = parseYaml(declarationContent)
    return ThemeSpec.parse({...FilterSpecTheme.parse(module), id})
}