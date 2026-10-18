// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
import { getInitialMainLoopModel } from '../../bootstrap/state.js'
import {
  isCodexSubscriber,
  isInternalSubscriber,
  isClaudeAISubscriber,
} from '../auth.js'
import { getModelStrings } from './modelStrings.js'
import {
  COST_TIER_3_15,
  COST_TIER_5_25,
  COST_TIER_10_50,
  COST_TIER_15_75,
  COST_HAIKU_35,
  COST_HAIKU_45,
  COST_HAIKU_55,
  COST_OPUS_55,
  COST_SONNET_5,
  COST_SONNET_55,
  COST_FABLE_51,
  formatModelPricing,
} from '../modelCost.js'
import type { ModelKey } from './configs.js'
import { getSettings_DEPRECATED } from '../settings/settings.js'
import { checkOpus1mAccess, checkSonnet1mAccess } from './check1mAccess.js'
import { getAPIProvider } from './providers.js'
import { isModelAllowed } from './modelAllowlist.js'
import {
  getCanonicalName,
  getClaudeAiUserDefaultModelDescription,
  getDefaultSonnetModel,
  getDefaultOpusModel,
  getDefaultHaikuModel,
  getDefaultFableModel,
  getDefaultMythosModel,
  getDefaultMainLoopModelSetting,
  getMarketingNameForModel,
  getUserSpecifiedModelSetting,
  isOpus1mMergeEnabled,
  getOpus46PricingSuffix,
  renderDefaultModelSetting,
  type ModelSetting,
} from './model.js'
import { has1mContext } from '../context.js'
import { getGlobalConfig } from '../config.js'
import { getAntModels } from './antModels.js'

// @[MODEL LAUNCH]: Update all the available and default model option strings below.

export type ModelOption = {
  value: ModelSetting
  label: string
  description: string
  descriptionForModel?: string
}

export function getDefaultOptionForUser(fastMode = false): ModelOption {
  if (process.env.USER_TYPE === 'ant') {
    const currentModel = renderDefaultModelSetting(
      getDefaultMainLoopModelSetting(),
    )
    return {
      value: null,
      label: 'Default (recommended)',
      description: `Use the default model for Ants (currently ${currentModel})`,
      descriptionForModel: `Default model (currently ${currentModel})`,
    }
  }

  // Subscribers
  if (isClaudeAISubscriber()) {
    return {
      value: null,
      label: 'Default (recommended)',
      description: getClaudeAiUserDefaultModelDescription(fastMode),
    }
  }

  // PAYG
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: null,
    label: 'Default (recommended)',
    description: `Use the default model (currently ${renderDefaultModelSetting(getDefaultMainLoopModelSetting())})${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
  }
}

function getCustomSonnetOption(): ModelOption | undefined {
  const is3P = getAPIProvider() !== 'firstParty'
  const customSonnetModel = process.env.ANTHROPIC_DEFAULT_SONNET_MODEL
  // When a 3P user has a custom sonnet model string, show it directly
  if (is3P && customSonnetModel) {
    const is1m = has1mContext(customSonnetModel)
    return {
      value: 'sonnet',
      label:
        process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME ?? customSonnetModel,
      description:
        process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION ??
        `Custom Sonnet model${is1m ? ' (1M context)' : ''}`,
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION ?? `Custom Sonnet model${is1m ? ' with 1M context' : ''}`} (${customSonnetModel})`,
    }
  }
}

// @[MODEL LAUNCH]: Update or add model option functions (getSonnetXXOption, getOpusXXOption, etc.)
// with the new model's label and description. These appear in the /model picker.
function getSonnet46Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: is3P ? getModelStrings().sonnet46 : 'sonnet',
    label: 'Sonnet',
    description: `Sonnet 4.6 · Best for everyday tasks${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
    descriptionForModel:
      'Sonnet 4.6 - best for everyday tasks. Generally recommended for most coding tasks',
  }
}

function getCustomOpusOption(): ModelOption | undefined {
  const is3P = getAPIProvider() !== 'firstParty'
  const customOpusModel = process.env.ANTHROPIC_DEFAULT_OPUS_MODEL
  // When a 3P user has a custom opus model string, show it directly
  if (is3P && customOpusModel) {
    const is1m = has1mContext(customOpusModel)
    return {
      value: 'opus',
      label: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME ?? customOpusModel,
      description:
        process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION ??
        `Custom Opus model${is1m ? ' (1M context)' : ''}`,
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION ?? `Custom Opus model${is1m ? ' with 1M context' : ''}`} (${customOpusModel})`,
    }
  }
}

