// Currency formatting utility for Sri Lankan Rupees

export const formatCurrency = (amount: number, showDecimals = true): string => {
  if (showDecimals) {
    return `Rs. ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `Rs. ${amount.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
};

export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `Rs. ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `Rs. ${(amount / 1000).toFixed(1)}k`;
  }
  return `Rs. ${amount.toLocaleString('en-LK')}`;
};