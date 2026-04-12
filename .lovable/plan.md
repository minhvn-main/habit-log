

## Bugfix and UI Tweaks for Habit Cards

### 1. Fix "51 of 28 days" calculation bug

**Root cause**: In `UnifiedHabitCard.tsx` line 126, the progress text for `consecutive-days` shows `stats.currentStreak` which can exceed the goal target if the user continued after completing. Same issue applies to `number-of-times` on line 129 where `stats.totalDone` can exceed `habit.goalTarget`.

**Fix**: Cap the displayed value at `habit.goalTarget` using `Math.min()`:
- Line 126: `Math.min(stats.currentStreak, habit.goalTarget)` 
- Line 129: `Math.min(stats.totalDone, habit.goalTarget)`

### 2. Make habit cards shorter -- move frequency to bottom stats row

**Current layout** (4 rows):
1. Name + status label
2. Description
3. Goal pill + Frequency pill
4. Progress bar + indicators

**New layout** (3 content rows + compact bottom):
1. Name + status label (inline, truncated)
2. Description (if any)
3. Goal pill only (no frequency here)
4. Progress bar
5. Bottom row: checkmark count, X count, frequency (right-aligned)

Remove frequency from Row 3 and place it in a new compact bottom stats row after the progress bar, right-aligned, on the same line as the done/skipped counters. This replaces the current right-side stats panel for the `habits` variant.

### 3. Status labels inline with name, no layout shift

Move PAUSED/ARCHIVED/COMPLETED labels to sit directly to the right of the habit name in the same flex row. The name truncates with `truncate` and `min-w-0` to prevent overflow. The label uses `flex-shrink-0` so it never wraps or pushes other content.

### Files to modify

| File | Change |
|------|--------|
| `src/components/UnifiedHabitCard.tsx` | Cap progress text values, restructure card layout (frequency to bottom, labels inline with name, remove right stats panel) |

### Technical details

**Progress text fix** (lines 124-130):
```tsx
case "consecutive-days":
  leftText = `${Math.min(stats.currentStreak, habit.goalTarget)} of ${habit.goalTarget} days done`;
  break;
case "number-of-times":
  leftText = `${Math.min(stats.totalDone, habit.goalTarget)} of ${habit.goalTarget} times done`;
  break;
```

**New card structure** (simplified):
```tsx
<div className="habit-card-compact flex flex-col">
  {/* Stripe */}
  <div className="w-1 absolute left-0 top-0 bottom-0 ..." />
  
  {/* Row 1: Name + inline status label */}
  <div className="flex items-center gap-2 mb-1">
    <h3 className="font-semibold text-base truncate min-w-0">{habit.name}</h3>
    {isPaused && <span className="flex-shrink-0 text-xs ...">PAUSED</span>}
    {isArchived && <span className="flex-shrink-0 text-xs ...">ARCHIVED</span>}
    {isFinished && <span className="flex-shrink-0 text-xs ...">COMPLETED</span>}
  </div>

  {/* Row 2: Description */}
  {habit.description && <p className="text-sm text-muted-foreground mb-1">...</p>}

  {/* Row 3: Goal pill only */}
  <div className="mb-2">
    <span className="goal-pill">{goalDisplay.icon} {goalDisplay.text}</span>
  </div>

  {/* Row 4: Progress bar */}
  <div className="mb-2">
    <div className="progress-bar">...</div>
    <div className="flex justify-between mt-1">
      <span>{progressText.left}</span>
      <span>{progressText.right}</span>
    </div>
  </div>

  {/* Row 5: Stats + frequency bottom row */}
  <div className="flex items-center gap-3 text-xs text-muted-foreground">
    <span className="text-emerald-600">checkmark {stats.totalDone}</span>
    <span className="text-muted-foreground">x {stats.totalSkipped}</span>
    <span className="ml-auto">{frequencyDisplay}</span>
    {variant === 'today' && (
      <button onClick={handleToggle} className={getToggleClass()}>{getToggleIcon()}</button>
    )}
  </div>
</div>
```

This removes the separate right-side stats/toggle column. For the `today` variant, the toggle button sits at the far right of the bottom row. For the `habits` variant, just stats + frequency are shown.

