// Helper functions for YourProposal

// Helper function to format numbers as currency with commas
export function formatCurrency(val: string | number) {
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.]/g, '')) : val;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
} 