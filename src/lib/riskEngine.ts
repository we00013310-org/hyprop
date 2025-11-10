import { supabase } from './supabase';

interface AccountEquity {
  accountId: string;
  balance: number;
  upnl: number;
  rpnl: number;
  feesAccrued: number;
  fundingAccrued: number;
  ddMax: number;
  ddDaily: number;
  eDayStart: number;
  highWaterMark: number;
  accountMode: '1-step' | '2-step';
}

export class RiskEngine {
  static calculateEquity(account: AccountEquity): number {
    return account.balance + account.upnl - account.feesAccrued - account.fundingAccrued;
  }

  static checkDailyDrawdown(account: AccountEquity): { breach: boolean; equity: number } {
    const equity = this.calculateEquity(account);
    const dailyThreshold = account.eDayStart - account.ddDaily;

    return {
      breach: equity <= dailyThreshold,
      equity,
    };
  }

  static checkMaxDrawdown(account: AccountEquity): { breach: boolean; equity: number; threshold: number } {
    const equity = this.calculateEquity(account);
    let threshold: number;

    if (account.accountMode === '1-step') {
      threshold = account.balance - account.ddMax;
    } else {
      threshold = account.highWaterMark - account.ddMax;
    }

    return {
      breach: equity <= threshold,
      equity,
      threshold,
    };
  }

  static async enforceDrawdownRules(accountId: string): Promise<void> {
    const { data: fundedAccount } = await supabase
      .from('funded_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (!fundedAccount) return;

    const { data: positions } = await supabase
      .from('positions')
      .select('*')
      .eq('account_id', accountId);

    const totalUpnl = positions?.reduce((sum, p) => sum + p.upnl, 0) || 0;
    const totalRpnl = positions?.reduce((sum, p) => sum + p.rpnl, 0) || 0;
    const totalFees = positions?.reduce((sum, p) => sum + p.fees_accrued, 0) || 0;
    const totalFunding = positions?.reduce((sum, p) => sum + p.funding_accrued, 0) || 0;

    const accountEquity: AccountEquity = {
      accountId,
      balance: fundedAccount.balance_actual,
      upnl: totalUpnl,
      rpnl: totalRpnl,
      feesAccrued: totalFees,
      fundingAccrued: totalFunding,
      ddMax: fundedAccount.dd_max,
      ddDaily: fundedAccount.dd_daily,
      eDayStart: fundedAccount.e_day_start || fundedAccount.e_start,
      highWaterMark: fundedAccount.high_water_mark,
      accountMode: '2-step',
    };

    const dailyCheck = this.checkDailyDrawdown(accountEquity);
    if (dailyCheck.breach) {
      await this.handleDailyDrawdownBreach(accountId, dailyCheck.equity);
      return;
    }

    const maxCheck = this.checkMaxDrawdown(accountEquity);
    if (maxCheck.breach) {
      await this.handleMaxDrawdownBreach(accountId, maxCheck.equity);
      return;
    }

    await this.updateHighWaterMark(accountId, dailyCheck.equity, fundedAccount.high_water_mark);
  }

  private static async handleDailyDrawdownBreach(accountId: string, equity: number): Promise<void> {
    await supabase
      .from('funded_accounts')
      .update({ status: 'paused' })
      .eq('id', accountId);

    await supabase.from('events').insert({
      account_id: accountId,
      type: 'BREACH_DAILY',
      payload: { equity, timestamp: new Date().toISOString() },
    });

    await supabase.from('equity_snapshots').insert({
      account_id: accountId,
      equity,
      peak_equity_cached: 0,
      daily_drawdown_flag: true,
      max_drawdown_flag: false,
    });
  }

  private static async handleMaxDrawdownBreach(accountId: string, equity: number): Promise<void> {
    await supabase
      .from('funded_accounts')
      .update({ status: 'failed' })
      .eq('id', accountId);

    await supabase.from('events').insert({
      account_id: accountId,
      type: 'BREACH_MAX',
      payload: { equity, timestamp: new Date().toISOString() },
    });

    await supabase.from('equity_snapshots').insert({
      account_id: accountId,
      equity,
      peak_equity_cached: 0,
      daily_drawdown_flag: false,
      max_drawdown_flag: true,
    });
  }

  private static async updateHighWaterMark(accountId: string, currentEquity: number, currentHWM: number): Promise<void> {
    if (currentEquity > currentHWM) {
      await supabase
        .from('funded_accounts')
        .update({ high_water_mark: currentEquity })
        .eq('id', accountId);
    }
  }

  static async handleWithdrawal(accountId: string, withdrawalAmount: number): Promise<void> {
    const { data: account } = await supabase
      .from('funded_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (!account) return;

    const newHWM = Math.max(account.high_water_mark - withdrawalAmount, account.e_start);

    await supabase
      .from('funded_accounts')
      .update({ high_water_mark: newHWM })
      .eq('id', accountId);

    await supabase.from('events').insert({
      account_id: accountId,
      type: 'WITHDRAW_PROFIT',
      payload: { amount: withdrawalAmount, newHWM, timestamp: new Date().toISOString() },
    });
  }

  static async resetDailyDrawdown(): Promise<void> {
    const { data: activeAccounts } = await supabase
      .from('funded_accounts')
      .select('id, balance_actual')
      .in('status', ['active', 'paused']);

    if (!activeAccounts) return;

    for (const account of activeAccounts) {
      const { data: positions } = await supabase
        .from('positions')
        .select('upnl, fees_accrued, funding_accrued')
        .eq('account_id', account.id);

      const totalUpnl = positions?.reduce((sum, p) => sum + p.upnl, 0) || 0;
      const totalFees = positions?.reduce((sum, p) => sum + p.fees_accrued, 0) || 0;
      const totalFunding = positions?.reduce((sum, p) => sum + p.funding_accrued, 0) || 0;

      const currentEquity = account.balance_actual + totalUpnl - totalFees - totalFunding;

      await supabase
        .from('funded_accounts')
        .update({
          e_day_start: currentEquity,
          status: 'active'
        })
        .eq('id', account.id);

      await supabase.from('events').insert({
        account_id: account.id,
        type: 'DAILY_RESET',
        payload: { e_day_start: currentEquity, timestamp: new Date().toISOString() },
      });
    }
  }
}