// 'opus' resolves to the current default Opus (5.5), so the label must match.
function getOpus55Option(): ModelOption {
  return {
    value: 'opus',
    label: 'Opus',
    description: `Opus 5.5 · Most capable for complex work`,
    descriptionForModel: 'Opus 5.5 - most capable for complex work',
  }
}

function getOpus46Option(fastMode = false): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: is3P ? getModelStrings().opus46 : 'opus',
    label: 'Opus',
    description: `Opus 4.6 · Most capable for complex work${getOpus46PricingSuffix(fastMode)}`,
    descriptionForModel: 'Opus 4.6 - most capable for complex work',
  }
}

export function getSonnet46_1MOption(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: is3P ? getModelStrings().sonnet46 + '[1m]' : 'sonnet[1m]',
    label: 'Sonnet (1M context)',
    description: `Sonnet 4.6 for long sessions${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
    descriptionForModel:
      'Sonnet 4.6 with 1M context window - for long sessions with large codebases',
  }
}

export function getOpus46_1MOption(fastMode = false): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: is3P ? getModelStrings().opus46 + '[1m]' : 'opus[1m]',
    label: 'Opus (1M context)',
    description: `Opus 4.6 for long sessions${getOpus46PricingSuffix(fastMode)}`,
    descriptionForModel:
      'Opus 4.6 with 1M context window - for long sessions with large codebases',
  }
}

function getCustomHaikuOption(): ModelOption | undefined {
  const is3P = getAPIProvider() !== 'firstParty'
  const customHaikuModel = process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL
  // When a 3P user has a custom haiku model string, show it directly
  if (is3P && customHaikuModel) {
    return {
      value: 'haiku',
      label: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME ?? customHaikuModel,
      description:
        process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION ??
        'Custom Haiku model',
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION ?? 'Custom Haiku model'} (${customHaikuModel})`,
    }
  }
}

function getHaiku45Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: 'haiku',
    label: 'Haiku',
    description: `Haiku 4.5 · Fastest for quick answers${is3P ? '' : ` · ${formatModelPricing(COST_HAIKU_45)}`}`,
    descriptionForModel:
      'Haiku 4.5 - fastest for quick answers. Lower cost but less capable than Sonnet 4.6.',
  }
}

function getHaiku35Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: 'haiku',
    label: 'Haiku',
    description: `Haiku 3.5 for simple tasks${is3P ? '' : ` · ${formatModelPricing(COST_HAIKU_35)}`}`,
    descriptionForModel:
      'Haiku 3.5 - faster and lower cost, but less capable than Sonnet. Use for simple tasks.',
  }
}

function getHaiku55Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: 'haiku',
    label: 'Haiku',
    description: `Haiku 5.5 · Fastest for quick answers${is3P ? '' : ` · ${formatModelPricing(COST_HAIKU_55)} (up to 100K tokens)`}`,
    descriptionForModel:
      'Haiku 5.5 - fastest for quick answers. Lower cost but less capable than Sonnet 5.5.',
  }
}

function getHaikuOption(): ModelOption {
  // Return the Haiku option matching the default Haiku model for this provider
  const haikuModel = getDefaultHaikuModel()
  if (haikuModel === getModelStrings().haiku55) {
    return getHaiku55Option()
  }
  return haikuModel === getModelStrings().haiku45
    ? getHaiku45Option()
    : getHaiku35Option()
}

