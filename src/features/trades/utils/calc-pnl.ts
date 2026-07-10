/** Entry/exit P&L for gold (100oz/lot), shared between the live form preview and the save action. */
export function calcPnl(direction: 'buy' | 'sell', entry: number, exit: number, lots: number): number {
  return direction === 'buy' ? (exit - entry) * lots * 100 : (entry - exit) * lots * 100
}
