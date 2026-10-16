import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InvokeSplit } from '../components/InvokeSplit';
import { invokeLineupLabel, invokeOptionsLabel, invokeSheetLabel } from '../config';

describe('InvokeSplit', () => {
  it('mestre_Seta_OfereceFichaECena', () => {
    const onInvokeSheet = vi.fn();
    const onInvokeScene = vi.fn();
    render(<InvokeSplit onInvokeSheet={onInvokeSheet} onInvokeScene={onInvokeScene} />);

    fireEvent.click(screen.getByRole('button', { name: 'Invocar' }));
    expect(onInvokeSheet).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: invokeOptionsLabel }));
    fireEvent.click(screen.getByRole('menuitem', { name: invokeSheetLabel }));
    expect(onInvokeSheet).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: invokeOptionsLabel }));
    fireEvent.click(screen.getByRole('menuitem', { name: invokeLineupLabel }));
    expect(onInvokeScene).toHaveBeenCalledTimes(1);
  });
});