// Fable 5 and Mythos 5 are Claude 5 class models (above Opus tier).
// Added for external builds where env overrides allow custom IDs.
function getFable5Option(fastMode = false): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  const model = getDefaultFableModel()
  const pricing = formatModelPricing(COST_TIER_10_50)
  return {
    value: 'fable',
    label: 'Fable 5',
    description: `Fable 5 · Claude 5 class${is3P ? '' : ` · ${pricing}`}`,
    descriptionForModel: 'Fable 5 - Claude 5 class model with 1M context',
  }
}

function getMythos5Option(fastMode = false): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  const pricing = formatModelPricing(COST_TIER_10_50)
  return {
    value: 'mythos',
    label: 'Mythos 5',
    description: `Mythos 5 · Claude 5 class (no safety classifiers)${is3P ? '' : ` · ${pricing}`}`,
    descriptionForModel: 'Mythos 5 - Claude 5 class model without safety classifiers',
  }
}

// OpenAI Codex model options
function getGpt54Option(): ModelOption {
  return {
    value: 'gpt-5.4',
    label: 'GPT-5.4',
    description: 'GPT-5.4 · Advanced reasoning and code generation',
    descriptionForModel: 'GPT-5.4 - advanced reasoning and code generation capabilities',
  }
}

function getGpt53CodexOption(): ModelOption {
  return {
    value: 'gpt-5.3-codex',
    label: 'GPT-5.3 Codex',
    description: 'GPT-5.3 Codex · Optimized for code generation and understanding',
    descriptionForModel: 'GPT-5.3 Codex - specialized for code generation and understanding',
  }
}

function getGpt54MiniOption(): ModelOption {
  return {
    value: 'gpt-5.4-mini',
    label: 'GPT-5.4 Mini',
    description: 'GPT-5.4 Mini · Fast and efficient for simple tasks',
    descriptionForModel: 'GPT-5.4 Mini - fast and efficient for simple coding tasks',
  }
}

// Legacy model options for comprehensiveness
function getSonnet37Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: getModelStrings().sonnet37,
    label: 'Sonnet 3.7',
    description: `Sonnet 3.7 · Legacy${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
    descriptionForModel: 'Sonnet 3.7 - legacy version',
  }
}

function getSonnet40Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: getModelStrings().sonnet40,
    label: 'Sonnet 4.0',
    description: `Sonnet 4.0 · Legacy${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
    descriptionForModel: 'Sonnet 4.0 - legacy version',
  }
}

function getSonnet45Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: getModelStrings().sonnet45,
    label: 'Sonnet 4.5',
    description: `Sonnet 4.5 · Legacy${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
    descriptionForModel: 'Sonnet 4.5 - legacy version',
  }
}

function getOpus40Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: getModelStrings().opus40,
    label: 'Opus 4.0',
    description: `Opus 4.0 · Legacy${is3P ? '' : ` · ${formatModelPricing(COST_TIER_15_75)}`}`,
    descriptionForModel: 'Opus 4.0 - legacy version',
  }
}

function getOpus41OptionLegacy(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: getModelStrings().opus41,
    label: 'Opus 4.1',
    description: `Opus 4.1 · Legacy${is3P ? '' : ` · ${formatModelPricing(COST_TIER_15_75)}`}`,
    descriptionForModel: 'Opus 4.1 - legacy version',
  }
}

function getOpus45Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: getModelStrings().opus45,
    label: 'Opus 4.5',
    description: `Opus 4.5 · Legacy${is3P ? '' : ` · ${formatModelPricing(COST_TIER_5_25)}`}`,
    descriptionForModel: 'Opus 4.5 - legacy version',
  }
}

function getHaiku35OptionLegacy(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: getModelStrings().haiku35,
    label: 'Haiku 3.5',
    description: `Haiku 3.5 · Legacy${is3P ? '' : ` · ${formatModelPricing(COST_HAIKU_35)}`}`,
    descriptionForModel: 'Haiku 3.5 - legacy version',
  }
}

function getMaxOpusOption(fastMode = false): ModelOption {
  return {
    value: 'opus',
    label: 'Opus',
    description: `Opus 4.6 · Most capable for complex work${fastMode ? getOpus46PricingSuffix(true) : ''}`,
  }
}

export function getMaxSonnet46_1MOption(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  const billingInfo = isClaudeAISubscriber() ? ' · Billed as extra usage' : ''
  return {
    value: 'sonnet[1m]',
    label: 'Sonnet (1M context)',
    description: `Sonnet 4.6 with 1M context${billingInfo}${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
  }
}

