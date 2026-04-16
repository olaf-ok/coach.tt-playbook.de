export type SheetState = 'peek' | 'expanded';
export type SheetAction = 'toggle' | 'open' | 'close';

export function nextSheetState(current: SheetState, action: SheetAction): SheetState {
  switch (action) {
    case 'open':
      return 'expanded';
    case 'close':
      return 'peek';
    case 'toggle':
      return current === 'peek' ? 'expanded' : 'peek';
  }
}
