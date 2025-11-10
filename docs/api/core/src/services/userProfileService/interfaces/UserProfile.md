[**serenity-notes v0.1.0**](../../../../../README.md)

***

[serenity-notes](../../../../../README.md) / [core/src/services/userProfileService](../README.md) / UserProfile

# Interface: UserProfile

Defined in: [packages/core/src/services/userProfileService.ts:10](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L10)

## Properties

### productivityPeakHours

> **productivityPeakHours**: `number`[]

Defined in: [packages/core/src/services/userProfileService.ts:12](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L12)

***

### averageTasksPerWeek

> **averageTasksPerWeek**: `number`

Defined in: [packages/core/src/services/userProfileService.ts:13](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L13)

***

### averageDailyTasks

> **averageDailyTasks**: `number`

Defined in: [packages/core/src/services/userProfileService.ts:14](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L14)

***

### completionRateHistory

> **completionRateHistory**: `object`[]

Defined in: [packages/core/src/services/userProfileService.ts:15](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L15)

#### date

> **date**: `string`

#### rate

> **rate**: `number`

***

### currentCompletionRate

> **currentCompletionRate**: `number`

Defined in: [packages/core/src/services/userProfileService.ts:16](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L16)

***

### workStyle

> **workStyle**: `"sprinter"` \| `"marathon"` \| `"balanced"`

Defined in: [packages/core/src/services/userProfileService.ts:19](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L19)

***

### focusAreas

> **focusAreas**: `string`[]

Defined in: [packages/core/src/services/userProfileService.ts:20](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L20)

***

### communicationPreference

> **communicationPreference**: `"detailed"` \| `"concise"`

Defined in: [packages/core/src/services/userProfileService.ts:21](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L21)

***

### activeGoals

> **activeGoals**: [`Goal`](../../../interfaces/Goal.md)[]

Defined in: [packages/core/src/services/userProfileService.ts:24](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L24)

***

### goalCompletionRate

> **goalCompletionRate**: `number`

Defined in: [packages/core/src/services/userProfileService.ts:25](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L25)

***

### recentAchievements

> **recentAchievements**: `object`[]

Defined in: [packages/core/src/services/userProfileService.ts:26](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L26)

#### goal

> **goal**: `string`

#### completedAt

> **completedAt**: `string`

***

### commonTags

> **commonTags**: `object`[]

Defined in: [packages/core/src/services/userProfileService.ts:29](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L29)

#### tag

> **tag**: `string`

#### frequency

> **frequency**: `number`

***

### topProjects

> **topProjects**: `object`[]

Defined in: [packages/core/src/services/userProfileService.ts:30](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L30)

#### project

> **project**: `string`

#### taskCount

> **taskCount**: `number`

***

### journalingFrequency

> **journalingFrequency**: `"daily"` \| `"weekly"` \| `"sporadic"` \| `"none"`

Defined in: [packages/core/src/services/userProfileService.ts:31](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L31)

***

### journalingDays

> **journalingDays**: `number`[]

Defined in: [packages/core/src/services/userProfileService.ts:32](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L32)

***

### journalingHours

> **journalingHours**: `number`[]

Defined in: [packages/core/src/services/userProfileService.ts:33](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L33)

***

### moodDistribution

> **moodDistribution**: `Record`\<`string`, `number`\>

Defined in: [packages/core/src/services/userProfileService.ts:36](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L36)

***

### sentimentTrend

> **sentimentTrend**: `"improving"` \| `"stable"` \| `"declining"`

Defined in: [packages/core/src/services/userProfileService.ts:37](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L37)

***

### stressIndicators

> **stressIndicators**: `string`[]

Defined in: [packages/core/src/services/userProfileService.ts:38](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L38)

***

### insightPreferences

> **insightPreferences**: `object`

Defined in: [packages/core/src/services/userProfileService.ts:41](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L41)

#### preferredCategories

> **preferredCategories**: `string`[]

#### preferredTypes

> **preferredTypes**: `string`[]

#### actedOnInsights

> **actedOnInsights**: `string`[]

#### dismissedInsights

> **dismissedInsights**: `string`[]

#### avgEngagementTime

> **avgEngagementTime**: `number`

***

### profileCreatedAt

> **profileCreatedAt**: `string`

Defined in: [packages/core/src/services/userProfileService.ts:50](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L50)

***

### lastUpdated

> **lastUpdated**: `string`

Defined in: [packages/core/src/services/userProfileService.ts:51](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L51)

***

### dataPointsAnalyzed

> **dataPointsAnalyzed**: `number`

Defined in: [packages/core/src/services/userProfileService.ts:52](https://github.com/digitaltracer/serenity/blob/improv/code-improvements/packages/core/src/services/userProfileService.ts#L52)