export function getMaxOpus46_1MOption(fastMode = false): ModelOption {
  const billingInfo = isClaudeAISubscriber() ? ' · Billed as extra usage' : ''
  return {
    value: 'opus[1m]',
    label: 'Opus (1M context)',
    description: `Opus 4.6 with 1M context${billingInfo}${getOpus46PricingSuffix(fastMode)}`,
  }
}

function getMergedOpus1MOption(fastMode = false): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: is3P ? getModelStrings().opus46 + '[1m]' : 'opus[1m]',
    label: 'Opus (1M context)',
    description: `Opus 4.6 with 1M context · Most capable for complex work${!is3P && fastMode ? getOpus46PricingSuffix(fastMode) : ''}`,
    descriptionForModel:
      'Opus 4.6 with 1M context - most capable for complex work',
  }
}

const MaxSonnet46Option: ModelOption = {
  value: 'sonnet',
  label: 'Sonnet',
  description: 'Sonnet 4.6 · Best for everyday tasks',
}

const MaxHaiku45Option: ModelOption = {
  value: 'haiku',
  label: 'Haiku',
  description: 'Haiku 4.5 · Fastest for quick answers',
}

function getOpusPlanOption(): ModelOption {
  return {
    value: 'opusplan',
    label: 'Opus Plan Mode',
    description: 'Use Opus 4.6 in plan mode, Sonnet 4.6 otherwise',
  }
}

/**
 * Generic model option builder — creates a ModelOption for any Claude model key.
 * Used by internal subscriber catalog to display all available models.
 */
function getClaudeModelOption(
  key: ModelKey,
  label: string,
  description: string,
  pricing?: string,
): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  const value = isInternalSubscriber() ? key : getModelStrings()[key]
  return {
    value,
    label,
    description: `${description}${is3P ? '' : pricing ? ` · ${pricing}` : ''}`,
    descriptionForModel: description,
  }
}

function getAllPlanClaudeModelOptions(): ModelOption[] {
  return [
    getClaudeModelOption('fable51', 'Fable 5.1', 'Fable 5.1 - Claude 5 class model (enhanced)', formatModelPricing(COST_FABLE_51)),
    getClaudeModelOption('opus55', 'Opus 5.5', 'Opus 5.5 - newest generation', formatModelPricing(COST_OPUS_55)),
    getClaudeModelOption('sonnet55', 'Sonnet 5.5', 'Sonnet 5.5 - newest generation', formatModelPricing(COST_SONNET_55)),
    getClaudeModelOption('haiku55', 'Haiku 5.5', 'Haiku 5.5 - newest generation (tiered)', formatModelPricing(COST_HAIKU_55)),
    getClaudeModelOption('fable5', 'Fable 5', 'Fable 5 - Claude 5 class model', formatModelPricing(COST_TIER_10_50)),
    getClaudeModelOption('opus5', 'Opus 5', 'Opus 5 - legacy version', formatModelPricing(COST_TIER_5_25)),
    getClaudeModelOption('opus48', 'Opus 4.8', 'Opus 4.8 - legacy version', formatModelPricing(COST_TIER_5_25)),
    getClaudeModelOption('opus47', 'Opus 4.7', 'Opus 4.7 - legacy version', formatModelPricing(COST_TIER_5_25)),
    getClaudeModelOption('opus46', 'Opus 4.6', 'Opus 4.6 - legacy version', formatModelPricing(COST_TIER_5_25)),
    getClaudeModelOption('opus3', 'Opus 3', 'Opus 3 - legacy version', formatModelPricing(COST_TIER_15_75)),
    getClaudeModelOption('sonnet5', 'Sonnet 5', 'Sonnet 5 - legacy version', formatModelPricing(COST_SONNET_5)),
    getClaudeModelOption('sonnet46', 'Sonnet 4.6', 'Sonnet 4.6 - legacy version', formatModelPricing(COST_TIER_3_15)),
    getClaudeModelOption('haiku45', 'Haiku 4.5', 'Haiku 4.5 - legacy version', formatModelPricing(COST_HAIKU_45)),
  ]
}

function getInternalClaudeModelOptions(): ModelOption[] {
  return [
    getClaudeModelOption('mythos5', 'Mythos 5', 'Mythos 5 - Claude 5 class (no safety classifiers)', formatModelPricing(COST_TIER_10_50)),
    getClaudeModelOption('mythos51', 'Mythos 5.1', 'Mythos 5.1 - Claude 5 class (enhanced, no safety)', formatModelPricing(COST_TIER_10_50)),
    ...getAllPlanClaudeModelOptions(),
  ]
}

function getModelOptionsBase(fastMode = false): ModelOption[] {
  // Internal GitHub org subscribers — full Claude model catalog (sync with system/modelid.txt)
  // Only Claude family models displayed — no GPT/Codex models
  if (isInternalSubscriber()) {
    // Models are ordered by family and ascending version; every value is
    // versioned so prompt selection cannot fall back to a moving alias.
    return [getDefaultOptionForUser(fastMode), ...getInternalClaudeModelOptions()]
  }

  if (process.env.USER_TYPE === 'ant') {
    // Build options from antModels config
    const antModelOptions: ModelOption[] = getAntModels().map(m => ({
      value: m.alias,
      label: m.label,
      description: m.description ?? `[ANT-ONLY] ${m.label} (${m.model})`,
    }))

    return [
      getDefaultOptionForUser(),
      ...antModelOptions,
      getMergedOpus1MOption(fastMode),
      getSonnet46Option(),
      getSonnet46_1MOption(),
      getHaiku45Option(),
    ]
  }

  // Codex subscribers get OpenAI model options
  if (isCodexSubscriber()) {
    return [
      getDefaultOptionForUser(),
      getGpt54Option(),
      getGpt53CodexOption(),
      getGpt54MiniOption(),
    ]
  }

  if (isClaudeAISubscriber()) {
    // Claude plan users receive the complete non-Mythos catalog.
    return [getDefaultOptionForUser(fastMode), ...getAllPlanClaudeModelOptions()]
  }

  // PAYG 1P API: Default (Sonnet) + Sonnet 1M + Opus 4.6 + Opus 1M + Haiku
  if (getAPIProvider() === 'firstParty') {
    const payg1POptions = [getDefaultOptionForUser(fastMode)]
    if (checkSonnet1mAccess()) {
      payg1POptions.push(getSonnet46_1MOption())
    }
    if (isOpus1mMergeEnabled()) {
      payg1POptions.push(getMergedOpus1MOption(fastMode))
    } else {
      payg1POptions.push(getOpus46Option(fastMode))
      if (checkOpus1mAccess()) {
        payg1POptions.push(getOpus46_1MOption(fastMode))
      }
    }
    payg1POptions.push(getHaiku45Option())
    payg1POptions.push(getSonnet37Option())
    payg1POptions.push(getSonnet40Option())
    payg1POptions.push(getSonnet45Option())
    payg1POptions.push(getOpus40Option())
    payg1POptions.push(getOpus41OptionLegacy())
    payg1POptions.push(getOpus45Option())
    payg1POptions.push(getHaiku35OptionLegacy())
    payg1POptions.push(getFable5Option(fastMode))
    payg1POptions.push(getMythos5Option(fastMode))
    payg1POptions.push(getGpt54Option())
    payg1POptions.push(getGpt53CodexOption())
    payg1POptions.push(getGpt54MiniOption())
    return payg1POptions
  }

  // PAYG 3P: Default (Sonnet 4.5) + Sonnet (3P custom) or Sonnet 4.6/1M + Opus (3P custom) or Opus 4.1/Opus 4.6/Opus1M + Haiku + Opus 4.1
  const payg3pOptions = [getDefaultOptionForUser(fastMode)]

  const customSonnet = getCustomSonnetOption()
  if (customSonnet !== undefined) {
    payg3pOptions.push(customSonnet)
  } else {
    // Add Sonnet 4.6 since Sonnet 4.5 is the default
    payg3pOptions.push(getSonnet46Option())
    if (checkSonnet1mAccess()) {
      payg3pOptions.push(getSonnet46_1MOption())
    }
  }

  const customOpus = getCustomOpusOption()
  if (customOpus !== undefined) {
    payg3pOptions.push(customOpus)
  } else {
    // Add Opus 4.1, Opus 4.6 and Opus 4.6 1M
    payg3pOptions.push(getOpus55Option()) // This is the default opus
    payg3pOptions.push(getOpus46Option(fastMode))
    if (checkOpus1mAccess()) {
      payg3pOptions.push(getOpus46_1MOption(fastMode))
    }
  }
  const customHaiku = getCustomHaikuOption()
  if (customHaiku !== undefined) {
    payg3pOptions.push(customHaiku)
  } else {
    payg3pOptions.push(getHaikuOption())
  }
  payg3pOptions.push(getSonnet37Option())
  payg3pOptions.push(getSonnet40Option())
  payg3pOptions.push(getSonnet45Option())
  payg3pOptions.push(getOpus40Option())
  payg3pOptions.push(getOpus45Option())
  payg3pOptions.push(getHaiku35OptionLegacy())
  payg3pOptions.push(getClaudeModelOption('haiku55', 'Haiku 5.5', 'Haiku 5.5 - fastest for quick answers'))
  payg3pOptions.push(getClaudeModelOption('opus55', 'Opus 5.5', 'Opus 5.5 - most capable for complex work'))
  payg3pOptions.push(getClaudeModelOption('sonnet55', 'Sonnet 5.5', 'Sonnet 5.5 - best for everyday tasks'))
  payg3pOptions.push(getClaudeModelOption('fable51', 'Fable 5.1', 'Fable 5.1 - Claude 5 class model'))
  payg3pOptions.push(getGpt54Option())
  payg3pOptions.push(getGpt53CodexOption())
  payg3pOptions.push(getGpt54MiniOption())
  return payg3pOptions
}

// @[MODEL LAUNCH]: Add the new model ID to the appropriate family pattern below
// so the "newer version available" hint works correctly.
/**
 * Map a full model name to its family alias and the marketing name of the
 * version the alias currently resolves to. Used to detect when a user has
 * a specific older version pinned and a newer one is available.
 */
function getModelFamilyInfo(
  model: string,
): { alias: string; currentVersionName: string } | null {
  const canonical = getCanonicalName(model)

  // Sonnet family
  if (
    canonical.includes('claude-sonnet-4-6') ||
    canonical.includes('claude-sonnet-4-5') ||
    canonical.includes('claude-sonnet-4-') ||
    canonical.includes('claude-3-7-sonnet') ||
    canonical.includes('claude-3-5-sonnet')
  ) {
    const currentName = getMarketingNameForModel(getDefaultSonnetModel())
    if (currentName) {
      return { alias: 'Sonnet', currentVersionName: currentName }
    }
  }

  // Opus family
  if (canonical.includes('claude-opus-4')) {
    const currentName = getMarketingNameForModel(getDefaultOpusModel())
    if (currentName) {
      return { alias: 'Opus', currentVersionName: currentName }
    }
  }

  // Haiku family
  if (
    canonical.includes('claude-haiku') ||
    canonical.includes('claude-3-5-haiku')
  ) {
    const currentName = getMarketingNameForModel(getDefaultHaikuModel())
    if (currentName) {
      return { alias: 'Haiku', currentVersionName: currentName }
    }
  }

  // Fable family (Claude 5 class, above Opus tier)
  if (canonical.includes('claude-fable-5')) {
    return {
      alias: 'Fable',
      currentVersionName: getMarketingNameForModel(getDefaultFableModel()) ?? 'Fable 5.1',
    }
  }

  // Mythos family (Claude 5 class, above Opus tier)
  if (canonical.includes('claude-mythos-5')) {
    return {
      alias: 'Mythos',
      currentVersionName: getMarketingNameForModel(getDefaultMythosModel()) ?? 'Mythos 5.1',
    }
  }

  return null
}

/**
 * Returns a ModelOption for a known Anthropic model with a human-readable
 * label, and an upgrade hint if a newer version is available via the alias.
 * Returns null if the model is not recognized.
 */
function getKnownModelOption(model: string): ModelOption | null {
  const marketingName = getMarketingNameForModel(model)
  if (!marketingName) return null

  const familyInfo = getModelFamilyInfo(model)
  if (!familyInfo) {
    return {
      value: model,
      label: marketingName,
      description: model,
    }
  }

  // Check if the alias currently resolves to a different (newer) version
  if (marketingName !== familyInfo.currentVersionName) {
    return {
      value: model,
      label: marketingName,
      description: `Newer version available · select ${familyInfo.alias} for ${familyInfo.currentVersionName}`,
    }
  }

  // Same version as the alias — just show the friendly name
  return {
    value: model,
    label: marketingName,
    description: model,
  }
}

export function getModelOptions(fastMode = false): ModelOption[] {
  const options = getModelOptionsBase(fastMode)

  // Add the custom model from the ANTHROPIC_CUSTOM_MODEL_OPTION env var
  const envCustomModel = process.env.ANTHROPIC_CUSTOM_MODEL_OPTION
  if (
    envCustomModel &&
    !options.some(existing => existing.value === envCustomModel)
  ) {
    options.push({
      value: envCustomModel,
      label: process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_NAME ?? envCustomModel,
      description:
        process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION ??
        `Custom model (${envCustomModel})`,
    })
  }

  // Append additional model options fetched during bootstrap
  for (const opt of getGlobalConfig().additionalModelOptionsCache ?? []) {
    if (!options.some(existing => existing.value === opt.value)) {
      options.push(opt)
    }
  }

  // Add custom model from either the current model value or the initial one
  // if it is not already in the options.
  let customModel: ModelSetting = null
  const currentMainLoopModel = getUserSpecifiedModelSetting()
  const initialMainLoopModel = getInitialMainLoopModel()
  if (currentMainLoopModel !== undefined && currentMainLoopModel !== null) {
    customModel = currentMainLoopModel
  } else if (initialMainLoopModel !== null) {
    customModel = initialMainLoopModel
  }
  if (customModel === null || options.some(opt => opt.value === customModel)) {
    return filterModelOptionsByAllowlist(options)
  } else if (customModel === 'opusplan') {
    return filterModelOptionsByAllowlist([...options, getOpusPlanOption()])
  } else if (customModel === 'opus' && getAPIProvider() === 'firstParty') {
    return filterModelOptionsByAllowlist([
      ...options,
      getMaxOpusOption(fastMode),
    ])
  } else if (customModel === 'opus[1m]' && getAPIProvider() === 'firstParty') {
    return filterModelOptionsByAllowlist([
      ...options,
      getMergedOpus1MOption(fastMode),
    ])
  } else {
    // Try to show a human-readable label for known Anthropic models, with an
    // upgrade hint if the alias now resolves to a newer version.
    const knownOption = getKnownModelOption(customModel)
    if (knownOption) {
      options.push(knownOption)
    } else {
      options.push({
        value: customModel,
        label: customModel,
        description: 'Custom model',
      })
    }
    return filterModelOptionsByAllowlist(options)
  }
}

/**
 * Filter model options by the availableModels allowlist.
 * Always preserves the "Default" option (value: null).
 */
function filterModelOptionsByAllowlist(options: ModelOption[]): ModelOption[] {
  const settings = getSettings_DEPRECATED() || {}
  if (!settings.availableModels) {
    return options // No restrictions
  }
  return options.filter(
    opt =>
      opt.value === null || (opt.value !== null && isModelAllowed(opt.value)),
  )
}
